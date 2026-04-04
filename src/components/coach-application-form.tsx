"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface FormData {
  // Step 1 — Contact
  full_name: string;
  email: string;
  phone: string;
  address: string;

  // Step 2 — Experience
  current_division: string;
  years_experience: string;
  previous_allstar_experience: string;

  // Step 3 — Philosophy
  coaching_philosophy: string;
  player_development_approach: string;
  communication_style: string;
  tournament_experience: string;

  // Step 4 — Compliance & Submit
  consent_background_check: boolean;
  consent_safety_certs: boolean;
  agree_pony_rules: boolean;
  agree_ipb_policies: boolean;
  commit_full_season: boolean;
  why_manage: string;
  unique_qualities: string;
  additional_comments: string;
}

const INITIAL_DATA: FormData = {
  full_name: "",
  email: "",
  phone: "",
  address: "",
  current_division: "",
  years_experience: "",
  previous_allstar_experience: "",
  coaching_philosophy: "",
  player_development_approach: "",
  communication_style: "",
  tournament_experience: "",
  consent_background_check: false,
  consent_safety_certs: false,
  agree_pony_rules: false,
  agree_ipb_policies: false,
  commit_full_season: false,
  why_manage: "",
  unique_qualities: "",
  additional_comments: "",
};

const STORAGE_KEY = "coach_application_draft";

const STEPS = [
  { label: "Contact" },
  { label: "Experience" },
  { label: "Philosophy" },
  { label: "Submit" },
];

const DIVISIONS = [
  "5U-Shetland",
  "6U-Shetland",
  "7U MP-Pinto",
  "7U KP-Pinto",
  "8U MP-Pinto",
  "8U KP-Pinto",
  "9U-Mustang",
  "10U-Mustang",
  "11U-Bronco",
  "12U-Bronco",
  "13U-Pony",
  "14U-Pony",
];

function Label({
  htmlFor,
  required,
  children,
}: {
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block font-display text-sm font-semibold uppercase tracking-wide text-charcoal mb-1.5"
    >
      {children}
      {required && <span className="text-flag-red ml-1">*</span>}
    </label>
  );
}

const inputClasses =
  "w-full min-h-[44px] rounded-xl border border-dirt bg-white px-4 py-3 text-base text-charcoal placeholder:text-gray-400 focus:border-star-gold focus:ring-2 focus:ring-star-gold/20 focus:outline-none transition-colors";

const selectClasses = `${inputClasses} appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%234B5563%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.168l3.71-3.938a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200l-4.25-4.5a.75.75%200%2001.02-1.06z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_12px_center] bg-no-repeat pr-10`;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-flag-red text-sm mt-1">{message}</p>;
}

const TOTAL_STEPS = 4;

export function CoachApplicationForm() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(INITIAL_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormData((prev) => ({ ...prev, ...parsed.data }));
        if (typeof parsed.step === "number" && parsed.step < TOTAL_STEPS)
          setStep(parsed.step);
      }
    } catch {
      // ignore
    }
  }, []);

  const saveDraft = useCallback(
    (data: FormData, currentStep: number) => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ data, step: currentStep })
        );
      } catch {
        // ignore
      }
    },
    []
  );

  useEffect(() => {
    saveDraft(formData, step);
  }, [formData, step, saveDraft]);

  function update(field: keyof FormData, value: string | boolean) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function validateStep(s: number): boolean {
    const errs: Record<string, string> = {};

    if (s === 0) {
      if (!formData.full_name.trim()) errs.full_name = "Name is required";
      if (!formData.email.trim()) errs.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim()))
        errs.email = "Enter a valid email address";
      if (!formData.phone.trim()) errs.phone = "Phone number is required";
    }

    if (s === 1) {
      if (!formData.current_division)
        errs.current_division = "Select your current division";
    }

    if (s === 3) {
      if (!formData.consent_background_check)
        errs.consent_background_check = "Required";
      if (!formData.consent_safety_certs)
        errs.consent_safety_certs = "Required";
      if (!formData.agree_pony_rules) errs.agree_pony_rules = "Required";
      if (!formData.agree_ipb_policies) errs.agree_ipb_policies = "Required";
      if (!formData.commit_full_season) errs.commit_full_season = "Required";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleNext() {
    if (validateStep(step)) {
      setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleBack() {
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit() {
    if (!validateStep(3)) {
      setSubmitError("Please check all required consent boxes before submitting.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    const payload = {
      full_name: formData.full_name,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      division_preference: formData.current_division,
      years_coaching: formData.years_experience
        ? Number(formData.years_experience)
        : null,
      previous_allstar_experience: formData.previous_allstar_experience,
      coaching_philosophy: formData.coaching_philosophy,
      player_development_approach: formData.player_development_approach,
      communication_style: formData.communication_style,
      tournament_experience: formData.tournament_experience,
      background_check_consent: formData.consent_background_check,
      safety_cert_consent: formData.consent_safety_certs,
      pony_rules_consent: formData.agree_pony_rules,
      ipb_policies_consent: formData.agree_ipb_policies,
      full_season_commitment: formData.commit_full_season,
      why_manage: formData.why_manage,
      unique_qualities: formData.unique_qualities,
      additional_comments: formData.additional_comments,
      submitted_at: new Date().toISOString(),
    };

    if (!supabase) {
      setSubmitting(false);
      setSubmitError(
        "Applications are temporarily unavailable. Please try again shortly."
      );
      return;
    }

    // Try up to 2 times for transient network issues
    let lastError: { message: string; code?: string; details?: string } | null = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      const { error } = await supabase
        .from("coach_applications")
        .insert(payload);
      if (!error) {
        lastError = null;
        break;
      }
      lastError = error;
      console.error(`Submit error (attempt ${attempt + 1}):`, error.message, error.code, error.details);
      // Don't retry on constraint violations
      if (error.code === "23505" || error.code === "23514") break;
      // Brief pause before retry
      if (attempt === 0) await new Promise((r) => setTimeout(r, 1000));
    }

    if (lastError) {
      setSubmitting(false);
      if (lastError.code === "23505") {
        setSubmitError(
          "An application with this email already exists. If you need to update your application, contact AllStars@irvinepony.com."
        );
      } else {
        setSubmitError(
          `Something went wrong submitting your application (${lastError.code || "network"}). Please try again. If the problem persists, contact AllStars@irvinepony.com.`
        );
      }
      return;
    }

    // Send confirmation email
    try {
      await fetch("/api/send-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "coach",
          name: formData.full_name,
          email: formData.email,
          division: formData.current_division,
        }),
      });
    } catch {
      // Email failure shouldn't block submission
    }

    setSubmitting(false);
    setSubmitted(true);
    localStorage.removeItem(STORAGE_KEY);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ── Success state ── */

  if (submitted) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8 md:p-12 text-center">
        <div className="text-5xl mb-4">&#9733;</div>
        <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide text-flag-blue mb-3">
          Application Submitted
        </h2>
        <p className="text-gray-600 text-lg leading-relaxed max-w-lg mx-auto mb-8">
          Thank you, {formData.full_name}! Your coach application for{" "}
          <strong>{formData.current_division}</strong> has been received. A
          confirmation email has been sent to{" "}
          <strong>{formData.email}</strong>.
        </p>

        <div className="bg-off-white rounded-2xl p-6 md:p-8 text-left max-w-md mx-auto">
          <h3 className="font-display text-lg font-semibold uppercase tracking-wide mb-4">
            What Happens Next
          </h3>
          <ul className="space-y-3 text-gray-600 text-sm leading-relaxed">
            <li className="flex gap-3">
              <span className="text-flag-red shrink-0">&#9733;</span>
              <span>
                The All-Stars Committee will review your application within 1-2
                weeks.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-flag-red shrink-0">&#9733;</span>
              <span>
                Background checks will be initiated.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-flag-red shrink-0">&#9733;</span>
              <span>
                Top candidates will be invited for a brief interview with the
                committee.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-flag-red shrink-0">&#9733;</span>
              <span>
                You will be notified of the final decision via email.
              </span>
            </li>
          </ul>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-gray-600 text-sm">
              Questions? Contact the All-Stars Coordinator at{" "}
              <a
                href="mailto:AllStars@irvinepony.com"
                className="text-flag-blue font-semibold hover:underline"
              >
                AllStars@irvinepony.com
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ── Progress bar ── */

  const progressBar = (
    <div className="mb-8 md:mb-10">
      <div className="hidden sm:flex items-center justify-between mb-2">
        {STEPS.map((s, i) => (
          <div
            key={s.label}
            className="flex items-center flex-1 last:flex-none"
          >
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-display text-sm font-bold transition-colors ${
                  i < step
                    ? "bg-flag-blue text-white"
                    : i === step
                    ? "bg-flag-red text-white"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                {i < step ? "\u2713" : i + 1}
              </div>
              <span
                className={`mt-1.5 font-display text-xs uppercase tracking-wider font-semibold ${
                  i <= step ? "text-charcoal" : "text-gray-400"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 mt-[-20px] ${
                  i < step ? "bg-flag-blue" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="font-display text-sm font-semibold uppercase tracking-wide text-charcoal">
            Step {step + 1} of {TOTAL_STEPS}
          </span>
          <span className="font-display text-sm font-semibold uppercase tracking-wide text-flag-red">
            {STEPS[step].label}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-flag-blue h-2 rounded-full transition-all duration-300"
            style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );

  /* ── Navigation buttons ── */

  const lastStep = TOTAL_STEPS - 1;

  const navButtons = (
    <div className="flex justify-between gap-4 mt-8">
      {step > 0 ? (
        <button
          type="button"
          onClick={handleBack}
          className="px-4 sm:px-6 py-3.5 rounded-full border-2 border-gray-200 font-display text-sm font-semibold uppercase tracking-widest text-gray-600 hover:border-gray-400 hover:text-charcoal transition-colors min-h-[44px]"
        >
          &larr; Back
        </button>
      ) : (
        <div />
      )}

      {step < lastStep ? (
        <button
          type="button"
          onClick={handleNext}
          className="px-4 sm:px-6 py-3.5 rounded-full bg-flag-blue text-white font-display text-sm font-semibold uppercase tracking-widest hover:bg-flag-blue-mid transition-colors min-h-[44px]"
        >
          Next &rarr;
        </button>
      ) : (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="px-6 sm:px-8 py-3.5 rounded-full bg-flag-red text-white font-display text-sm font-semibold uppercase tracking-widest hover:bg-flag-red-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
        >
          {submitting ? "Submitting..." : "Submit Application \u2605"}
        </button>
      )}
    </div>
  );

  /* ── Step renderers ── */

  function renderStep0() {
    return (
      <div className="space-y-5">
        <h2 className="font-display text-xl md:text-2xl font-bold uppercase tracking-wide mb-1">
          Contact Information
        </h2>
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          Let us know how to reach you.
        </p>

        <div>
          <Label htmlFor="full_name" required>
            Full Name
          </Label>
          <input
            id="full_name"
            type="text"
            className={inputClasses}
            placeholder="John Smith"
            value={formData.full_name}
            onChange={(e) => update("full_name", e.target.value)}
          />
          <FieldError message={errors.full_name} />
        </div>

        <div>
          <Label htmlFor="email" required>
            Email
          </Label>
          <input
            id="email"
            type="email"
            className={inputClasses}
            placeholder="john@example.com"
            value={formData.email}
            onChange={(e) => update("email", e.target.value)}
          />
          <FieldError message={errors.email} />
        </div>

        <div>
          <Label htmlFor="phone" required>
            Phone
          </Label>
          <input
            id="phone"
            type="tel"
            className={inputClasses}
            placeholder="(949) 555-1234"
            value={formData.phone}
            onChange={(e) => update("phone", e.target.value)}
          />
          <FieldError message={errors.phone} />
        </div>

        <div>
          <Label htmlFor="address">Address</Label>
          <input
            id="address"
            type="text"
            className={inputClasses}
            placeholder="123 Main St, Irvine, CA 92620"
            value={formData.address}
            onChange={(e) => update("address", e.target.value)}
          />
        </div>
      </div>
    );
  }

  function renderStep1() {
    return (
      <div className="space-y-5">
        <h2 className="font-display text-xl md:text-2xl font-bold uppercase tracking-wide mb-1">
          Experience &amp; Background
        </h2>
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          Tell us about your coaching background. You may only apply to coach
          the All-Star team in the division you are currently coaching.
        </p>

        <div>
          <Label htmlFor="current_division" required>
            Current Division Coaching
          </Label>
          <select
            id="current_division"
            className={selectClasses}
            value={formData.current_division}
            onChange={(e) => update("current_division", e.target.value)}
          >
            <option value="">Select your current division...</option>
            {DIVISIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <FieldError message={errors.current_division} />
        </div>

        <div>
          <Label htmlFor="years_experience">Seasons of Coaching Experience</Label>
          <input
            id="years_experience"
            type="number"
            min="0"
            max="50"
            className={inputClasses}
            placeholder="e.g. 5"
            value={formData.years_experience}
            onChange={(e) => update("years_experience", e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="previous_allstar_experience">
            Previous All-Star Experience
          </Label>
          <textarea
            id="previous_allstar_experience"
            rows={4}
            className={inputClasses}
            placeholder="Describe any previous All-Star coaching experience..."
            value={formData.previous_allstar_experience}
            onChange={(e) =>
              update("previous_allstar_experience", e.target.value)
            }
          />
        </div>
      </div>
    );
  }

  function renderStep2() {
    return (
      <div className="space-y-5">
        <h2 className="font-display text-xl md:text-2xl font-bold uppercase tracking-wide mb-1">
          Coaching Philosophy
        </h2>
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          Help us understand how you approach coaching All-Star players.
        </p>

        <div>
          <Label htmlFor="coaching_philosophy">Coaching Philosophy</Label>
          <textarea
            id="coaching_philosophy"
            rows={5}
            className={inputClasses}
            placeholder="Describe your approach to working with All-Star players..."
            value={formData.coaching_philosophy}
            onChange={(e) => update("coaching_philosophy", e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="player_development_approach">
            Player Development Approach
          </Label>
          <textarea
            id="player_development_approach"
            rows={5}
            className={inputClasses}
            placeholder="How will you handle player development and playing time?"
            value={formData.player_development_approach}
            onChange={(e) =>
              update("player_development_approach", e.target.value)
            }
          />
        </div>

        <div>
          <Label htmlFor="communication_style">Communication Style</Label>
          <textarea
            id="communication_style"
            rows={5}
            className={inputClasses}
            placeholder="Describe your communication style with players and parents..."
            value={formData.communication_style}
            onChange={(e) => update("communication_style", e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="tournament_experience">Tournament Experience</Label>
          <textarea
            id="tournament_experience"
            rows={5}
            className={inputClasses}
            placeholder="Describe your tournament coaching experience..."
            value={formData.tournament_experience}
            onChange={(e) => update("tournament_experience", e.target.value)}
          />
        </div>
      </div>
    );
  }

  function renderStep3() {
    const checkboxItems: {
      field: keyof FormData;
      label: string;
    }[] = [
      {
        field: "consent_background_check",
        label:
          "I consent to a background check as required by Irvine Pony Baseball.",
      },
      {
        field: "consent_safety_certs",
        label:
          "I agree to complete all required safety certifications before the season begins.",
      },
      {
        field: "agree_pony_rules",
        label: "I agree to abide by all PONY Baseball rules and regulations.",
      },
      {
        field: "agree_ipb_policies",
        label:
          "I agree to follow all Irvine Pony Baseball policies and procedures.",
      },
      {
        field: "commit_full_season",
        label:
          "I commit to being available for the full All-Star season (May through July).",
      },
    ];

    return (
      <div className="space-y-5">
        <h2 className="font-display text-xl md:text-2xl font-bold uppercase tracking-wide mb-1">
          Compliance &amp; Final Questions
        </h2>
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          Review and agree to the following, then tell us why you want to lead
          this team.
        </p>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 md:p-6 space-y-4">
          {checkboxItems.map((item) => (
            <div key={item.field} className="flex items-start gap-3">
              <input
                id={item.field}
                type="checkbox"
                className="w-5 h-5 mt-0.5 rounded border-dirt text-flag-blue focus:ring-star-gold/20 shrink-0"
                checked={formData[item.field] as boolean}
                onChange={(e) => update(item.field, e.target.checked)}
              />
              <div className="flex-1">
                <label
                  htmlFor={item.field}
                  className="text-charcoal text-base cursor-pointer leading-snug"
                >
                  {item.label}
                </label>
                {errors[item.field] && (
                  <p className="text-flag-red text-sm mt-0.5">
                    You must agree to continue
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div>
          <Label htmlFor="why_manage">
            Why do you want to manage this team?
          </Label>
          <textarea
            id="why_manage"
            rows={5}
            className={inputClasses}
            placeholder="Tell us what drives you to lead an All-Star team..."
            value={formData.why_manage}
            onChange={(e) => update("why_manage", e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="unique_qualities">
            What unique qualities would you bring?
          </Label>
          <textarea
            id="unique_qualities"
            rows={5}
            className={inputClasses}
            placeholder="What sets you apart from other coaching candidates?"
            value={formData.unique_qualities}
            onChange={(e) => update("unique_qualities", e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="additional_comments">
            Additional Comments (optional)
          </Label>
          <textarea
            id="additional_comments"
            rows={4}
            className={inputClasses}
            placeholder="Anything else you'd like the committee to know..."
            value={formData.additional_comments}
            onChange={(e) => update("additional_comments", e.target.value)}
          />
        </div>

        {submitError && (
          <div className="bg-flag-red/10 border border-flag-red/30 rounded-lg p-4">
            <p className="text-flag-red text-sm font-semibold">{submitError}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {progressBar}

      {submitError && (
        <div className="bg-flag-red/10 border border-flag-red/30 rounded-lg p-4 mb-4">
          <p className="text-flag-red text-sm font-semibold">{submitError}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 p-5 md:p-8">
        {step === 0 && renderStep0()}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}

        {navButtons}
      </div>
    </div>
  );
}

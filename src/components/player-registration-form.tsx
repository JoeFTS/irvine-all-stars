"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = "irvine-allstars-player-draft";

const STEPS = ["Player Info", "Details", "Submit"] as const;

const DIVISIONS = [
  { value: "5U-Shetland", label: "5U - Shetland", minAge: 4, maxAge: 5 },
  { value: "6U-Shetland", label: "6U - Shetland", minAge: 5, maxAge: 6 },
  { value: "7U MP-Pinto", label: "7U MP - Pinto Machine Pitch", minAge: 6, maxAge: 7 },
  { value: "7U KP-Pinto", label: "7U KP - Pinto Kid Pitch", minAge: 6, maxAge: 7 },
  { value: "8U MP-Pinto", label: "8U MP - Pinto Machine Pitch", minAge: 7, maxAge: 8 },
  { value: "8U KP-Pinto", label: "8U KP - Pinto Kid Pitch", minAge: 7, maxAge: 8 },
  { value: "9U-Mustang", label: "9U - Mustang", minAge: 8, maxAge: 9 },
  { value: "10U-Mustang", label: "10U - Mustang", minAge: 9, maxAge: 10 },
  { value: "11U-Bronco", label: "11U - Bronco", minAge: 10, maxAge: 11 },
  { value: "12U-Bronco", label: "12U - Bronco", minAge: 11, maxAge: 12 },
  { value: "13U-Pony", label: "13U - Pony", minAge: 12, maxAge: 13 },
  { value: "14U-Pony", label: "14U - Pony", minAge: 13, maxAge: 14 },
] as const;

const POSITIONS = [
  "Pitcher",
  "Catcher",
  "First Base",
  "Second Base",
  "Third Base",
  "Shortstop",
  "Left Field",
  "Center Field",
  "Right Field",
  "Utility",
] as const;

const SECONDARY_POSITIONS = ["None", ...POSITIONS] as const;

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface FormData {
  // Step 1
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  secondary_parent_name: string;
  secondary_parent_email: string;
  secondary_parent_phone: string;
  player_first_name: string;
  player_last_name: string;
  player_dob: string;
  division: string;
  // Step 2
  primary_position: string;
  secondary_position: string;
  bats: string;
  throws: string;
  current_team: string;
  jersey_number: string;
  medical_conditions: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  // Step 3
  photo_release: boolean;
  liability_waiver: boolean;
  code_of_conduct: boolean;
}

const INITIAL_DATA: FormData = {
  parent_name: "",
  parent_email: "",
  parent_phone: "",
  secondary_parent_name: "",
  secondary_parent_email: "",
  secondary_parent_phone: "",
  player_first_name: "",
  player_last_name: "",
  player_dob: "",
  division: "",
  primary_position: "",
  secondary_position: "",
  bats: "",
  throws: "",
  current_team: "",
  jersey_number: "",
  medical_conditions: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  photo_release: false,
  liability_waiver: false,
  code_of_conduct: false,
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function suggestDivision(dob: string): string {
  if (!dob) return "";
  const birthDate = new Date(dob);
  // Age as of May 1, 2026 (league age cutoff)
  const cutoff = new Date(2026, 4, 1);
  let age = cutoff.getFullYear() - birthDate.getFullYear();
  const monthDiff = cutoff.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && cutoff.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  const match = DIVISIONS.find((d) => age >= d.minAge && age <= d.maxAge);
  return match?.value ?? "";
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

/* ------------------------------------------------------------------ */
/*  Reusable input components                                          */
/* ------------------------------------------------------------------ */

function FieldLabel({
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
      className="block text-sm font-semibold text-charcoal mb-1.5"
    >
      {children}
      {required && <span className="text-flag-red ml-0.5">*</span>}
    </label>
  );
}

function TextInput({
  id,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
  autoComplete,
  inputMode,
}: {
  id: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  inputMode?: "text" | "email" | "tel" | "numeric";
}) {
  return (
    <input
      id={id}
      name={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      autoComplete={autoComplete}
      inputMode={inputMode}
      className="w-full min-h-[44px] px-4 py-3 bg-white border border-dirt rounded-xl text-charcoal placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-star-gold/30 focus:border-star-gold transition-colors"
    />
  );
}

function SelectInput({
  id,
  value,
  onChange,
  options,
  placeholder,
  required,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[] | { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <select
      id={id}
      name={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className="w-full min-h-[44px] px-4 py-3 bg-white border border-dirt rounded-xl text-charcoal focus:outline-none focus:ring-2 focus:ring-star-gold/30 focus:border-star-gold transition-colors appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%234B5563%22%20d%3D%22M6%208L1%203h10z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_16px_center] bg-no-repeat"
    >
      <option value="">{placeholder ?? "Select..."}</option>
      {options.map((opt) => {
        const val = typeof opt === "string" ? opt : opt.value;
        const label = typeof opt === "string" ? opt : opt.label;
        return (
          <option key={val} value={val}>
            {label}
          </option>
        );
      })}
    </select>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function PlayerRegistrationForm() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(INITIAL_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Pre-populate from URL query params (from invite or portal link)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prefill: Partial<FormData> = {};
    let hasPrefill = false;

    if (params.get("parent_name")) { prefill.parent_name = params.get("parent_name")!; hasPrefill = true; }
    if (params.get("parent_email")) { prefill.parent_email = params.get("parent_email")!; hasPrefill = true; }
    if (params.get("player_first_name")) { prefill.player_first_name = params.get("player_first_name")!; hasPrefill = true; }
    if (params.get("player_last_name")) { prefill.player_last_name = params.get("player_last_name")!; hasPrefill = true; }
    if (params.get("division")) { prefill.division = params.get("division")!; hasPrefill = true; }
    if (params.get("edit")) { setEditId(params.get("edit")); }

    if (hasPrefill) {
      setForm((prev) => ({ ...prev, ...prefill }));
      return; // skip localStorage draft when pre-filling from URL
    }

    // Load draft from localStorage on mount (only if no URL prefill)
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setForm((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // ignore
    }
  }, []);

  // Save draft to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    } catch {
      // ignore
    }
  }, [form]);

  const update = useCallback(
    <K extends keyof FormData>(key: K, value: FormData[K]) => {
      setForm((prev) => {
        const next = { ...prev, [key]: value };
        // Auto-suggest division when DOB changes
        if (key === "player_dob" && typeof value === "string") {
          const suggested = suggestDivision(value);
          if (suggested && !prev.division) {
            next.division = suggested;
          }
        }
        return next;
      });
      // Clear error for this field
      setErrors((prev) => {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    [],
  );

  const updatePhone = useCallback(
    (key: "parent_phone" | "emergency_contact_phone" | "secondary_parent_phone", raw: string) => {
      update(key, formatPhone(raw));
    },
    [update],
  );

  /* ---- Validation ---- */

  function validateStep(s: number): boolean {
    const errs: Record<string, string> = {};

    if (s === 0) {
      if (!form.parent_name.trim()) errs.parent_name = "Required";
      if (!form.parent_email.trim()) errs.parent_email = "Required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.parent_email))
        errs.parent_email = "Invalid email";
      if (!form.parent_phone.trim()) errs.parent_phone = "Required";
      if (!form.player_first_name.trim()) errs.player_first_name = "Required";
      if (!form.player_last_name.trim()) errs.player_last_name = "Required";
      if (!form.player_dob) errs.player_dob = "Required";
      if (!form.division) errs.division = "Required";
    }

    if (s === 1) {
      if (!form.primary_position) errs.primary_position = "Required";
      if (!form.bats) errs.bats = "Required";
      if (!form.throws) errs.throws = "Required";
      if (!form.emergency_contact_name.trim())
        errs.emergency_contact_name = "Required";
      if (!form.emergency_contact_phone.trim())
        errs.emergency_contact_phone = "Required";
    }

    if (s === 2) {
      if (!form.photo_release) errs.photo_release = "Required";
      if (!form.liability_waiver) errs.liability_waiver = "Required";
      if (!form.code_of_conduct) errs.code_of_conduct = "Required";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleNext() {
    if (validateStep(step)) {
      setStep((s) => Math.min(s + 1, 2));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleBack() {
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit() {
    if (!validateStep(2)) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setSubmitting(true);

    // Check for duplicate registration (same player name + division + parent email)
    if (!editId && supabase) {
      const { data: existing } = await supabase
        .from("tryout_registrations")
        .select("id")
        .ilike("player_first_name", form.player_first_name.trim())
        .ilike("player_last_name", form.player_last_name.trim())
        .eq("division", form.division)
        .or(`parent_email.eq.${form.parent_email.trim().toLowerCase()},secondary_parent_email.eq.${form.parent_email.trim().toLowerCase()}`)
        .limit(1);

      if (existing && existing.length > 0) {
        setSubmitting(false);
        setErrors({
          submit: `${form.player_first_name} ${form.player_last_name} is already registered for ${form.division}. If you need to make changes, please visit the Parent Portal or contact the coordinator.`,
        });
        return;
      }
    }

    const payload = {
      parent_name: form.parent_name.trim(),
      parent_email: form.parent_email.trim().toLowerCase(),
      parent_phone: form.parent_phone.trim(),
      secondary_parent_name: form.secondary_parent_name.trim() || null,
      secondary_parent_email: form.secondary_parent_email.trim().toLowerCase() || null,
      secondary_parent_phone: form.secondary_parent_phone.trim() || null,
      player_first_name: form.player_first_name.trim(),
      player_last_name: form.player_last_name.trim(),
      player_date_of_birth: form.player_dob,
      division: form.division,
      primary_position: form.primary_position,
      secondary_position: form.secondary_position || null,
      bats: form.bats.toLowerCase(),
      throws: form.throws.toLowerCase(),
      current_team: form.current_team.trim() || null,
      jersey_number: form.jersey_number.trim() || null,
      medical_conditions: form.medical_conditions.trim() || null,
      emergency_contact_name: form.emergency_contact_name.trim(),
      emergency_contact_phone: form.emergency_contact_phone.trim(),
      photo_release_consent: form.photo_release,
      liability_waiver_consent: form.liability_waiver,
      parent_code_of_conduct: form.code_of_conduct,
    };

    if (!supabase) {
      setSubmitting(false);
      setErrors({
        submit:
          "Registration is temporarily unavailable while setup is completed. Please try again shortly.",
      });
      return;
    }

    const { error } = editId
      ? await supabase
          .from("tryout_registrations")
          .update(payload)
          .eq("id", editId)
      : await supabase
          .from("tryout_registrations")
          .insert(payload);

    setSubmitting(false);

    if (error) {
      setErrors({
        submit: "Something went wrong. Please try again or contact us.",
      });
      return;
    }

    // Send confirmation email
    try {
      await fetch("/api/send-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "player",
          name: form.parent_name,
          email: form.parent_email,
          playerName: `${form.player_first_name} ${form.player_last_name}`,
          division: form.division,
        }),
      });
    } catch {
      // Email failure shouldn't block submission
    }

    // Clear draft
    localStorage.removeItem(STORAGE_KEY);
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ---- Success screen ---- */

  if (submitted) {
    return (
      <div className="text-center py-10">
        <div className="w-16 h-16 rounded-full bg-flag-blue text-white text-3xl flex items-center justify-center mx-auto mb-6">
          &#10003;
        </div>
        <h2 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide mb-3">
          Registration Complete
        </h2>
        <p className="text-gray-600 text-lg max-w-md mx-auto mb-8 leading-relaxed">
          {form.player_first_name} has been registered for {form.division}{" "}
          tryouts. You&apos;ll receive a confirmation email at{" "}
          <strong>{form.parent_email}</strong>.
        </p>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 max-w-lg mx-auto text-left mb-8">
          <h3 className="font-display text-lg font-semibold uppercase tracking-wide mb-4">
            What to Bring to Tryouts
          </h3>
          <ul className="space-y-2 text-gray-600">
            <li className="flex gap-2">
              <span className="text-flag-blue font-bold">&#8226;</span>
              Glove, bat, helmet, and cleats
            </li>
            <li className="flex gap-2">
              <span className="text-flag-blue font-bold">&#8226;</span>
              Baseball pants and your regular-season jersey
            </li>
            <li className="flex gap-2">
              <span className="text-flag-blue font-bold">&#8226;</span>
              Water bottle (plenty of water!)
            </li>
            <li className="flex gap-2">
              <span className="text-flag-blue font-bold">&#8226;</span>
              Arrive 15 minutes early for check-in
            </li>
          </ul>
        </div>

        <div className="bg-cream border border-sand rounded-2xl p-6 max-w-lg mx-auto text-left">
          <h3 className="font-display text-lg font-semibold uppercase tracking-wide mb-3">
            Key Dates
          </h3>
          <div className="space-y-2 text-gray-600 text-sm">
            <p>
              <strong>March 23:</strong> Coach candidacy deadline
            </p>
            <p>
              <strong>March 27:</strong> All-Star coaches named
            </p>
            <p>
              <strong>April 12:</strong> All-Star tryouts (all Bronco &amp; Pony divisions)
            </p>
            <p>
              <strong>April 14:</strong> All-Star players notified
            </p>
          </div>
        </div>

        {/* Register another child */}
        <button
          type="button"
          onClick={() => {
            setForm({
              ...INITIAL_DATA,
              parent_name: form.parent_name,
              parent_email: form.parent_email,
              parent_phone: form.parent_phone,
              secondary_parent_name: form.secondary_parent_name,
              secondary_parent_email: form.secondary_parent_email,
              secondary_parent_phone: form.secondary_parent_phone,
              emergency_contact_name: form.emergency_contact_name,
              emergency_contact_phone: form.emergency_contact_phone,
            });
            setStep(0);
            setSubmitted(false);
            setErrors({});
            setEditId(null);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="mt-6 inline-block bg-flag-blue hover:bg-flag-blue-mid text-white px-6 py-3 rounded-full font-display text-sm font-semibold uppercase tracking-widest transition-colors"
        >
          Register Another Child
        </button>
      </div>
    );
  }

  /* ---- Progress bar ---- */

  const ProgressBar = (
    <div className="mb-8">
      {/* Step labels */}
      <div className="flex justify-between mb-3">
        {STEPS.map((label, i) => (
          <div
            key={label}
            className={`text-xs font-semibold uppercase tracking-wider ${
              i <= step ? "text-flag-blue" : "text-gray-400"
            }`}
          >
            <span className="hidden sm:inline">
              {i + 1}. {label}
            </span>
            <span className="sm:hidden">{i + 1}</span>
          </div>
        ))}
      </div>
      {/* Bar */}
      <div className="flex gap-1.5">
        {STEPS.map((label, i) => (
          <div
            key={label}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= step ? "bg-flag-blue" : "bg-gray-200"
            }`}
          />
        ))}
      </div>
    </div>
  );

  /* ---- Error helper ---- */

  function fieldError(key: string) {
    if (!errors[key]) return null;
    return <p className="text-flag-red text-xs mt-1">{errors[key]}</p>;
  }

  /* ---- Step renderers ---- */

  const Step1 = (
    <div className="space-y-5">
      <h2 className="font-display text-xl md:text-2xl font-bold uppercase tracking-wide mb-1">
        Parent &amp; Player Info
      </h2>
      <p className="text-gray-600 text-sm mb-4">
        We need a few basics to get started.
      </p>

      {/* Parent name */}
      <div>
        <FieldLabel htmlFor="parent_name" required>
          Parent / Guardian Full Name
        </FieldLabel>
        <TextInput
          id="parent_name"
          value={form.parent_name}
          onChange={(v) => update("parent_name", v)}
          placeholder="Jane Smith"
          required
          autoComplete="name"
        />
        {fieldError("parent_name")}
      </div>

      {/* Parent email & phone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FieldLabel htmlFor="parent_email" required>
            Email
          </FieldLabel>
          <TextInput
            id="parent_email"
            type="email"
            value={form.parent_email}
            onChange={(v) => update("parent_email", v)}
            placeholder="jane@email.com"
            required
            autoComplete="email"
            inputMode="email"
          />
          {fieldError("parent_email")}
        </div>
        <div>
          <FieldLabel htmlFor="parent_phone" required>
            Phone
          </FieldLabel>
          <TextInput
            id="parent_phone"
            type="tel"
            value={form.parent_phone}
            onChange={(v) => updatePhone("parent_phone", v)}
            placeholder="(949) 555-1234"
            required
            autoComplete="tel"
            inputMode="tel"
          />
          {fieldError("parent_phone")}
        </div>
      </div>

      {/* Second Parent / Guardian (optional, collapsible) */}
      <div className="border-t border-gray-100 pt-4 mt-1">
        {form.secondary_parent_name.trim() === "" ? (
          <button
            type="button"
            onClick={() => update("secondary_parent_name", " ")}
            className="text-flag-blue hover:text-flag-blue-mid text-sm font-semibold transition-colors"
          >
            + Add a second parent / guardian
          </button>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">
                Second Parent / Guardian
              </h3>
              <button
                type="button"
                onClick={() => {
                  update("secondary_parent_name", "");
                  update("secondary_parent_email", "");
                  update("secondary_parent_phone", "");
                }}
                className="text-red-500 hover:text-red-700 text-xs font-semibold transition-colors"
              >
                Remove
              </button>
            </div>
            <div>
              <FieldLabel htmlFor="secondary_parent_name">Name</FieldLabel>
              <TextInput
                id="secondary_parent_name"
                value={form.secondary_parent_name.trim() === "" ? "" : form.secondary_parent_name}
                onChange={(v) => update("secondary_parent_name", v)}
                placeholder="John Smith"
                autoComplete="name"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FieldLabel htmlFor="secondary_parent_email">Email</FieldLabel>
                <TextInput
                  id="secondary_parent_email"
                  type="email"
                  value={form.secondary_parent_email}
                  onChange={(v) => update("secondary_parent_email", v)}
                  placeholder="john@email.com"
                  autoComplete="email"
                  inputMode="email"
                />
                <p className="text-xs text-gray-400 mt-1">
                  If provided, this parent can sign in to the portal.
                </p>
              </div>
              <div>
                <FieldLabel htmlFor="secondary_parent_phone">Phone</FieldLabel>
                <TextInput
                  id="secondary_parent_phone"
                  type="tel"
                  value={form.secondary_parent_phone}
                  onChange={(v) => updatePhone("secondary_parent_phone", v)}
                  placeholder="(949) 555-5678"
                  autoComplete="tel"
                  inputMode="tel"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Player first & last name */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FieldLabel htmlFor="player_first_name" required>
            Player First Name
          </FieldLabel>
          <TextInput
            id="player_first_name"
            value={form.player_first_name}
            onChange={(v) => update("player_first_name", v)}
            placeholder="Tommy"
            required
            autoComplete="given-name"
          />
          {fieldError("player_first_name")}
        </div>
        <div>
          <FieldLabel htmlFor="player_last_name" required>
            Player Last Name
          </FieldLabel>
          <TextInput
            id="player_last_name"
            value={form.player_last_name}
            onChange={(v) => update("player_last_name", v)}
            placeholder="Smith"
            required
            autoComplete="family-name"
          />
          {fieldError("player_last_name")}
        </div>
      </div>

      {/* DOB & Division */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FieldLabel htmlFor="player_dob" required>
            Player Date of Birth
          </FieldLabel>
          <input
            id="player_dob"
            name="player_dob"
            type="date"
            value={form.player_dob}
            onChange={(e) => update("player_dob", e.target.value)}
            required
            className="w-full min-h-[44px] px-4 py-3 bg-white border border-dirt rounded-xl text-charcoal focus:outline-none focus:ring-2 focus:ring-star-gold/30 focus:border-star-gold transition-colors"
          />
          {fieldError("player_dob")}
        </div>
        <div>
          <FieldLabel htmlFor="division" required>
            Division
          </FieldLabel>
          <SelectInput
            id="division"
            value={form.division}
            onChange={(v) => update("division", v)}
            options={DIVISIONS.map((d) => ({ value: d.value, label: d.label }))}
            placeholder="Select division..."
            required
          />
          {form.player_dob && !form.division && (
            <p className="text-star-gold text-xs mt-1">
              Suggested based on DOB:{" "}
              {suggestDivision(form.player_dob) || "N/A"}
            </p>
          )}
          {fieldError("division")}
        </div>
      </div>
    </div>
  );

  const Step2 = (
    <div className="space-y-5">
      <h2 className="font-display text-xl md:text-2xl font-bold uppercase tracking-wide mb-1">
        Player Details
      </h2>
      <p className="text-gray-600 text-sm mb-4">
        Tell us about the player&apos;s position and preferences.
      </p>

      {/* Primary & Secondary position */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FieldLabel htmlFor="primary_position" required>
            Primary Position
          </FieldLabel>
          <SelectInput
            id="primary_position"
            value={form.primary_position}
            onChange={(v) => update("primary_position", v)}
            options={[...POSITIONS]}
            placeholder="Select position..."
            required
          />
          {fieldError("primary_position")}
        </div>
        <div>
          <FieldLabel htmlFor="secondary_position">
            Secondary Position
          </FieldLabel>
          <SelectInput
            id="secondary_position"
            value={form.secondary_position}
            onChange={(v) => update("secondary_position", v)}
            options={[...SECONDARY_POSITIONS]}
            placeholder="Select position..."
          />
        </div>
      </div>

      {/* Bats & Throws */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FieldLabel htmlFor="bats" required>
            Bats
          </FieldLabel>
          <SelectInput
            id="bats"
            value={form.bats}
            onChange={(v) => update("bats", v)}
            options={["Right", "Left", "Switch"]}
            required
          />
          {fieldError("bats")}
        </div>
        <div>
          <FieldLabel htmlFor="throws" required>
            Throws
          </FieldLabel>
          <SelectInput
            id="throws"
            value={form.throws}
            onChange={(v) => update("throws", v)}
            options={["Right", "Left"]}
            required
          />
          {fieldError("throws")}
        </div>
      </div>

      {/* Current team & jersey */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FieldLabel htmlFor="current_team">
            Current Regular Season Team
          </FieldLabel>
          <TextInput
            id="current_team"
            value={form.current_team}
            onChange={(v) => update("current_team", v)}
            placeholder="e.g. Cardinals"
          />
        </div>
        <div>
          <FieldLabel htmlFor="jersey_number">Jersey Number</FieldLabel>
          <TextInput
            id="jersey_number"
            value={form.jersey_number}
            onChange={(v) => update("jersey_number", v)}
            placeholder="e.g. 7"
            inputMode="numeric"
          />
        </div>
      </div>

      {/* Medical */}
      <div>
        <FieldLabel htmlFor="medical_conditions">
          Medical Conditions / Allergies
        </FieldLabel>
        <textarea
          id="medical_conditions"
          name="medical_conditions"
          value={form.medical_conditions}
          onChange={(e) => update("medical_conditions", e.target.value)}
          placeholder="Any conditions coaches should be aware of (optional)"
          rows={3}
          className="w-full min-h-[44px] px-4 py-3 bg-white border border-dirt rounded-xl text-charcoal placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-star-gold/30 focus:border-star-gold transition-colors resize-y"
        />
      </div>

      {/* Emergency contact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FieldLabel htmlFor="emergency_contact_name" required>
            Emergency Contact Name
          </FieldLabel>
          <TextInput
            id="emergency_contact_name"
            value={form.emergency_contact_name}
            onChange={(v) => update("emergency_contact_name", v)}
            placeholder="Contact name"
            required
            autoComplete="name"
          />
          {fieldError("emergency_contact_name")}
        </div>
        <div>
          <FieldLabel htmlFor="emergency_contact_phone" required>
            Emergency Contact Phone
          </FieldLabel>
          <TextInput
            id="emergency_contact_phone"
            type="tel"
            value={form.emergency_contact_phone}
            onChange={(v) => updatePhone("emergency_contact_phone", v)}
            placeholder="(949) 555-5678"
            required
            autoComplete="tel"
            inputMode="tel"
          />
          {fieldError("emergency_contact_phone")}
        </div>
      </div>
    </div>
  );

  const Step3 = (
    <div className="space-y-5">
      <h2 className="font-display text-xl md:text-2xl font-bold uppercase tracking-wide mb-1">
        Consent &amp; Submit
      </h2>
      <p className="text-gray-600 text-sm mb-4">
        Please review and accept the following before submitting.
      </p>

      {/* Commitment info block */}
      <div className="bg-cream border border-sand rounded-2xl p-5">
        <p className="text-sm text-gray-600 leading-relaxed">
          <strong className="text-charcoal">Commitment expectations:</strong>{" "}
          All-Stars requires significant commitment: practices 2-4x/week,
          games, and tournaments from mid-May through July. Please confirm your
          family can commit to this schedule.
        </p>
      </div>

      {/* Checkboxes */}
      <div className="space-y-4">
        <label
          htmlFor="photo_release"
          className="flex items-start gap-3 cursor-pointer"
        >
          <input
            id="photo_release"
            type="checkbox"
            checked={form.photo_release}
            onChange={(e) => update("photo_release", e.target.checked)}
            className="mt-0.5 w-5 h-5 min-w-[20px] rounded border-dirt text-flag-blue focus:ring-star-gold/30 cursor-pointer"
          />
          <span className="text-sm text-gray-600 leading-relaxed">
            I consent to photos and videos of my child being used for Irvine
            Pony Baseball promotional materials, social media, and website
            content.
          </span>
        </label>
        {fieldError("photo_release")}

        <label
          htmlFor="liability_waiver"
          className="flex items-start gap-3 cursor-pointer"
        >
          <input
            id="liability_waiver"
            type="checkbox"
            checked={form.liability_waiver}
            onChange={(e) => update("liability_waiver", e.target.checked)}
            className="mt-0.5 w-5 h-5 min-w-[20px] rounded border-dirt text-flag-blue focus:ring-star-gold/30 cursor-pointer"
          />
          <span className="text-sm text-gray-600 leading-relaxed">
            I acknowledge and accept the inherent risks associated with
            baseball, and release Irvine Pony Baseball and its volunteers from
            liability for injuries sustained during All-Stars activities.
          </span>
        </label>
        {fieldError("liability_waiver")}

        <label
          htmlFor="code_of_conduct"
          className="flex items-start gap-3 cursor-pointer"
        >
          <input
            id="code_of_conduct"
            type="checkbox"
            checked={form.code_of_conduct}
            onChange={(e) => update("code_of_conduct", e.target.checked)}
            className="mt-0.5 w-5 h-5 min-w-[20px] rounded border-dirt text-flag-blue focus:ring-star-gold/30 cursor-pointer"
          />
          <span className="text-sm text-gray-600 leading-relaxed">
            I agree to abide by the Irvine Pony Baseball Parent Code of Conduct,
            including demonstrating good sportsmanship, respecting coaches and
            umpires, and supporting all players.
          </span>
        </label>
        {fieldError("code_of_conduct")}
      </div>

      {/* Summary */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mt-6">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">
          Registration Summary
        </h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div className="text-gray-400">Player</div>
          <div className="text-charcoal font-medium">
            {form.player_first_name} {form.player_last_name}
          </div>
          <div className="text-gray-400">Division</div>
          <div className="text-charcoal font-medium">{form.division}</div>
          <div className="text-gray-400">Position</div>
          <div className="text-charcoal font-medium">
            {form.primary_position}
          </div>
          <div className="text-gray-400">Parent</div>
          <div className="text-charcoal font-medium">{form.parent_name}</div>
          <div className="text-gray-400">Email</div>
          <div className="text-charcoal font-medium break-all">
            {form.parent_email}
          </div>
        </div>
      </div>

      {errors.submit && (
        <div className="bg-flag-red/10 border border-flag-red/30 rounded-lg p-4 text-flag-red text-sm">
          {errors.submit}
        </div>
      )}
    </div>
  );

  /* ---- Render ---- */

  return (
    <div>
      {ProgressBar}

      <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8">
        {step === 0 && Step1}
        {step === 1 && Step2}
        {step === 2 && Step3}

        {/* Navigation buttons */}
        <div className="flex justify-between mt-8 gap-4">
          {step > 0 ? (
            <button
              type="button"
              onClick={handleBack}
              className="min-h-[44px] px-6 py-3 border-2 border-gray-200 hover:border-gray-400 rounded-full font-display text-sm font-semibold uppercase tracking-wider text-gray-600 transition-colors"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 2 ? (
            <button
              type="button"
              onClick={handleNext}
              className="min-h-[44px] px-8 py-3 bg-flag-blue hover:bg-flag-blue-mid text-white rounded-full font-display text-sm font-semibold uppercase tracking-wider transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="min-h-[44px] px-8 py-3 bg-flag-red hover:bg-flag-red-dark text-white rounded-full font-display text-sm font-semibold uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting..." : "Submit Registration"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";

interface Registration {
  id: string;
  player_first_name: string;
  player_last_name: string;
  division: string;
  parent_name: string;
  parent_email: string;
  medical_conditions: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
}

interface MedicalForm {
  allergies: string;
  medications: string;
  medical_conditions: string;
  insurance_provider: string;
  insurance_policy_number: string;
  physician_name: string;
  physician_phone: string;
  authorize_treatment: boolean;
  parent_signature: string;
}

const initialForm: MedicalForm = {
  allergies: "",
  medications: "",
  medical_conditions: "",
  insurance_provider: "",
  insurance_policy_number: "",
  physician_name: "",
  physician_phone: "",
  authorize_treatment: false,
  parent_signature: "",
};

export default function MedicalReleasePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [playerId, setPlayerId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setPlayerId(params.get("player"));
  }, []);

  const [registration, setRegistration] = useState<Registration | null>(null);
  const [form, setForm] = useState<MedicalForm>(initialForm);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login?redirect=/portal");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user || !supabase || !playerId) {
      setLoading(false);
      return;
    }

    async function fetchData() {
      if (!supabase || !playerId || !user) return;

      // Fetch registration
      const { data: reg } = await supabase
        .from("tryout_registrations")
        .select(
          "id, player_first_name, player_last_name, division, parent_name, parent_email, medical_conditions, emergency_contact_name, emergency_contact_phone"
        )
        .eq("id", playerId)
        .or(
          `parent_email.eq.${user.email},secondary_parent_email.eq.${user.email}`
        )
        .single();

      if (reg) {
        setRegistration(reg as Registration);
        // Pre-fill from registration data
        setForm((prev) => ({
          ...prev,
          medical_conditions: reg.medical_conditions || "",
        }));
      }

      // Check if already completed
      const { data: existingDoc } = await supabase
        .from("player_documents")
        .select("id")
        .eq("registration_id", playerId)
        .eq("document_type", "medical_release")
        .limit(1);

      if (existingDoc && existingDoc.length > 0) {
        setAlreadyCompleted(true);
      }

      setLoading(false);
    }

    fetchData();
  }, [user, playerId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !registration || !user) return;

    // Validate
    if (!form.authorize_treatment) {
      setError("You must authorize emergency medical treatment.");
      return;
    }
    if (!form.parent_signature.trim()) {
      setError("Parent/guardian signature is required.");
      return;
    }

    setSubmitting(true);
    setError("");

    // Store as a player_document record with metadata in file_name
    const metadata = JSON.stringify({
      allergies: form.allergies,
      medications: form.medications,
      medical_conditions: form.medical_conditions,
      insurance_provider: form.insurance_provider,
      insurance_policy_number: form.insurance_policy_number,
      physician_name: form.physician_name,
      physician_phone: form.physician_phone,
      authorize_treatment: form.authorize_treatment,
      parent_signature: form.parent_signature,
      signed_at: new Date().toISOString(),
    });

    const { error: insertError } = await supabase
      .from("player_documents")
      .insert({
        registration_id: registration.id,
        player_name: `${registration.player_first_name} ${registration.player_last_name}`,
        division: registration.division,
        document_type: "medical_release",
        file_path: "",
        file_name: metadata,
        status: "approved",
        uploaded_by: user.id,
      });

    if (insertError) {
      console.error("Medical release error:", insertError);
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setSubmitted(true);
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-off-white pt-16 flex items-center justify-center">
        <p className="text-gray-400 font-display uppercase tracking-wider text-sm">
          Loading...
        </p>
      </div>
    );
  }

  if (!playerId || !registration) {
    return (
      <div className="min-h-screen bg-off-white pt-[120px] px-6">
        <div className="max-w-xl mx-auto bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <p className="text-gray-500 mb-4">
            No player selected. Go back to the Parent Portal.
          </p>
          <Link
            href="/portal"
            className="text-flag-blue font-semibold underline"
          >
            Back to Portal
          </Link>
        </div>
      </div>
    );
  }

  if (submitted || alreadyCompleted) {
    return (
      <div className="min-h-screen bg-off-white pt-[120px] px-6">
        <div className="max-w-xl mx-auto bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-7 h-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="font-display text-2xl font-bold uppercase tracking-wide mb-2">
            Medical Release Complete
          </h2>
          <p className="text-gray-600 text-sm mb-6">
            The medical release for{" "}
            <strong>
              {registration.player_first_name} {registration.player_last_name}
            </strong>{" "}
            has been submitted.
          </p>
          <Link
            href="/portal"
            className="inline-block bg-flag-blue hover:bg-flag-blue-mid text-white px-6 py-3 rounded-full font-display text-sm font-semibold uppercase tracking-widest transition-colors"
          >
            Back to Portal
          </Link>
        </div>
      </div>
    );
  }

  const playerName = `${registration.player_first_name} ${registration.player_last_name}`;

  return (
    <div className="min-h-screen bg-off-white pt-[120px] pb-16 px-6">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/portal"
          className="text-sm text-flag-blue hover:underline mb-4 inline-block"
        >
          &larr; Back to Portal
        </Link>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8">
          <h1 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide mb-1">
            Medical Release
          </h1>
          <p className="text-gray-500 text-sm mb-6">
            For <strong>{playerName}</strong> &mdash;{" "}
            {registration.division}
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-flag-red text-sm p-4 rounded-xl mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Medical Info */}
            <div>
              <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-flag-blue mb-3">
                Medical Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-1">
                    Known Allergies
                  </label>
                  <textarea
                    value={form.allergies}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, allergies: e.target.value }))
                    }
                    placeholder="List any allergies (food, medication, environmental) or type 'None'"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-flag-blue/30 focus:border-flag-blue"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-1">
                    Current Medications
                  </label>
                  <textarea
                    value={form.medications}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, medications: e.target.value }))
                    }
                    placeholder="List any current medications or type 'None'"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-flag-blue/30 focus:border-flag-blue"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-1">
                    Medical Conditions or Physical Limitations
                  </label>
                  <textarea
                    value={form.medical_conditions}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        medical_conditions: e.target.value,
                      }))
                    }
                    placeholder="List any conditions coaches should be aware of (asthma, diabetes, etc.) or type 'None'"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-flag-blue/30 focus:border-flag-blue"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Insurance */}
            <div>
              <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-flag-blue mb-3">
                Insurance Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-1">
                    Insurance Provider
                  </label>
                  <input
                    type="text"
                    value={form.insurance_provider}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        insurance_provider: e.target.value,
                      }))
                    }
                    placeholder="e.g. Blue Cross, Kaiser"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-flag-blue/30 focus:border-flag-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-1">
                    Policy Number
                  </label>
                  <input
                    type="text"
                    value={form.insurance_policy_number}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        insurance_policy_number: e.target.value,
                      }))
                    }
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-flag-blue/30 focus:border-flag-blue"
                  />
                </div>
              </div>
            </div>

            {/* Physician */}
            <div>
              <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-flag-blue mb-3">
                Physician
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-1">
                    Physician Name
                  </label>
                  <input
                    type="text"
                    value={form.physician_name}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        physician_name: e.target.value,
                      }))
                    }
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-flag-blue/30 focus:border-flag-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-1">
                    Physician Phone
                  </label>
                  <input
                    type="tel"
                    value={form.physician_phone}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        physician_phone: e.target.value,
                      }))
                    }
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-flag-blue/30 focus:border-flag-blue"
                  />
                </div>
              </div>
            </div>

            {/* Authorization */}
            <div className="bg-flag-blue/5 border border-flag-blue/15 rounded-2xl p-5 space-y-4">
              <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-flag-blue">
                Authorization for Emergency Medical Treatment
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                In the event of an emergency, I authorize the coaching staff
                and/or tournament officials to seek emergency medical treatment
                for my child,{" "}
                <strong>{playerName}</strong>, including but not limited to
                first aid, CPR, ambulance transport, and hospital care. I
                understand that every effort will be made to contact me
                immediately.
              </p>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.authorize_treatment}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      authorize_treatment: e.target.checked,
                    }))
                  }
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-flag-blue focus:ring-flag-blue"
                />
                <span className="text-sm text-charcoal font-medium">
                  I authorize emergency medical treatment for my child as
                  described above.
                </span>
              </label>
            </div>

            {/* Signature */}
            <div>
              <label className="block text-sm font-semibold text-charcoal mb-1">
                Parent/Guardian Signature (type full name)
              </label>
              <input
                type="text"
                value={form.parent_signature}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    parent_signature: e.target.value,
                  }))
                }
                placeholder="Type your full legal name"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-flag-blue/30 focus:border-flag-blue"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                By typing your name, you are electronically signing this medical
                release form.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-flag-red hover:bg-flag-red-dark disabled:opacity-50 text-white px-6 py-3.5 rounded-full font-display text-sm font-semibold uppercase tracking-widest transition-colors"
            >
              {submitting ? "Submitting..." : "Submit Medical Release"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

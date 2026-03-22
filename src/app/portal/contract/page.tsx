"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { StripeDivider } from "@/components/stripe-divider";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Registration {
  id: string;
  player_first_name: string;
  player_last_name: string;
  division: string;
  status: string;
}

function playerFullName(reg: Registration): string {
  return `${reg.player_first_name || ""} ${reg.player_last_name || ""}`.trim() || "Unknown Player";
}

interface ExistingContract {
  id: string;
  registration_id: string;
}

/* ------------------------------------------------------------------ */
/*  Contract Sections (shared)                                          */
/* ------------------------------------------------------------------ */

import { contractSections, acknowledgments } from "@/lib/contract-data";

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function ContractPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-off-white pt-16 flex items-center justify-center">
        <p className="text-gray-400 font-display uppercase tracking-wider text-sm">Loading...</p>
      </div>
    }>
      <ContractPage />
    </Suspense>
  );
}

function ContractPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const playerParam = searchParams.get("player");
  const { user, loading: authLoading } = useAuth();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [existingContracts, setExistingContracts] = useState<
    ExistingContract[]
  >([]);
  const [selectedRegId, setSelectedRegId] = useState<string>("");
  const [dataLoading, setDataLoading] = useState(true);
  const [checks, setChecks] = useState<boolean[]>(
    new Array(acknowledgments.length).fill(false)
  );
  const [vacations, setVacations] = useState("");
  const [signature, setSignature] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login?redirect=/portal/contract");
    }
  }, [authLoading, user, router]);

  // Fetch data
  useEffect(() => {
    if (!user || !supabase) {
      setDataLoading(false);
      return;
    }

    async function fetchData() {
      setDataLoading(true);

      const { data: regs } = await supabase!
        .from("tryout_registrations")
        .select("id, player_first_name, player_last_name, division, status")
        .or(`parent_email.eq.${user!.email},secondary_parent_email.eq.${user!.email}`)
        .order("submitted_at", { ascending: false });

      // Only show players who have been selected for a team
      const regData = ((regs ?? []) as Registration[]).filter(
        (r) => r.status === "selected" || r.status === "alternate"
      );
      setRegistrations(regData);

      if (regData.length > 0) {
        // Pre-select from URL param or default to first
        const fromUrl = playerParam && regData.find((r) => r.id === playerParam);
        setSelectedRegId(fromUrl ? fromUrl.id : regData[0].id);

        const regIds = regData.map((r) => r.id);
        const { data: contracts } = await supabase!
          .from("player_contracts")
          .select("id, registration_id")
          .in("registration_id", regIds);

        setExistingContracts((contracts ?? []) as ExistingContract[]);
      }

      setDataLoading(false);
    }

    fetchData();
  }, [user]);

  const selectedReg = registrations.find((r) => r.id === selectedRegId);
  const alreadySigned = existingContracts.some(
    (c) => c.registration_id === selectedRegId
  );

  const allChecked = checks.every(Boolean);
  const canSubmit = allChecked && signature.trim().length > 0 && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !supabase || !user || !selectedReg) return;

    setError(null);
    setSubmitting(true);

    const { error: insertError } = await supabase
      .from("player_contracts")
      .insert({
        registration_id: selectedRegId,
        player_name: playerFullName(selectedReg),
        division: selectedReg.division,
        parent_name: signature.trim(),
        parent_email: user.email,
        parent_signature: signature.trim(),
        planned_vacations: vacations.trim() || null,
        acknowledge_eligibility: checks[0],
        acknowledge_no_travel_ball: checks[1],
        acknowledge_tournament_schedule: checks[2],
        acknowledge_fees: checks[3],
        acknowledge_practices: checks[4],
        acknowledge_conduct: checks[5],
        acknowledge_no_playing_guarantee: checks[6],
        signed_at: new Date().toISOString(),
      });

    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }

    setExistingContracts((prev) => [
      ...prev,
      { id: "new", registration_id: selectedRegId },
    ]);
    setSubmitted(true);
    setSubmitting(false);
  }

  function toggleCheck(index: number) {
    setChecks((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  }

  /* ---- Loading state ---- */
  if (authLoading) {
    return (
      <div className="min-h-screen bg-off-white pt-16 flex items-center justify-center">
        <p className="text-gray-400 font-display uppercase tracking-wider text-sm">
          Loading...
        </p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      {/* ===== HERO ===== */}
      <section className="relative bg-flag-blue pt-16 pb-14 md:pb-20 px-6 md:px-10 overflow-hidden">
        <div className="absolute inset-0 text-white/[0.04] text-xl leading-[2.8rem] tracking-widest overflow-hidden pointer-events-none p-4">
          {"★ ".repeat(200)}
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center pt-10 md:pt-16">
          <p className="font-display text-sm font-semibold text-star-gold-bright uppercase tracking-[3px] mb-3">
            &#9733; Agreement
          </p>
          <h1 className="font-display text-4xl md:text-6xl font-bold text-white uppercase tracking-wide mb-4">
            Player Contract
          </h1>
          <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Review and sign the All-Stars player contract to confirm your
            commitment.
          </p>
        </div>
      </section>

      <StripeDivider />

      {/* ===== CONTRACT ===== */}
      <section className="bg-off-white py-12 md:py-16 px-6 md:px-10">
        <div className="max-w-3xl mx-auto">
          {dataLoading ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <p className="text-gray-400 text-sm">Loading...</p>
            </div>
          ) : registrations.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <svg className="h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
              <h2 className="font-display text-xl font-bold uppercase tracking-wide mb-2">
                Not Yet Available
              </h2>
              <p className="text-gray-500 text-sm mb-4">
                The player contract becomes available once your player has been
                selected for an All-Stars team. Check back after teams are announced.
              </p>
              <Link
                href="/portal"
                className="inline-block bg-flag-blue hover:bg-flag-blue-mid text-white px-6 py-3 rounded font-display text-sm font-semibold uppercase tracking-widest transition-colors"
              >
                Back to Portal
              </Link>
            </div>
          ) : (
            <>
              {/* Player selector */}
              {registrations.length > 1 && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-charcoal font-display uppercase tracking-wide mb-2">
                    Select Player
                  </label>
                  <select
                    value={selectedRegId}
                    onChange={(e) => {
                      setSelectedRegId(e.target.value);
                      setChecks(new Array(acknowledgments.length).fill(false));
                      setSignature("");
                      setVacations("");
                      setSubmitted(false);
                      setError(null);
                    }}
                    className="w-full md:w-auto rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-charcoal focus:border-flag-blue focus:ring-1 focus:ring-flag-blue outline-none"
                  >
                    {registrations.map((reg) => (
                      <option key={reg.id} value={reg.id}>
                        {playerFullName(reg)} — {reg.division}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Already signed state */}
              {alreadySigned && !submitted ? (
                <div className="bg-white rounded-lg border-2 border-green-500 p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="h-8 w-8 text-green-600"
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
                    Contract Signed
                  </h2>
                  <p className="text-gray-600 text-sm mb-1">
                    The player contract for{" "}
                    <span className="font-semibold">
                      {selectedReg ? playerFullName(selectedReg) : ""}
                    </span>{" "}
                    has already been signed.
                  </p>
                  <p className="text-gray-400 text-xs">
                    No further action is needed for this player.
                  </p>
                </div>
              ) : submitted ? (
                /* Just-submitted success */
                <div className="bg-white rounded-lg border-2 border-green-500 p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="h-8 w-8 text-green-600"
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
                    Contract Signed Successfully
                  </h2>
                  <p className="text-gray-600 text-sm mb-1">
                    Thank you for signing the player contract for{" "}
                    <span className="font-semibold">
                      {selectedReg ? playerFullName(selectedReg) : ""}
                    </span>
                    .
                  </p>
                  <p className="text-gray-400 text-xs">
                    A copy has been saved to your account.
                  </p>
                </div>
              ) : (
                /* Contract form */
                <form onSubmit={handleSubmit}>
                  {/* Congratulations header */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6 md:p-8 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                      <h2 className="font-display text-xl font-bold uppercase tracking-wide">
                        {selectedReg ? playerFullName(selectedReg) : ""}
                      </h2>
                      <span className="inline-block text-xs uppercase tracking-wider px-2.5 py-1 rounded border font-display font-semibold bg-flag-blue/10 text-flag-blue border-flag-blue/30">
                        {selectedReg?.division}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      Congratulations on{" "}
                      <span className="font-semibold">
                        {selectedReg ? playerFullName(selectedReg) : ""}
                      </span>
                      &apos;s selection to the Irvine PONY{" "}
                      <span className="font-semibold">
                        {selectedReg?.division}
                      </span>{" "}
                      All-Stars team! Please review the following contract
                      carefully and sign below to confirm your family&apos;s
                      commitment.
                    </p>
                  </div>

                  {/* Contract sections */}
                  <div className="space-y-4 mb-8">
                    {contractSections.map((section, i) => (
                      <div
                        key={section.title}
                        className="bg-white rounded-lg border border-gray-200 p-5 md:p-6"
                      >
                        <h3 className="font-display text-sm font-bold uppercase tracking-wide text-flag-blue mb-2">
                          {i + 1}. {section.title}
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {section.body}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Acknowledgment checkboxes */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6 md:p-8 mb-6">
                    <h3 className="font-display text-base font-bold uppercase tracking-wide mb-4">
                      Acknowledgments
                    </h3>
                    <p className="text-gray-500 text-xs mb-4">
                      All items must be checked to submit.
                    </p>
                    <div className="space-y-3">
                      {acknowledgments.map((text, i) => (
                        <label
                          key={i}
                          className="flex items-start gap-3 cursor-pointer group"
                        >
                          <input
                            type="checkbox"
                            checked={checks[i]}
                            onChange={() => toggleCheck(i)}
                            className="mt-0.5 h-5 w-5 rounded border-gray-300 text-flag-blue focus:ring-flag-blue cursor-pointer"
                          />
                          <span className="text-sm text-gray-700 group-hover:text-charcoal transition-colors">
                            {text}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Planned Vacations */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6 md:p-8 mb-6">
                    <label className="block text-sm font-semibold text-charcoal font-display uppercase tracking-wide mb-2">
                      Planned Vacations
                    </label>
                    <p className="text-gray-500 text-xs mb-3">
                      List any dates your family will be unavailable during the
                      tournament season (May-July). Leave blank if none.
                    </p>
                    <textarea
                      value={vacations}
                      onChange={(e) => setVacations(e.target.value)}
                      rows={3}
                      placeholder="e.g., June 15-20 family trip to Lake Tahoe"
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-charcoal placeholder:text-gray-400 focus:border-flag-blue focus:ring-1 focus:ring-flag-blue outline-none resize-none"
                    />
                  </div>

                  {/* Parent Signature */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6 md:p-8 mb-6">
                    <label className="block text-sm font-semibold text-charcoal font-display uppercase tracking-wide mb-2">
                      Parent/Guardian Signature{" "}
                      <span className="text-flag-red">*</span>
                    </label>
                    <p className="text-gray-500 text-xs mb-3">
                      Type your full legal name to sign this contract
                      electronically.
                    </p>
                    <input
                      type="text"
                      value={signature}
                      onChange={(e) => setSignature(e.target.value)}
                      placeholder="Full Name"
                      required
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-charcoal placeholder:text-gray-400 focus:border-flag-blue focus:ring-1 focus:ring-flag-blue outline-none"
                    />
                    {signature.trim() && (
                      <p className="mt-2 text-lg italic text-charcoal font-serif">
                        {signature}
                      </p>
                    )}
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className={`w-full py-3.5 rounded-lg font-display text-sm font-semibold uppercase tracking-widest transition-colors ${
                      canSubmit
                        ? "bg-flag-red hover:bg-flag-red-dark text-white cursor-pointer"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {submitting ? "Submitting..." : "Sign Contract"}
                  </button>
                </form>
              )}
            </>
          )}

          {/* Back to portal */}
          <div className="mt-8 text-center">
            <Link
              href="/portal"
              className="inline-flex items-center gap-2 text-flag-blue hover:text-flag-blue-mid font-display text-sm font-semibold uppercase tracking-widest transition-colors"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                />
              </svg>
              Back to Portal
            </Link>
          </div>
        </div>
      </section>

      <StripeDivider />
    </>
  );
}

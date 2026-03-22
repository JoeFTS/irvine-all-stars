"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { StripeDivider } from "@/components/stripe-divider";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Registration {
  id: string;
  parent_name: string;
  parent_email: string;
  player_first_name: string;
  player_last_name: string;
  player_name: string;
  player_date_of_birth: string | null;
  division: string;
  primary_position: string;
  status: string;
  submitted_at: string;
}

interface PlayerDocument {
  id: string;
  registration_id: string;
  document_type: string;
}

interface PlayerContract {
  id: string;
  registration_id: string;
}

interface Announcement {
  id: string;
  title: string;
  body: string;
  division: string | null;
  created_at: string;
}

interface TryoutSession {
  id: string;
  division: string;
  session_date: string;
  start_time: string;
  end_time: string | null;
  location: string;
  field: string | null;
}

interface TryoutAssignment {
  id: string;
  session_id: string;
  registration_id: string;
}

/* ------------------------------------------------------------------ */
/*  Status badge helper                                                */
/* ------------------------------------------------------------------ */

const statusConfig: Record<string, { label: string; classes: string }> = {
  registered: {
    label: "Registered",
    classes: "bg-flag-blue/10 text-flag-blue border-flag-blue/30",
  },
  confirmed: {
    label: "Confirmed",
    classes: "bg-green-50 text-green-700 border-green-300",
  },
  tryout_complete: {
    label: "Tryout Complete",
    classes: "bg-star-gold-bright/15 text-star-gold border-star-gold/30",
  },
  selected: {
    label: "Selected",
    classes: "bg-green-50 text-green-800 border-green-400 font-bold",
  },
  not_selected: {
    label: "Not Selected",
    classes: "bg-gray-100 text-gray-500 border-gray-300",
  },
  alternate: {
    label: "Alternate",
    classes: "bg-orange-50 text-orange-700 border-orange-300",
  },
};

function formatTime(time: string): string {
  const [h, m] = time.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${m} ${ampm}`;
}

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? {
    label: status,
    classes: "bg-gray-100 text-gray-600 border-gray-200",
  };
  return (
    <span
      className={`inline-block text-xs uppercase tracking-wider px-2.5 py-1 rounded border font-display font-semibold ${cfg.classes}`}
    >
      {cfg.label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Key Dates                                                          */
/* ------------------------------------------------------------------ */

const keyDates = [
  { date: "Mar 22", label: "Coach candidacy deadline" },
  { date: "Mar 27", label: "All-Star coaches named" },
  { date: "Apr 12", label: "All-Star tryouts (Bronco & Pony)" },
  { date: "Apr 14", label: "All-Star players notified" },
  { date: "Late May", label: "Memorial Day Tournament" },
  { date: "Jun 11", label: "District tournaments begin" },
  { date: "Jun-Aug", label: "Sanction play through early August" },
];

/* ------------------------------------------------------------------ */
/*  Quick Links                                                        */
/* ------------------------------------------------------------------ */

const quickLinks = [
  { label: "Tryout Schedule", href: "/tryouts", icon: "\u2733" },
  { label: "How Players Are Scored", href: "/tryouts#scoring", icon: "\u2605" },
  { label: "FAQ", href: "/faq", icon: "?" },
  { label: "Documents", href: "/documents", icon: "\u2193" },
  {
    label: "Contact Coordinator",
    href: "mailto:AllStars@irvinepony.com",
    icon: "\u2709",
  },
];

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function PortalPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [documents, setDocuments] = useState<PlayerDocument[]>([]);
  const [contracts, setContracts] = useState<PlayerContract[]>([]);
  const [tryoutSessions, setTryoutSessions] = useState<TryoutSession[]>([]);
  const [tryoutAssignments, setTryoutAssignments] = useState<TryoutAssignment[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  async function acceptSelection(regId: string) {
    if (!supabase || !user) return;
    const reg = registrations.find((r) => r.id === regId);
    if (!reg) return;

    setAcceptingId(regId);
    try {
      const { error } = await supabase.from("player_documents").insert({
        registration_id: regId,
        player_name: `${reg.player_first_name} ${reg.player_last_name}`,
        division: reg.division,
        document_type: "selection_acceptance",
        file_path: "",
        file_name: JSON.stringify({
          accepted_by: user.email,
          accepted_at: new Date().toISOString(),
        }),
        status: "approved",
        uploaded_by: user.id,
      });
      if (error) {
        alert(`Failed to accept selection: ${error.message}. Please try again.`);
      } else {
        setDocuments((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            registration_id: regId,
            document_type: "selection_acceptance",
          },
        ]);
      }
    } catch {
      alert("Network error. Please check your connection and try again.");
    }
    setAcceptingId(null);
  }

  // Client-side auth guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login?redirect=/portal");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user || !supabase) {
      setDataLoading(false);
      return;
    }

    async function fetchData() {
      setDataLoading(true);

      // Fetch registrations for this parent
      const { data: regs } = await supabase!
        .from("tryout_registrations")
        .select(
          "id, parent_name, parent_email, player_first_name, player_last_name, player_date_of_birth, division, primary_position, status, submitted_at"
        )
        .or(`parent_email.eq.${user!.email},secondary_parent_email.eq.${user!.email}`)
        .order("submitted_at", { ascending: false });

      const regData = (regs ?? []) as Registration[];
      setRegistrations(regData);

      // Fetch compliance data (documents + contracts) for all registrations
      if (regData.length > 0) {
        const regIds = regData.map((r) => r.id);

        const [docsResult, contractsResult] = await Promise.all([
          supabase!
            .from("player_documents")
            .select("id, registration_id, document_type")
            .in("registration_id", regIds),
          supabase!
            .from("player_contracts")
            .select("id, registration_id")
            .in("registration_id", regIds),
        ]);

        setDocuments((docsResult.data ?? []) as PlayerDocument[]);
        setContracts((contractsResult.data ?? []) as PlayerContract[]);

        // Fetch tryout assignments for this parent's players
        const { data: assignments } = await supabase!
          .from("tryout_assignments")
          .select("id, session_id, registration_id")
          .in("registration_id", regIds);

        setTryoutAssignments((assignments ?? []) as TryoutAssignment[]);

        // Fetch the session details for assigned sessions
        if (assignments && assignments.length > 0) {
          const sessionIds = [...new Set(assignments.map((a: any) => a.session_id))];
          const { data: sessions } = await supabase!
            .from("tryout_sessions")
            .select("id, division, session_date, start_time, end_time, location, field")
            .in("id", sessionIds);
          setTryoutSessions((sessions ?? []) as TryoutSession[]);
        }
      }

      // Determine divisions for filtering announcements
      const playerDivisions = regData.map((r) => r.division);

      // Fetch announcements — general + player-specific divisions
      let announcementQuery = supabase!
        .from("announcements")
        .select("id, title, body, division, created_at")
        .order("created_at", { ascending: false })
        .limit(10);

      if (playerDivisions.length > 0) {
        // Show general (null division) + matching divisions
        announcementQuery = announcementQuery.or(
          `division.is.null,division.in.(${playerDivisions.join(",")})`
        );
      } else {
        // No registrations — show only general announcements
        announcementQuery = announcementQuery.is("division", null);
      }

      const { data: annData } = await announcementQuery;
      setAnnouncements((annData ?? []) as Announcement[]);

      setDataLoading(false);
    }

    fetchData();
  }, [user]);

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

  /* ---- Not logged in ---- */
  if (!user) {
    return (
      <>
        <section className="relative bg-flag-blue pt-16 pb-14 md:pb-20 px-6 md:px-10 overflow-hidden">
          <div className="absolute inset-0 text-white/[0.04] text-xl leading-[2.8rem] tracking-widest overflow-hidden pointer-events-none p-4">
            {"★ ".repeat(200)}
          </div>
          <div className="relative z-10 max-w-4xl mx-auto text-center pt-10 md:pt-16">
            <p className="font-display text-sm font-semibold text-star-gold-bright uppercase tracking-[3px] mb-3">
              &#9733; Parent Access
            </p>
            <h1 className="font-display text-4xl md:text-6xl font-bold text-white uppercase tracking-wide mb-4">
              Parent Portal
            </h1>
            <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Sign in to track your player&apos;s tryout status, view
              announcements, and stay up to date with All-Stars.
            </p>
          </div>
        </section>

        <StripeDivider />

        <section className="bg-off-white py-16 px-6 md:px-10">
          <div className="max-w-md mx-auto bg-white rounded-lg border border-gray-200 p-6 md:p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-flag-blue/10 text-flag-blue font-display text-2xl font-bold flex items-center justify-center mx-auto mb-4">
              &#9733;
            </div>
            <h2 className="font-display text-2xl font-bold uppercase tracking-wide mb-2">
              Sign In Required
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-6">
              Log in with your parent account to view your player&apos;s
              registration status and important updates.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/auth/login"
                className="bg-flag-blue hover:bg-flag-blue-mid text-white px-6 py-3 rounded font-display text-sm font-semibold uppercase tracking-widest transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="border-2 border-gray-200 hover:border-gray-400 text-charcoal px-6 py-3 rounded font-display text-sm font-semibold uppercase tracking-widest transition-colors"
              >
                Create Account
              </Link>
            </div>
          </div>
        </section>
      </>
    );
  }

  /* ---- Logged in — dashboard ---- */
  return (
    <>
      {/* ===== HERO ===== */}
      <section className="relative bg-flag-blue pt-16 pb-14 md:pb-20 px-6 md:px-10 overflow-hidden">
        <div className="absolute inset-0 text-white/[0.04] text-xl leading-[2.8rem] tracking-widest overflow-hidden pointer-events-none p-4">
          {"★ ".repeat(200)}
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center pt-10 md:pt-16">
          <p className="font-display text-sm font-semibold text-star-gold-bright uppercase tracking-[3px] mb-3">
            &#9733; Parent Access
          </p>
          <h1 className="font-display text-4xl md:text-6xl font-bold text-white uppercase tracking-wide mb-4">
            Parent Portal
          </h1>
          <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Welcome back. Here&apos;s what&apos;s happening with your
            player&apos;s All-Stars journey.
          </p>
        </div>
      </section>

      <StripeDivider />

      {/* ===== MY PLAYER'S STATUS ===== */}
      <section className="bg-off-white py-12 md:py-16 px-6 md:px-10">
        <div className="max-w-4xl mx-auto">
          <p className="font-display text-sm font-semibold text-flag-red uppercase tracking-[3px] mb-2">
            &#9733; Registration
          </p>
          <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide mb-6">
            My Player&apos;s Status
          </h2>

          {dataLoading ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <p className="text-gray-400 text-sm">Loading registrations...</p>
            </div>
          ) : registrations.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <p className="text-gray-500 mb-4">
                No tryout registrations found for your account.
              </p>
              <Link
                href={`/apply/player?parent_name=${encodeURIComponent(user?.user_metadata?.full_name || "")}&parent_email=${encodeURIComponent(user?.email || "")}`}
                className="inline-block bg-flag-red hover:bg-flag-red-dark text-white px-6 py-3 rounded font-display text-sm font-semibold uppercase tracking-widest transition-colors"
              >
                Register for Tryouts
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {registrations.map((reg) => {
                const isIncomplete = !reg.player_date_of_birth || !reg.primary_position;
                const playerName = `${reg.player_first_name || ""} ${reg.player_last_name || ""}`.trim() || "Unknown Player";
                const completeUrl = `/apply/player?edit=${reg.id}&parent_name=${encodeURIComponent(reg.parent_name || "")}&parent_email=${encodeURIComponent(reg.parent_email || "")}&player_first_name=${encodeURIComponent(reg.player_first_name || "")}&player_last_name=${encodeURIComponent(reg.player_last_name || "")}&division=${encodeURIComponent(reg.division || "")}`;

                return (
                  <div
                    key={reg.id}
                    className={`bg-white rounded-lg border p-5 md:p-6 ${isIncomplete ? "border-flag-red/30 border-l-4 border-l-flag-red" : "border-gray-200"}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                      <h3 className="font-display text-xl font-bold uppercase tracking-wide">
                        {playerName}
                      </h3>
                      {isIncomplete ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-flag-red/10 text-flag-red border border-flag-red/20">
                          Action Needed
                        </span>
                      ) : (
                        <StatusBadge status={reg.status} />
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
                      <span>
                        <span className="font-semibold text-charcoal">Division:</span>{" "}
                        {reg.division}
                      </span>
                      {reg.primary_position && (
                        <span>
                          <span className="font-semibold text-charcoal">Position:</span>{" "}
                          {reg.primary_position}
                        </span>
                      )}
                      <span>
                        <span className="font-semibold text-charcoal">Submitted:</span>{" "}
                        {new Date(reg.submitted_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    {isIncomplete && (
                      <div className="mt-4">
                        <Link
                          href={completeUrl}
                          className="inline-block bg-flag-red hover:bg-flag-red-dark text-white px-5 py-2.5 rounded font-display text-xs font-semibold uppercase tracking-widest transition-colors"
                        >
                          Complete Registration
                        </Link>
                        <p className="text-gray-400 text-xs mt-2">
                          Additional player details are needed to finalize tryout registration.
                        </p>
                      </div>
                    )}
                    {(() => {
                      const assignment = tryoutAssignments.find(a => a.registration_id === reg.id);
                      const session = assignment ? tryoutSessions.find(s => s.id === assignment.session_id) : null;
                      return (
                        <>
                          {session && (
                            <div className="mt-4 bg-flag-blue/5 border border-flag-blue/15 rounded-lg p-4">
                              <p className="font-display text-xs font-semibold text-flag-blue uppercase tracking-widest mb-2">
                                &#9733; Your Tryout Time
                              </p>
                              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                                <span>
                                  <span className="font-semibold text-charcoal">Date:</span>{" "}
                                  {new Date(session.session_date + "T00:00:00").toLocaleDateString("en-US", {
                                    weekday: "long",
                                    month: "long",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </span>
                                <span>
                                  <span className="font-semibold text-charcoal">Time:</span>{" "}
                                  {formatTime(session.start_time)}
                                  {session.end_time ? ` – ${formatTime(session.end_time)}` : ""}
                                </span>
                                <span>
                                  <span className="font-semibold text-charcoal">Location:</span>{" "}
                                  {session.location}
                                  {session.field ? `, ${session.field}` : ""}
                                </span>
                              </div>
                              {(reg.status === "registered" || reg.status === "invited") && (
                                <button
                                  onClick={async () => {
                                    try {
                                      const res = await fetch("/api/confirm-tryout", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ registration_id: reg.id }),
                                      });
                                      if (res.ok) {
                                        setRegistrations((prev) =>
                                          prev.map((r) =>
                                            r.id === reg.id ? { ...r, status: "confirmed" } : r
                                          )
                                        );
                                      } else {
                                        alert("Failed to confirm attendance. Please try again.");
                                      }
                                    } catch {
                                      alert("Network error. Please check your connection and try again.");
                                    }
                                  }}
                                  className="mt-3 inline-block bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded font-display text-xs font-semibold uppercase tracking-widest transition-colors"
                                >
                                  Confirm Attendance
                                </button>
                              )}
                              {reg.status === "confirmed" && (
                                <p className="mt-3 text-green-600 text-xs font-semibold flex items-center gap-1">
                                  &#10003; Attendance Confirmed
                                </p>
                              )}
                            </div>
                          )}
                          {!session && !isIncomplete && (
                            <p className="mt-3 text-gray-400 text-xs italic">
                              Tryout time not yet assigned. Check back soon.
                            </p>
                          )}
                        </>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ===== COMPLIANCE INFO ===== */}
      {!dataLoading && registrations.length > 0 && (
        <section className="bg-white py-12 md:py-16 px-6 md:px-10">
          <div className="max-w-4xl mx-auto">
            <p className="font-display text-sm font-semibold text-flag-red uppercase tracking-[3px] mb-2">
              &#9733; Compliance
            </p>
            <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide mb-3">
              Tournament Readiness
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-6">
              Complete each step in order. Once your player is selected for a team,
              the next steps will unlock.
            </p>

            <div className="space-y-4">
              {registrations.map((reg) => {
                const hasBirthCert = documents.some(
                  (d) =>
                    d.registration_id === reg.id &&
                    d.document_type === "birth_certificate"
                );
                const hasPhoto = documents.some(
                  (d) =>
                    d.registration_id === reg.id &&
                    d.document_type === "player_photo"
                );
                const hasContract = contracts.some(
                  (c) => c.registration_id === reg.id
                );

                const hasMedicalRelease = documents.some(
                  (d) =>
                    d.registration_id === reg.id &&
                    d.document_type === "medical_release"
                );
                const hasAcceptedSelection = documents.some(
                  (d) =>
                    d.registration_id === reg.id &&
                    d.document_type === "selection_acceptance"
                );

                const isSelected = reg.status === "selected";
                const isOnTeam = isSelected || reg.status === "alternate";

                const items = [
                  { label: "Register for tryouts", done: true, href: "#", locked: false },
                  {
                    label: "Accept All-Stars selection",
                    done: hasAcceptedSelection,
                    href: "#accept",
                    locked: !isOnTeam,
                    acceptAction: isOnTeam && !hasAcceptedSelection ? reg.id : undefined,
                  },
                  {
                    label: "Sign player contract",
                    done: hasContract,
                    href: `/portal/contract?player=${reg.id}`,
                    locked: !hasAcceptedSelection,
                  },
                  {
                    label: "Upload player photo",
                    done: hasPhoto,
                    href: `/portal/documents?player=${reg.id}`,
                    locked: !hasContract,
                  },
                  {
                    label: "Upload birth certificate",
                    done: hasBirthCert,
                    href: `/portal/documents?player=${reg.id}`,
                    locked: !hasContract,
                  },
                  {
                    label: "Complete medical release",
                    done: hasMedicalRelease,
                    href: `/portal/medical-release?player=${reg.id}`,
                    locked: !hasContract,
                  },
                ] as Array<{ label: string; done: boolean; href: string; locked: boolean; acceptAction?: string }>;

                const completedCount = items.filter((i) => i.done).length;
                const totalCount = items.length;
                const progressPct = Math.round(
                  (completedCount / totalCount) * 100
                );
                const allDone = completedCount === totalCount;

                return (
                  <div
                    key={reg.id}
                    className="bg-white rounded-lg border border-gray-200 p-5 md:p-6"
                  >
                    {/* Player header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <h3 className="font-display text-xl font-bold uppercase tracking-wide">
                          {`${reg.player_first_name || ""} ${reg.player_last_name || ""}`.trim() || "Unknown Player"}
                        </h3>
                        <span className="inline-block text-xs uppercase tracking-wider px-2.5 py-1 rounded border font-display font-semibold bg-flag-blue/10 text-flag-blue border-flag-blue/30">
                          {reg.division}
                        </span>
                      </div>
                      {allDone ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-display font-semibold uppercase tracking-wider text-green-700 bg-green-50 border border-green-300 px-2.5 py-1 rounded">
                          <svg
                            className="h-3.5 w-3.5"
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
                          All Complete
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-display font-semibold uppercase tracking-wider text-orange-700 bg-orange-50 border border-orange-300 px-2.5 py-1 rounded">
                          Action Needed
                        </span>
                      )}
                    </div>

                    {/* Progress bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                        <span>
                          {completedCount} of {totalCount} complete
                        </span>
                        <span>{progressPct}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            allDone ? "bg-green-500" : "bg-flag-blue"
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Checklist items */}
                    <ul className="space-y-2">
                      {items.map((item) => (
                        <li key={item.label}>
                          {item.done ? (
                            <div className="flex items-center gap-3 text-sm text-green-700">
                              <svg
                                className="h-5 w-5 shrink-0 text-green-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2.5}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <span className="line-through opacity-60">
                                {item.label}
                              </span>
                            </div>
                          ) : item.acceptAction ? (
                            <div className="bg-flag-blue/5 border-2 border-flag-blue/20 rounded-lg p-4 space-y-3">
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-star-gold-bright/20 flex items-center justify-center shrink-0 mt-0.5">
                                  <svg className="w-4 h-4 text-star-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                                  </svg>
                                </div>
                                <div>
                                  <p className="font-display text-sm font-bold uppercase tracking-wide text-flag-blue">
                                    Your player has been selected!
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Please accept or decline the All-Stars spot. Accepting confirms your family&apos;s commitment to the full season including practices, games, and tournaments.
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-3 pl-11">
                                <button
                                  onClick={() => acceptSelection(item.acceptAction!)}
                                  disabled={acceptingId === item.acceptAction}
                                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-5 py-2.5 rounded font-display text-xs font-semibold uppercase tracking-widest transition-colors"
                                >
                                  {acceptingId === item.acceptAction ? "Accepting..." : "Accept Spot"}
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm("Are you sure you want to decline? This will release the spot to another player. This action cannot be undone.")) {
                                      alert("Please contact AllStars@irvinepony.com to formally decline the selection.");
                                    }
                                  }}
                                  className="border border-gray-300 hover:border-gray-400 text-gray-600 px-5 py-2.5 rounded font-display text-xs font-semibold uppercase tracking-widest transition-colors"
                                >
                                  Decline
                                </button>
                              </div>
                            </div>
                          ) : item.locked ? (
                            <div className="flex items-center gap-3 text-sm text-gray-400 cursor-not-allowed">
                              <svg
                                className="h-5 w-5 shrink-0 text-gray-300"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                                />
                              </svg>
                              <span>{item.label}</span>
                            </div>
                          ) : (
                            <Link
                              href={item.href}
                              className="flex items-center gap-3 text-sm text-charcoal hover:text-flag-blue transition-colors group"
                            >
                              <div className="h-5 w-5 shrink-0 rounded-full border-2 border-gray-300 group-hover:border-flag-blue transition-colors" />
                              <span className="font-medium">
                                {item.label}
                              </span>
                              <svg
                                className="h-3.5 w-3.5 text-gray-400 group-hover:text-flag-blue transition-colors ml-auto"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M8.25 4.5l7.5 7.5-7.5 7.5"
                                />
                              </svg>
                            </Link>
                          )}
                        </li>
                      ))}
                    </ul>

                    {/* Hint messages for locked items */}
                    {!isOnTeam && (
                      <p className="mt-3 text-xs text-gray-400 italic">
                        Steps 2-6 will unlock once your player is selected for a team.
                      </p>
                    )}
                    {isOnTeam && !hasAcceptedSelection && (
                      <p className="mt-3 text-xs text-flag-blue italic font-medium">
                        Accept the selection above to unlock the remaining steps.
                      </p>
                    )}
                    {hasAcceptedSelection && !hasContract && (
                      <p className="mt-3 text-xs text-gray-400 italic">
                        Sign the player contract to unlock document uploads.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ===== ANNOUNCEMENTS ===== */}
      <section className="bg-white py-12 md:py-16 px-6 md:px-10">
        <div className="max-w-4xl mx-auto">
          <p className="font-display text-sm font-semibold text-flag-red uppercase tracking-[3px] mb-2">
            &#9733; Updates
          </p>
          <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide mb-6">
            Announcements
          </h2>

          {dataLoading ? (
            <div className="bg-off-white rounded-lg border border-gray-200 p-8 text-center">
              <p className="text-gray-400 text-sm">
                Loading announcements...
              </p>
            </div>
          ) : announcements.length === 0 ? (
            <div className="bg-off-white rounded-lg border border-gray-200 p-8 text-center">
              <p className="text-gray-500">
                No announcements yet. Check back soon.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  className="bg-off-white rounded-lg border border-gray-200 p-5 md:p-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                    <h3 className="font-display text-base font-semibold uppercase tracking-wide">
                      {ann.title}
                    </h3>
                    <div className="flex items-center gap-2 shrink-0">
                      {ann.division && (
                        <span className="text-[10px] font-display font-semibold uppercase tracking-wider bg-flag-blue/10 text-flag-blue px-2 py-0.5 rounded">
                          {ann.division}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {new Date(ann.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                    {ann.body}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== IMPORTANT LINKS ===== */}
      <section className="bg-cream py-12 md:py-16 px-6 md:px-10">
        <div className="max-w-4xl mx-auto">
          <p className="font-display text-sm font-semibold text-flag-red uppercase tracking-[3px] mb-2">
            &#9733; Resources
          </p>
          <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide mb-6">
            Important Links
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {quickLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="bg-white rounded-lg border border-gray-200 p-4 text-center hover:border-flag-blue hover:shadow-sm transition-all group"
              >
                <div className="text-2xl mb-2 text-flag-blue group-hover:text-flag-red transition-colors">
                  {link.icon}
                </div>
                <p className="font-display text-xs font-semibold uppercase tracking-wide text-charcoal leading-tight">
                  {link.label}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== KEY DATES ===== */}
      <section className="bg-off-white py-12 md:py-16 px-6 md:px-10">
        <div className="max-w-4xl mx-auto">
          <p className="font-display text-sm font-semibold text-flag-red uppercase tracking-[3px] mb-2">
            &#9733; Calendar
          </p>
          <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide mb-6">
            Key Dates
          </h2>

          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
            {keyDates.map((item, i) => (
              <div
                key={item.label}
                className="flex items-center gap-4 px-5 py-3.5"
              >
                <div
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    i % 2 === 0 ? "bg-flag-blue" : "bg-flag-red"
                  }`}
                />
                <span className="font-display text-sm font-bold uppercase tracking-wide text-flag-blue w-20 sm:w-24 shrink-0">
                  {item.date}
                </span>
                <span className="text-sm text-gray-600">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <StripeDivider />
    </>
  );
}

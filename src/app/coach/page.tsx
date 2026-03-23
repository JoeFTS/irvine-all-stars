"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ClipboardCheck,
  ClipboardList,
  Users,
  Award,
  BookOpen,
  Megaphone,
  Home,
  CheckCircle2,
  AlertCircle,
  Calendar,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Profile {
  division: string | null;
  full_name: string | null;
}

interface Registration {
  id: string;
}

interface PlayerDocument {
  registration_id: string;
  document_type: string;
}

interface PlayerContract {
  registration_id: string;
}

interface CoachCert {
  cert_type: string;
}

interface TournamentAgreement {
  id: string;
}

interface Announcement {
  id: string;
  title: string;
  body: string;
  created_at: string;
}

/* ------------------------------------------------------------------ */
/*  Quick-link config                                                   */
/* ------------------------------------------------------------------ */

const quickLinks = [
  { href: "/coach/checklist", label: "Binder Checklist", icon: ClipboardCheck },
  { href: "/coach/pitching-log", label: "Pitching Log", icon: ClipboardList },
  { href: "/coach/roster", label: "Team Roster", icon: Users },
  { href: "/coach/certifications", label: "Certifications", icon: Award },
  { href: "/coach/tournament-rules", label: "Tournament Rules", icon: BookOpen },
  { href: "/coach/updates", label: "Updates", icon: Megaphone },
  { href: "/portal", label: "Parent Portal", icon: Home },
];

const upcomingDates = [
  { event: "Coach Candidacy Deadline", date: "March 22" },
  { event: "Peer Coach Voting", date: "March 24 - 26" },
  { event: "All-Star Coaches Named", date: "March 27" },
  { event: "Scouting Period", date: "March 28 - April 11" },
  { event: "All-Star Tryouts", date: "April 12" },
  { event: "Players Notified", date: "April 14" },
  { event: "Memorial Day Tournament", date: "Late May (league-funded)" },
  { event: "District Tournaments Begin", date: "June 11" },
  { event: "Binder Sign-Off Deadline", date: "Before your first tournament game" },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function CoachDashboardPage() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [documents, setDocuments] = useState<PlayerDocument[]>([]);
  const [contracts, setContracts] = useState<PlayerContract[]>([]);
  const [coachCerts, setCoachCerts] = useState<CoachCert[]>([]);
  const [tournamentAgreements, setTournamentAgreements] = useState<TournamentAgreement[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    if (!user || !supabase) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      if (!supabase || !user) return;

      // 1. Coach profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("division, full_name")
        .eq("id", user.id)
        .single();

      if (cancelled) return;
      setProfile(profileData as Profile | null);

      const division = profileData?.division;

      // Parallel fetches
      const [regsResult, certsResult, agreementsResult, announcementsResult] =
        await Promise.all([
          // 2. Registrations in division (only selected/alternate players)
          division
            ? supabase
                .from("tryout_registrations")
                .select("id")
                .eq("division", division)
                .in("status", ["selected", "alternate"])
            : Promise.resolve({ data: [] as Registration[] }),

          // 5. Coach certifications
          supabase
            .from("coach_certifications")
            .select("cert_type")
            .eq("coach_id", user.id),

          // 6. Tournament agreements
          supabase
            .from("tournament_agreements")
            .select("id")
            .eq("coach_id", user.id),

          // 7. Announcements
          supabase
            .from("announcements")
            .select("id, title, body, created_at")
            .order("created_at", { ascending: false })
            .limit(3),
        ]);

      if (cancelled) return;

      const regs = (regsResult.data ?? []) as Registration[];
      setRegistrations(regs);
      setCoachCerts((certsResult.data ?? []) as CoachCert[]);
      setTournamentAgreements((agreementsResult.data ?? []) as TournamentAgreement[]);
      setAnnouncements((announcementsResult.data ?? []) as Announcement[]);

      // 3 & 4: Docs and contracts for those registrations
      if (regs.length > 0) {
        const regIds = regs.map((r) => r.id);

        const [docsResult, contractsResult] = await Promise.all([
          supabase
            .from("player_documents")
            .select("registration_id, document_type")
            .in("registration_id", regIds),
          supabase
            .from("player_contracts")
            .select("registration_id")
            .in("registration_id", regIds),
        ]);

        if (cancelled) return;
        setDocuments((docsResult.data ?? []) as PlayerDocument[]);
        setContracts((contractsResult.data ?? []) as PlayerContract[]);
      }

      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  /* ---- Derived stats ---- */

  const division = profile?.division ?? null;
  const playerCount = registrations.length;

  // Build sets for quick lookup
  const hasBirthCert = new Set(
    documents.filter((d) => d.document_type === "birth_certificate").map((d) => d.registration_id)
  );
  const hasPhoto = new Set(
    documents.filter((d) => d.document_type === "player_photo").map((d) => d.registration_id)
  );
  const hasContract = new Set(contracts.map((c) => c.registration_id));

  const missingBirthCert = registrations.filter((r) => !hasBirthCert.has(r.id)).length;
  const missingPhoto = registrations.filter((r) => !hasPhoto.has(r.id)).length;
  const missingContract = registrations.filter((r) => !hasContract.has(r.id)).length;

  const certTypes = new Set(coachCerts.map((c) => c.cert_type));
  const hasConcussion = certTypes.has("concussion");
  const hasCardiac = certTypes.has("cardiac_arrest");
  const hasTournamentAck = tournamentAgreements.length > 0;

  // Compliance calculation
  const totalItems = playerCount * 3 + 2 + 1; // 3 per player + 2 certs + 1 agreement
  const completedPlayerItems =
    (playerCount - missingBirthCert) +
    (playerCount - missingPhoto) +
    (playerCount - missingContract);
  const completedCoachItems =
    (hasConcussion ? 1 : 0) + (hasCardiac ? 1 : 0) + (hasTournamentAck ? 1 : 0);
  const completedItems = completedPlayerItems + completedCoachItems;
  const progressPct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // Action items
  const actionItems: { label: string; count?: number; href: string }[] = [];
  if (missingBirthCert > 0)
    actionItems.push({ label: "players missing birth certificate", count: missingBirthCert, href: "/coach/checklist" });
  if (missingPhoto > 0)
    actionItems.push({ label: "players missing player photo", count: missingPhoto, href: "/coach/checklist" });
  if (missingContract > 0)
    actionItems.push({ label: "players haven\u2019t signed contract", count: missingContract, href: "/coach/checklist" });
  if (!hasConcussion)
    actionItems.push({ label: "Concussion certification not uploaded", href: "/coach/certifications" });
  if (!hasCardiac)
    actionItems.push({ label: "Cardiac arrest certification not uploaded", href: "/coach/certifications" });
  if (!hasTournamentAck)
    actionItems.push({ label: "Tournament rules not acknowledged", href: "/coach/tournament-rules" });

  const allClear = actionItems.length === 0 && playerCount > 0;

  /* ---- Loading skeleton ---- */

  if (loading) {
    return (
      <div className="p-6 md:p-10 space-y-6">
        <div>
          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
        </div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
            <div className="h-5 w-40 bg-gray-200 rounded mb-3" />
            <div className="h-4 w-64 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  /* ---- Render ---- */

  return (
    <div className="p-6 md:p-10 space-y-6">
      {/* Header */}
      <div>
        <p className="font-display text-sm font-semibold text-flag-red uppercase tracking-[3px] mb-1">
          Coach
        </p>
        <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide">
          Dashboard
        </h1>
      </div>

      {/* 1. Your Team Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <p className="text-xs font-bold text-flag-red uppercase tracking-[2px] mb-1">
          Your Team
        </p>
        {division ? (
          <>
            <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide text-flag-blue">
              {division}
            </h2>
            <p className="text-gray-600 mt-1">
              {playerCount} player{playerCount !== 1 ? "s" : ""} registered
            </p>
            <p className="text-sm text-gray-400 mt-0.5">2026 Tournament Season</p>
          </>
        ) : (
          <p className="text-gray-500 mt-2">
            Division not yet assigned. Contact the coordinator.
          </p>
        )}
      </div>

      {/* 2. Compliance Progress */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-display text-lg font-bold uppercase tracking-wide text-flag-blue mb-3">
          Compliance Progress
        </h3>
        {division ? (
          <>
            <p className="text-gray-700 font-semibold mb-2">
              {completedItems} of {totalItems} items complete
            </p>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  progressPct >= 100
                    ? "bg-green-500"
                    : progressPct >= 50
                    ? "bg-flag-gold"
                    : "bg-flag-red"
                }`}
                style={{ width: `${Math.min(progressPct, 100)}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Your binder must be 100% complete before the pre-tournament manager meeting.
            </p>
          </>
        ) : (
          <p className="text-gray-400 text-sm">
            Assign a division to see your team&apos;s status.
          </p>
        )}
      </div>

      {/* 3. Action Items */}
      <div
        className={`bg-white border rounded-lg p-6 ${
          division
            ? allClear
              ? "border-l-4 border-l-green-500 border-gray-200"
              : "border-l-4 border-l-flag-red border-gray-200"
            : "border-gray-200"
        }`}
      >
        <h3 className="font-display text-lg font-bold uppercase tracking-wide text-flag-blue mb-3">
          Action Items
        </h3>
        {!division ? (
          <p className="text-gray-400 text-sm">
            Assign a division to see your team&apos;s status.
          </p>
        ) : allClear ? (
          <div className="flex items-center gap-3 text-green-600">
            <CheckCircle2 size={24} />
            <span className="font-semibold text-lg">
              All Clear &mdash; Tournament Ready!
            </span>
          </div>
        ) : (
          <ul className="space-y-3">
            {actionItems.map((item, i) => (
              <li key={i}>
                <Link
                  href={item.href}
                  className="flex items-center justify-between group hover:bg-gray-50 -mx-2 px-2 py-1.5 rounded-lg transition-colors"
                >
                  <span className="flex items-center gap-2 text-gray-700">
                    <AlertCircle size={18} className="text-flag-red shrink-0" />
                    {item.count !== undefined ? (
                      <>
                        <span className="inline-flex items-center justify-center bg-flag-red text-white text-xs font-bold rounded-full w-5 h-5">
                          {item.count}
                        </span>
                        {item.label}
                      </>
                    ) : (
                      item.label
                    )}
                  </span>
                  <ChevronRight
                    size={16}
                    className="text-gray-400 group-hover:text-flag-blue transition-colors"
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 4. Upcoming */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-display text-lg font-bold uppercase tracking-wide text-flag-blue mb-3">
          Upcoming
        </h3>
        <ul className="space-y-3">
          {upcomingDates.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <Calendar size={18} className="text-flag-gold mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-gray-800">{item.event}</p>
                <p className="text-sm text-gray-500">{item.date}</p>
              </div>
            </li>
          ))}
        </ul>
        <a
          href="https://docs.google.com/spreadsheets/d/1Drx76VHKBQrb-dcL8nCfBUfxZio9pVXBVf01HHbcuh0/edit?gid=1045930144#gid=1045930144"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-flag-blue hover:text-flag-red transition-colors"
        >
          <ExternalLink size={14} />
          View Full Sanction Play Schedule
        </a>
      </div>

      {/* 5. Announcements (if any) */}
      {announcements.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-display text-lg font-bold uppercase tracking-wide text-flag-blue mb-3">
            Latest Announcements
          </h3>
          <ul className="space-y-4">
            {announcements.map((a) => (
              <li key={a.id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                <p className="font-semibold text-gray-800">{a.title}</p>
                <p className="text-sm text-gray-500 line-clamp-2">{a.body}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(a.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 6. Quick Links */}
      <div>
        <h3 className="font-display text-lg font-bold uppercase tracking-wide text-flag-blue mb-3">
          Quick Links
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="bg-white border border-gray-200 rounded-lg p-5 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="bg-flag-blue/10 text-flag-blue p-2.5 rounded-lg">
                  <Icon size={22} />
                </div>
                <span className="font-semibold text-gray-800">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

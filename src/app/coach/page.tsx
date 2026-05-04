"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { HelpTooltip } from "@/components/help-tooltip";
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
  Trophy,
  FileSpreadsheet,
  DollarSign,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { useCoachTeams } from "@/hooks/use-coach-teams";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Profile {
  full_name: string | null;
}

interface Registration {
  id: string;
  team_id: string | null;
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
  { href: "/coach/checklist", label: "Checklist", icon: ClipboardCheck },
  { href: "/coach/pitching-log", label: "Pitching", icon: ClipboardList },
  { href: "/coach/roster", label: "Roster", icon: Users },
  { href: "/coach/certifications", label: "Certs", icon: Award },
  { href: "/coach/tournament-rules", label: "Rules", icon: BookOpen },
  { href: "/coach/updates", label: "Updates", icon: Megaphone },
  { href: "/portal", label: "Parent", icon: Home },
];

const coachesCorner: Array<{
  href: string | null;
  label: string;
  tagline: string;
  description: string;
  icon: typeof Trophy;
}> = [
  {
    href: "/coach/corner/tournaments",
    label: "Tournaments",
    tagline: "Play Prepared",
    description: "MDT schedule, division rules, entry forms, hotel blocks.",
    icon: Trophy,
  },
  {
    href: "/coach/corner/templates",
    label: "Templates",
    tagline: "Run Your Team",
    description: "Snack schedule and team templates ready to download.",
    icon: FileSpreadsheet,
  },
  {
    href: "/coach/corner/fundraising",
    label: "Fundraising",
    tagline: "Fund The Season",
    description: "Six proven fundraising playbooks for your team.",
    icon: DollarSign,
  },
  {
    href: null,
    label: "Coming Soon",
    tagline: "More On Deck",
    description: "More coach resources dropping throughout the season.",
    icon: Sparkles,
  },
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
  const {
    teams: myTeams,
    loaded: teamsLoaded,
  } = useCoachTeams(user?.id);

  const [loading, setLoading] = useState(true);
  const [, setProfile] = useState<Profile | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [documents, setDocuments] = useState<PlayerDocument[]>([]);
  const [contracts, setContracts] = useState<PlayerContract[]>([]);
  const [coachCerts, setCoachCerts] = useState<CoachCert[]>([]);
  const [tournamentAgreements, setTournamentAgreements] = useState<TournamentAgreement[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const myDivisions = useMemo(
    () => [...new Set(myTeams.map((t) => t.division))],
    [myTeams]
  );

  useEffect(() => {
    if (!user || !supabase) {
      setLoading(false);
      return;
    }
    if (!teamsLoaded) return;

    let cancelled = false;

    async function load() {
      if (!supabase || !user) return;

      // 1. Coach profile (still need full_name elsewhere)
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      if (cancelled) return;
      setProfile(profileData as Profile | null);

      const teamIds = myTeams.map((t) => t.id);

      // Parallel fetches: drafted (on my teams) + undrafted pool (in my divisions, no team yet)
      const [draftedRes, undraftedRes, certsResult, agreementsResult, announcementsResult] =
        await Promise.all([
          // 2a. Drafted players on my teams
          teamIds.length > 0
            ? supabase
                .from("tryout_registrations")
                .select("id, team_id")
                .in("team_id", teamIds)
                .in("status", ["selected", "alternate"])
            : Promise.resolve({ data: [] as Registration[] }),

          // 2b. Undrafted pool in my divisions
          myDivisions.length > 0
            ? supabase
                .from("tryout_registrations")
                .select("id, team_id")
                .is("team_id", null)
                .in("division", myDivisions)
                .in("status", ["selected", "alternate"])
            : Promise.resolve({ data: [] as Registration[] }),

          // 3. Coach certifications
          supabase
            .from("coach_certifications")
            .select("cert_type")
            .eq("coach_id", user.id),

          // 4. Tournament agreements
          supabase
            .from("tournament_agreements")
            .select("id")
            .eq("coach_id", user.id),

          // 5. Announcements
          supabase
            .from("announcements")
            .select("id, title, body, created_at")
            .order("created_at", { ascending: false })
            .limit(3),
        ]);

      if (cancelled) return;

      const drafted = (draftedRes.data ?? []) as Registration[];
      const undrafted = (undraftedRes.data ?? []) as Registration[];
      // Dashboard "your team" stats reflect drafted players only.
      setRegistrations(drafted);
      setCoachCerts((certsResult.data ?? []) as CoachCert[]);
      setTournamentAgreements((agreementsResult.data ?? []) as TournamentAgreement[]);
      setAnnouncements((announcementsResult.data ?? []) as Announcement[]);

      // 6. Docs and contracts for everyone the coach can see (drafted + pool)
      const visibleRegs = [...drafted, ...undrafted];
      if (visibleRegs.length > 0) {
        const regIds = visibleRegs.map((r) => r.id);

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
      } else {
        setDocuments([]);
        setContracts([]);
      }

      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user, teamsLoaded, myTeams, myDivisions]);

  /* ---- Derived stats ---- */

  const hasTeam = myTeams.length > 0;
  const playerCount = registrations.length;

  // Build sets for quick lookup
  const hasBirthCert = new Set(
    documents.filter((d) => d.document_type === "birth_certificate").map((d) => d.registration_id)
  );
  const hasContract = new Set(contracts.map((c) => c.registration_id));

  const missingBirthCert = registrations.filter((r) => !hasBirthCert.has(r.id)).length;
  const missingContract = registrations.filter((r) => !hasContract.has(r.id)).length;

  const certTypes = new Set(coachCerts.map((c) => c.cert_type));
  const hasConcussion = certTypes.has("concussion");
  const hasCardiac = certTypes.has("cardiac_arrest");
  const hasTournamentAck = tournamentAgreements.length > 0;

  // Compliance calculation
  const totalItems = playerCount * 2 + 2 + 1; // 2 per player (birth cert + contract) + 2 certs + 1 agreement
  const completedPlayerItems =
    (playerCount - missingBirthCert) +
    (playerCount - missingContract);
  const completedCoachItems =
    (hasConcussion ? 1 : 0) + (hasCardiac ? 1 : 0) + (hasTournamentAck ? 1 : 0);
  const completedItems = completedPlayerItems + completedCoachItems;
  const progressPct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // Action items
  const actionItems: { label: string; count?: number; href: string }[] = [];
  if (missingBirthCert > 0)
    actionItems.push({ label: "players missing birth certificate", count: missingBirthCert, href: "/coach/checklist" });
  if (missingContract > 0)
    actionItems.push({ label: "players haven't signed contract", count: missingContract, href: "/coach/checklist" });
  if (!hasConcussion)
    actionItems.push({ label: "Concussion certification not uploaded", href: "/coach/certifications" });
  if (!hasCardiac)
    actionItems.push({ label: "Cardiac arrest certification not uploaded", href: "/coach/certifications" });
  if (!hasTournamentAck)
    actionItems.push({ label: "Tournament rules not acknowledged", href: "/coach/tournament-rules" });

  const allClear = actionItems.length === 0 && playerCount > 0;

  /* ---- Loading skeleton ---- */

  if (loading || !teamsLoaded) {
    return (
      <div className="p-6 md:p-10 space-y-6">
        <div>
          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
        </div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-2xl p-6 animate-pulse">
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
        <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide flex items-center">
          Dashboard
          <HelpTooltip
            text="Your home base with compliance progress, action items, and announcements."
            guideUrl="/coach/help"
          />
        </h1>
      </div>

      {/* Compact Quick Links strip */}
      <div className="bg-white border border-gray-200 rounded-2xl p-2 sm:p-3">
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-1">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-lg text-gray-600 hover:bg-flag-blue/5 hover:text-flag-blue transition-colors min-h-[56px]"
              >
                <Icon size={18} />
                <span className="text-[10px] font-semibold uppercase tracking-wide leading-none">
                  {link.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 1. Your Team(s) Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6">
        <p className="text-xs font-bold text-flag-red uppercase tracking-[2px] mb-1">
          Your {myTeams.length > 1 ? "Teams" : "Team"}
        </p>
        {!hasTeam ? (
          <p className="text-gray-500 mt-2">
            No team assigned yet. Contact the league admin.
          </p>
        ) : (
          <>
            {myTeams.map((t, i) => (
              <h2
                key={t.id}
                className={`font-display ${
                  i === 0
                    ? "text-2xl md:text-3xl"
                    : "text-lg md:text-xl mt-1"
                } font-bold uppercase tracking-wide text-flag-blue`}
              >
                {t.team_name}
                {t.role === "assistant" && (
                  <span className="text-xs ml-2 text-gray-500 normal-case font-normal">
                    (asst)
                  </span>
                )}
              </h2>
            ))}
            <p className="text-gray-600 mt-1">
              {playerCount} player{playerCount !== 1 ? "s" : ""}{" "}
              {playerCount === 0 ? "drafted" : "on roster"}
            </p>
            <p className="text-sm text-gray-400 mt-0.5">2026 Tournament Season</p>
          </>
        )}
      </div>

      {/* 2. Compliance Progress */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6">
        <h3 className="font-display text-lg font-bold uppercase tracking-wide text-flag-blue mb-3">
          Compliance Progress
        </h3>
        {hasTeam ? (
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
            Once you&apos;re assigned to a team, your team&apos;s status will appear here.
          </p>
        )}
      </div>

      {/* 3. Action Items */}
      <div
        className={`bg-white border rounded-2xl p-4 sm:p-6 ${
          hasTeam
            ? allClear
              ? "border-l-4 border-l-green-500 border-gray-200"
              : "border-l-4 border-l-flag-red border-gray-200"
            : "border-gray-200"
        }`}
      >
        <h3 className="font-display text-lg font-bold uppercase tracking-wide text-flag-blue mb-3">
          Action Items
        </h3>
        {!hasTeam ? (
          <p className="text-gray-400 text-sm">
            Once you&apos;re assigned to a team, your team&apos;s status will appear here.
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
                  className="flex items-center justify-between group hover:bg-gray-50 -mx-2 px-2 py-2.5 min-h-[44px] rounded-lg transition-colors"
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
      <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6">
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
        <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6">
          <h3 className="font-display text-lg font-bold uppercase tracking-wide text-flag-blue mb-3">
            Latest Announcements
          </h3>
          <ul className="space-y-4">
            {announcements.map((a) => (
              <li key={a.id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-800">{a.title}</p>
                  {a.title.startsWith("Tournament:") && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-star-gold/20 text-amber-700">
                      Tournament
                    </span>
                  )}
                </div>
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

      {/* 6. Coach's Corner */}
      <div>
        <p className="font-display text-xs font-semibold text-flag-red uppercase tracking-[3px] mb-1">
          &#9733; Resources
        </p>
        <h3 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide text-charcoal mb-1">
          Coach&apos;s Corner
        </h3>
        <p className="text-sm text-gray-500 mb-5">
          Resources, templates, and guides to help you run your team.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {coachesCorner.map((card) => {
            const Icon = card.icon;
            const isLive = !!card.href;

            if (!isLive) {
              return (
                <div
                  key={card.label}
                  className="relative overflow-hidden rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-6 min-h-[172px] flex flex-col justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="bg-gray-200 text-gray-400 p-2.5 rounded-lg shrink-0">
                      <Icon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-[10px] font-semibold uppercase tracking-[2px] text-gray-400 mb-0.5">
                        {card.tagline}
                      </p>
                      <p className="font-display text-xl font-bold uppercase tracking-wide text-gray-400">
                        {card.label}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 leading-snug mt-4">
                    {card.description}
                  </p>
                </div>
              );
            }

            return (
              <Link
                key={card.label}
                href={card.href!}
                className="group relative overflow-hidden rounded-2xl bg-flag-blue p-6 min-h-[172px] flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-flag-blue/20"
              >
                {/* Star pattern overlay */}
                <div
                  aria-hidden
                  className="absolute inset-0 text-white/[0.05] text-xl leading-[2.8rem] tracking-widest overflow-hidden pointer-events-none p-2"
                >
                  {"★ ".repeat(80)}
                </div>

                {/* Red accent corner ribbon */}
                <div
                  aria-hidden
                  className="absolute top-0 left-0 w-16 h-1 bg-flag-red"
                />
                <div
                  aria-hidden
                  className="absolute top-0 left-0 w-1 h-16 bg-flag-red"
                />

                {/* Gold top stripe (appears on hover) */}
                <div
                  aria-hidden
                  className="absolute top-0 right-0 w-0 h-1 bg-star-gold-bright transition-all duration-500 group-hover:w-full"
                />

                <div className="relative z-10 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="bg-white/10 text-star-gold-bright p-2.5 rounded-lg shrink-0 border border-white/10 backdrop-blur-sm">
                      <Icon size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-[10px] font-semibold uppercase tracking-[2px] text-star-gold-bright mb-0.5">
                        {card.tagline}
                      </p>
                      <p className="font-display text-xl md:text-2xl font-bold uppercase tracking-wide text-white leading-tight">
                        {card.label}
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    size={20}
                    className="text-white/40 group-hover:text-star-gold-bright group-hover:translate-x-1 transition-all duration-300 shrink-0 mt-1"
                  />
                </div>

                <p className="relative z-10 text-xs text-white/70 leading-snug mt-4 pl-[46px]">
                  {card.description}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

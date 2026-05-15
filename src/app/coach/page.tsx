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
  FileText,
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

interface TeamCoach {
  team_id: string;
  coach_id: string;
  role: string;
  full_name: string | null;
  email: string;
}

interface PendingInvite {
  team_id: string;
  email: string;
  expires_at: string;
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
  newTab?: boolean;
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
    href: "/docs/2026-affidavit-process-guide.pdf",
    newTab: true,
    label: "Affidavits",
    tagline: "Tournament Eligibility",
    description: "Step-by-step guide for completing the Tournament Team Eligibility Affidavit.",
    icon: FileText,
  },
];

interface UpcomingEvent {
  event: string;
  date: string;
  // end ISO date used for filtering; null = always show (open-ended)
  end: string | null;
}

const upcomingDates: UpcomingEvent[] = [
  { event: "Coach Candidacy Deadline", date: "March 22", end: "2026-03-22" },
  { event: "Peer Coach Voting", date: "March 24 - 26", end: "2026-03-26" },
  { event: "All-Star Coaches Named", date: "March 27", end: "2026-03-27" },
  { event: "Scouting Period", date: "March 28 - April 11", end: "2026-04-11" },
  { event: "All-Star Tryouts", date: "April 12", end: "2026-04-12" },
  { event: "Players Notified", date: "April 14", end: "2026-04-14" },
  { event: "Memorial Day Tournament", date: "May 21 - 25 (league-funded)", end: "2026-05-25" },
  { event: "District Tournaments Begin", date: "June 11", end: "2026-06-11" },
  { event: "Binder Sign-Off Deadline", date: "Before your first tournament game", end: null },
];

function filterUpcoming(events: UpcomingEvent[]): UpcomingEvent[] {
  const now = new Date();
  const todayStr =
    now.getFullYear() +
    "-" +
    String(now.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(now.getDate()).padStart(2, "0");
  return events.filter((e) => e.end === null || e.end >= todayStr);
}

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
  const [teamCoaches, setTeamCoaches] = useState<TeamCoach[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [inviteFormTeam, setInviteFormTeam] = useState<string | null>(null);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<Record<string, string>>({});

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

      // 5b. Coaching staff on my teams + pending invites
      if (teamIds.length > 0) {
        type TcRow = {
          team_id: string;
          coach_id: string;
          role: string;
          profiles: { full_name: string | null; email: string } | { full_name: string | null; email: string }[] | null;
        };
        const [tcRes, inviteRes] = await Promise.all([
          supabase
            .from("team_coaches")
            .select("team_id, coach_id, role, profiles!team_coaches_coach_id_fkey ( full_name, email )")
            .in("team_id", teamIds),
          supabase
            .from("invites")
            .select("team_id, email, expires_at")
            .in("team_id", teamIds)
            .eq("team_role", "assistant")
            .eq("used", false)
            .gt("expires_at", new Date().toISOString()),
        ]);
        if (cancelled) return;
        const tcRows = (tcRes.data ?? []) as TcRow[];
        setTeamCoaches(
          tcRows.flatMap((row) => {
            const p = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
            if (!p) return [];
            return [{
              team_id: row.team_id,
              coach_id: row.coach_id,
              role: row.role,
              full_name: p.full_name,
              email: p.email,
            }];
          })
        );
        setPendingInvites((inviteRes.data ?? []) as PendingInvite[]);
      } else {
        setTeamCoaches([]);
        setPendingInvites([]);
      }

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

  async function submitAssistantInvite(teamId: string) {
    if (!supabase) return;
    const email = inviteEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setInviteStatus((s) => ({ ...s, [teamId]: "Enter a valid email." }));
      return;
    }
    setInviting(true);
    setInviteStatus((s) => ({ ...s, [teamId]: "" }));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) {
        setInviteStatus((s) => ({ ...s, [teamId]: "Please sign in again." }));
        setInviting(false);
        return;
      }
      const res = await fetch("/api/invite-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ teamId, assistantEmail: email, assistantName: inviteName.trim() || undefined }),
      });
      const payload = await res.json();
      if (!res.ok) {
        setInviteStatus((s) => ({ ...s, [teamId]: payload.error || "Failed to invite." }));
      } else if (payload.status === "already_on_team") {
        setInviteStatus((s) => ({ ...s, [teamId]: "Already on this team." }));
      } else if (payload.status === "linked_existing") {
        setInviteStatus((s) => ({ ...s, [teamId]: `Added ${email}. They already have an account.` }));
        setInviteEmail("");
        setInviteName("");
        setInviteFormTeam(null);
      } else {
        setInviteStatus((s) => ({ ...s, [teamId]: `Invite sent to ${email}.` }));
        setPendingInvites((prev) => [
          ...prev,
          { team_id: teamId, email, expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() },
        ]);
        setInviteEmail("");
        setInviteName("");
        setInviteFormTeam(null);
      }
    } catch {
      setInviteStatus((s) => ({ ...s, [teamId]: "Network error. Try again." }));
    }
    setInviting(false);
  }

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

      {/* 0. Helper: invite assistant */}
      {/* Defined inline below as section "Coaching Staff" */}

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

      {/* 1b. Coaching Staff */}
      {hasTeam && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-lg font-bold uppercase tracking-wide text-flag-blue">
              Coaching Staff
            </h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Add assistant coaches so they can help upload contracts, birth certificates, and certifications.
          </p>
          {myTeams.map((team) => {
            const staff = teamCoaches.filter((tc) => tc.team_id === team.id);
            const pending = pendingInvites.filter((p) => p.team_id === team.id);
            const isFormOpen = inviteFormTeam === team.id;
            return (
              <div key={team.id} className="mb-4 last:mb-0 pb-4 last:pb-0 border-b last:border-0 border-gray-100">
                <p className="font-display text-sm font-bold uppercase tracking-wide text-charcoal mb-2">
                  {team.team_name}
                </p>
                <ul className="space-y-1.5 mb-3">
                  {staff.length === 0 && (
                    <li className="text-sm text-gray-400 italic">No coaches assigned yet.</li>
                  )}
                  {staff.map((tc) => (
                    <li key={tc.coach_id} className="flex items-center gap-2 text-sm">
                      <span className={`inline-block w-2 h-2 rounded-full ${tc.role === "head" ? "bg-flag-blue" : "bg-flag-gold"}`} />
                      <span className="font-medium text-charcoal">{tc.full_name || tc.email}</span>
                      <span className="text-xs text-gray-500">
                        ({tc.role === "head" ? "Head Coach" : "Assistant"})
                      </span>
                    </li>
                  ))}
                  {pending.map((p) => (
                    <li key={`${p.team_id}-${p.email}`} className="flex items-center gap-2 text-sm">
                      <span className="inline-block w-2 h-2 rounded-full bg-gray-300" />
                      <span className="text-gray-500">{p.email}</span>
                      <span className="text-xs text-gray-400">(invite sent, pending)</span>
                    </li>
                  ))}
                </ul>
                {isFormOpen ? (
                  <div className="bg-flag-blue/5 border border-flag-blue/20 rounded-xl p-3 space-y-2">
                    <input
                      type="text"
                      placeholder="Assistant's name (optional)"
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      className="w-full min-h-[40px] px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-charcoal placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-flag-blue/30 focus:border-flag-blue"
                    />
                    <input
                      type="email"
                      placeholder="email@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full min-h-[40px] px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-charcoal placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-flag-blue/30 focus:border-flag-blue"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => submitAssistantInvite(team.id)}
                        disabled={inviting}
                        className="min-h-[40px] bg-flag-blue hover:bg-flag-blue-mid disabled:opacity-50 text-white px-4 py-2 rounded-full font-display text-xs font-semibold uppercase tracking-widest transition-colors"
                      >
                        {inviting ? "Sending..." : "Send Invite"}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setInviteFormTeam(null); setInviteEmail(""); setInviteName(""); }}
                        className="min-h-[40px] border border-gray-200 hover:border-gray-400 text-charcoal px-4 py-2 rounded-full font-display text-xs font-semibold uppercase tracking-widest transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                    {inviteStatus[team.id] && (
                      <p className="text-xs text-gray-600 pt-1">{inviteStatus[team.id]}</p>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setInviteFormTeam(team.id); setInviteEmail(""); setInviteName(""); }}
                    className="text-sm font-semibold text-flag-blue hover:text-flag-blue-mid transition-colors"
                  >
                    + Add assistant coach
                  </button>
                )}
                {inviteFormTeam !== team.id && inviteStatus[team.id] && (
                  <p className="text-xs text-gray-600 mt-2">{inviteStatus[team.id]}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

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
      {(() => {
        const visible = filterUpcoming(upcomingDates);
        if (visible.length === 0) return null;
        return (
          <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6">
            <h3 className="font-display text-lg font-bold uppercase tracking-wide text-flag-blue mb-3">
              Upcoming
            </h3>
            <ul className="space-y-3">
              {visible.map((item, i) => (
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
        );
      })()}

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

            const cardClass =
              "group relative overflow-hidden rounded-2xl bg-flag-blue p-6 min-h-[172px] flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-flag-blue/20";

            const inner = (
              <>
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
              </>
            );

            if (card.newTab) {
              return (
                <a
                  key={card.label}
                  href={card.href!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cardClass}
                >
                  {inner}
                </a>
              );
            }

            return (
              <Link key={card.label} href={card.href!} className={cardClass}>
                {inner}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

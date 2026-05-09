"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { viewAndDownloadDoc } from "@/lib/storage-helpers";
import { HelpTooltip } from "@/components/help-tooltip";
import {
  ShieldCheck,
  Shield,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Eye,
  X,
  Printer,
  FileText,
} from "lucide-react";

/* ---------- Types ---------- */

interface Registration {
  id: string;
  player_first_name: string;
  player_last_name: string;
  division: string;
  team_id: string | null;
  status: string;
}

interface Document {
  registration_id: string;
  document_type: string;
}

interface Contract {
  registration_id: string;
}

interface Team {
  id: string;
  division: string;
  team_name: string;
  coach_id: string | null;
  coach_email: string | null;
}

interface CoachCert {
  coach_id: string;
  cert_type: string;
}

interface CoachApp {
  email: string;
  full_name: string;
}

interface TeamCoachAssignment {
  team_id: string;
  coach_id: string;
  role: string;
  email: string;
  full_name: string | null;
}

interface TournamentAgreement {
  id: string;
  coach_id: string;
  division: string;
  agreement_type: string;
  coach_name: string;
  acknowledged: boolean;
  acknowledged_at: string;
}

interface TeamAffidavit {
  id: string;
  document_type: string;
  division: string | null;
  team_id: string | null;
  file_path: string | null;
  file_name: string | null;
  created_at: string | null;
}

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

interface PlayerRow {
  id: string;
  name: string;
  hasContract: boolean;
  hasBirthCert: boolean;
  isReady: boolean;
}

interface TeamGroup {
  teamId: string | null;
  teamName: string;
  headCoachName: string | null;
  coachNames: string[];
  coachCount: number;
  hasConcussion: boolean;
  hasCardiac: boolean;
  players: PlayerRow[];
}

interface DivisionCompliance {
  division: string;
  teams: TeamGroup[];
  players: PlayerRow[]; // flat aggregate kept for header counts
  totalPlayers: number;
  readyCount: number;
  contractCount: number;
  birthCertCount: number;
}

export default function CompliancePage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamCoaches, setTeamCoaches] = useState<TeamCoachAssignment[]>([]);
  const [coachCerts, setCoachCerts] = useState<CoachCert[]>([]);
  const [coachApps, setCoachApps] = useState<CoachApp[]>([]);
  const [agreements, setAgreements] = useState<TournamentAgreement[]>([]);
  const [affidavits, setAffidavits] = useState<TeamAffidavit[]>([]);
  const [profiles, setProfiles] = useState<Array<{ id: string; email: string; full_name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [viewingAgreement, setViewingAgreement] = useState<{ coach: typeof profiles[0]; agreement: TournamentAgreement } | null>(null);
  const [expandedDivisions, setExpandedDivisions] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    fetchData();
  }, []);

  async function fetchData() {
    if (!supabase) return;
    setLoading(true);

    const [regsRes, docsRes, contractsRes, teamsRes, teamCoachesRes, certsRes, coachAppsRes, agreementsRes, profilesRes, affidavitsRes] = await Promise.all([
      supabase
        .from("tryout_registrations")
        .select("id, player_first_name, player_last_name, division, team_id, status")
        .in("status", ["selected", "confirmed", "tryout_complete", "alternate"])
        .order("division")
        .order("player_last_name"),
      supabase
        .from("player_documents")
        .select("registration_id, document_type"),
      supabase.from("player_contracts").select("registration_id"),
      supabase.from("teams").select("id, division, team_name, coach_id, coach_email"),
      supabase
        .from("team_coaches")
        .select("team_id, role, coach_id, profiles!team_coaches_coach_id_fkey ( email, full_name )"),
      supabase.from("coach_certifications").select("coach_id, cert_type"),
      supabase.from("coach_applications").select("email, full_name"),
      supabase.from("tournament_agreements").select("*"),
      supabase.from("profiles").select("id, email, full_name").eq("role", "coach"),
      supabase
        .from("team_documents")
        .select("id, document_type, division, team_id, file_path, file_name, created_at")
        .in("document_type", [
          "affidavit_final",
          "affidavit_page_1",
          "affidavit_page_2",
          "affidavit_page_3",
        ]),
    ]);

    if (regsRes.data) setRegistrations(regsRes.data);
    if (docsRes.data) setDocuments(docsRes.data);
    if (contractsRes.data) setContracts(contractsRes.data);
    if (teamsRes.data) setTeams(teamsRes.data);
    if (teamCoachesRes.data) {
      // Defensive normalization: Supabase may return the joined `profiles`
      // as either a single object or an array depending on the relationship
      // shape. Flatten to a stable TeamCoachAssignment shape.
      const normalized: TeamCoachAssignment[] = (teamCoachesRes.data as unknown as Array<{
        team_id: string;
        coach_id: string;
        role: string;
        profiles: { email: string; full_name: string | null } | Array<{ email: string; full_name: string | null }> | null;
      }>).map((row) => {
        const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
        return {
          team_id: row.team_id,
          coach_id: row.coach_id,
          role: row.role,
          email: profile?.email ?? "",
          full_name: profile?.full_name ?? null,
        };
      });
      setTeamCoaches(normalized);
    }
    if (certsRes.data) setCoachCerts(certsRes.data);
    if (coachAppsRes.data) setCoachApps(coachAppsRes.data);
    if (agreementsRes.data) setAgreements(agreementsRes.data);
    if (profilesRes.data) setProfiles(profilesRes.data);
    if (affidavitsRes.data) setAffidavits(affidavitsRes.data as TeamAffidavit[]);
    setLoading(false);
  }

  const contractSet = useMemo(
    () => new Set(contracts.map((c) => c.registration_id)),
    [contracts]
  );

  const docsByReg = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const d of documents) {
      if (!map.has(d.registration_id)) map.set(d.registration_id, new Set());
      map.get(d.registration_id)!.add(d.document_type);
    }
    return map;
  }, [documents]);

  // Email → name lookup from coach applications
  const coachNameByEmail = useMemo(() => {
    const map = new Map<string, string>();
    for (const app of coachApps) {
      map.set(app.email.toLowerCase(), app.full_name);
    }
    return map;
  }, [coachApps]);

  // Per-team coach + cert lookup. Replaces the old division-keyed map so
  // multi-team divisions (9U-Mustang, 12U-Bronco, etc.) attribute coaches
  // to the right team.
  const coachCertsByTeam = useMemo(() => {
    const map = new Map<string, {
      teamName: string;
      headCoachName: string | null;
      coachNames: string[];
      coachCount: number;
      hasConcussion: boolean;
      hasCardiac: boolean;
    }>();
    for (const team of teams) {
      const assignments = teamCoaches.filter((tc) => tc.team_id === team.id);
      const coachIds = assignments.map((a) => a.coach_id);
      const headCoach = assignments.find((a) => a.role === "head");
      let headCoachName = headCoach
        ? (headCoach.full_name ?? headCoach.email)
        : null;
      let coachNames = assignments.map((a) => a.full_name ?? a.email);
      let coachCount = coachIds.length;
      let hasConcussion = coachIds.length > 0 && coachIds.every((id) =>
        coachCerts.some((c) => c.coach_id === id && c.cert_type === "concussion")
      );
      let hasCardiac = coachIds.length > 0 && coachIds.every((id) =>
        coachCerts.some((c) => c.coach_id === id && c.cert_type === "cardiac_arrest")
      );

      // Fallback to legacy teams.coach_id path when team_coaches is empty.
      if (assignments.length === 0) {
        const legacyName = team.coach_email
          ? (coachNameByEmail.get(team.coach_email.toLowerCase()) ?? team.coach_email)
          : null;
        headCoachName = legacyName;
        coachNames = legacyName ? [legacyName] : [];
        coachCount = team.coach_id ? 1 : 0;
        hasConcussion = team.coach_id
          ? coachCerts.some((c) => c.coach_id === team.coach_id && c.cert_type === "concussion")
          : false;
        hasCardiac = team.coach_id
          ? coachCerts.some((c) => c.coach_id === team.coach_id && c.cert_type === "cardiac_arrest")
          : false;
      }

      map.set(team.id, {
        teamName: team.team_name,
        headCoachName,
        coachNames,
        coachCount,
        hasConcussion,
        hasCardiac,
      });
    }
    return map;
  }, [teams, teamCoaches, coachCerts, coachNameByEmail]);

  const divisionData: DivisionCompliance[] = useMemo(() => {
    return DIVISIONS.map((division) => {
      const divRegs = registrations.filter((r) => r.division === division);
      const divTeams = teams.filter((t) => t.division === division);

      const playerForReg = (r: Registration): PlayerRow => {
        const docTypes = docsByReg.get(r.id) ?? new Set();
        const hasContract = contractSet.has(r.id);
        const hasBirthCert = docTypes.has("birth_certificate");
        return {
          id: r.id,
          name: `${r.player_first_name} ${r.player_last_name}`,
          hasContract,
          hasBirthCert,
          isReady: hasContract && hasBirthCert,
        };
      };

      const groupsByTeamId = new Map<string, PlayerRow[]>();
      const unassigned: PlayerRow[] = [];
      for (const r of divRegs) {
        const row = playerForReg(r);
        if (r.team_id) {
          if (!groupsByTeamId.has(r.team_id)) groupsByTeamId.set(r.team_id, []);
          groupsByTeamId.get(r.team_id)!.push(row);
        } else {
          unassigned.push(row);
        }
      }

      const groups: TeamGroup[] = divTeams
        .map((team): TeamGroup => {
          const cert = coachCertsByTeam.get(team.id);
          return {
            teamId: team.id,
            teamName: team.team_name,
            headCoachName: cert?.headCoachName ?? null,
            coachNames: cert?.coachNames ?? [],
            coachCount: cert?.coachCount ?? 0,
            hasConcussion: cert?.hasConcussion ?? false,
            hasCardiac: cert?.hasCardiac ?? false,
            players: groupsByTeamId.get(team.id) ?? [],
          };
        })
        .sort((a, b) => a.teamName.localeCompare(b.teamName));

      // Players whose team_id doesn't match any current team in the division
      // (rare, but possible after a team was deleted). Bucket them with the
      // unassigned group rather than dropping silently.
      const knownTeamIds = new Set(divTeams.map((t) => t.id));
      for (const [teamId, rows] of groupsByTeamId) {
        if (!knownTeamIds.has(teamId)) unassigned.push(...rows);
      }

      if (unassigned.length > 0) {
        groups.push({
          teamId: null,
          teamName: "Unassigned",
          headCoachName: null,
          coachNames: [],
          coachCount: 0,
          hasConcussion: false,
          hasCardiac: false,
          players: unassigned,
        });
      }

      const allPlayers = groups.flatMap((g) => g.players);

      return {
        division,
        teams: groups,
        players: allPlayers,
        totalPlayers: allPlayers.length,
        readyCount: allPlayers.filter((p) => p.isReady).length,
        contractCount: allPlayers.filter((p) => p.hasContract).length,
        birthCertCount: allPlayers.filter((p) => p.hasBirthCert).length,
      };
    }).filter((d) => d.totalPlayers > 0 || teams.some((t) => t.division === d.division));
  }, [registrations, docsByReg, contractSet, teams, coachCertsByTeam]);

  // Coach → distinct divisions derived from team_coaches → teams.division.
  // A coach may be on teams across multiple divisions after the team-scoped
  // roster refactor; profiles.division is legacy and not used here.
  const coachDivisionsById = useMemo(() => {
    const teamDivisionById = new Map<string, string>();
    for (const t of teams) teamDivisionById.set(t.id, t.division);
    const map = new Map<string, string[]>();
    for (const tc of teamCoaches) {
      const division = teamDivisionById.get(tc.team_id);
      if (!division) continue;
      const existing = map.get(tc.coach_id);
      if (existing) {
        if (!existing.includes(division)) existing.push(division);
      } else {
        map.set(tc.coach_id, [division]);
      }
    }
    return map;
  }, [teams, teamCoaches]);


  // Latest affidavit per team (team_documents may carry multiple uploads
  // if a coach replaces; pick the newest by created_at). Team-scoped now that
  // team_id is stored on the row, so divisions with multiple teams (e.g.
  // 9U-Mustang Hopp/Bernal/Grifka) no longer collide.
  const affidavitByTeam = useMemo(() => {
    const map = new Map<string, TeamAffidavit>();
    for (const a of affidavits) {
      if (!a.team_id || a.document_type !== "affidavit_final") continue;
      const existing = map.get(a.team_id);
      if (
        !existing ||
        (a.created_at &&
          existing.created_at &&
          new Date(a.created_at) > new Date(existing.created_at))
      ) {
        map.set(a.team_id, a);
      }
    }
    return map;
  }, [affidavits]);

  const affidavitPagesByTeam = useMemo(() => {
    const map = new Map<string, Map<number, TeamAffidavit>>();
    for (const a of affidavits) {
      if (!a.team_id) continue;
      const m = a.document_type.match(/^affidavit_page_(\d)$/);
      if (!m) continue;
      const n = parseInt(m[1], 10);
      let pages = map.get(a.team_id);
      if (!pages) {
        pages = new Map();
        map.set(a.team_id, pages);
      }
      const existing = pages.get(n);
      if (
        !existing ||
        (a.created_at &&
          existing.created_at &&
          new Date(a.created_at) > new Date(existing.created_at))
      ) {
        pages.set(n, a);
      }
    }
    return map;
  }, [affidavits]);

  // Sort teams by canonical division order, then alpha by team_name.
  const teamsSorted = useMemo(() => {
    const order = new Map(DIVISIONS.map((d, i) => [d, i]));
    return [...teams].sort((a, b) => {
      const ai = order.get(a.division) ?? 99;
      const bi = order.get(b.division) ?? 99;
      if (ai !== bi) return ai - bi;
      return a.team_name.localeCompare(b.team_name);
    });
  }, [teams]);

  const overallReady = divisionData.reduce((s, d) => s + d.readyCount, 0);
  const overallTotal = divisionData.reduce((s, d) => s + d.totalPlayers, 0);
  const tournamentReadyDivisions = divisionData.filter(
    (d) => d.totalPlayers > 0 && d.readyCount === d.totalPlayers
  ).length;

  function toggleDivision(division: string) {
    setExpandedDivisions((prev) => {
      const next = new Set(prev);
      if (next.has(division)) next.delete(division);
      else next.add(division);
      return next;
    });
  }

  if (!supabase) {
    return (
      <div className="p-6 md:p-10">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
          <p className="font-display text-xl font-bold uppercase tracking-wide text-flag-blue mb-2">
            Connect Supabase to View Data
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 md:p-10">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-56" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10">
      {/* Header */}
      <div className="mb-6">
        <p className="font-display text-sm font-semibold text-flag-red uppercase tracking-[3px] mb-1">
          Admin
        </p>
        <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide flex items-center">
          Tournament Compliance
          <HelpTooltip
            text="Track compliance requirements across all teams and coaches."
            guideUrl="/admin/help"
          />
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Which divisions are tournament-ready. All players need contracts and
          birth certs AND all assigned coaches need both certifications.
        </p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 text-center">
          <p className="text-4xl font-bold font-display text-flag-blue">
            {overallTotal > 0
              ? Math.round((overallReady / overallTotal) * 100)
              : 0}
            %
          </p>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-1">
            Overall Readiness
          </p>
          <p className="text-xs text-gray-300 mt-0.5">
            {overallReady} of {overallTotal} players ready
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5 text-center">
          <p className="text-4xl font-bold font-display text-green-600">
            {tournamentReadyDivisions}
          </p>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-1">
            Divisions Ready
          </p>
          <p className="text-xs text-gray-300 mt-0.5">
            of {divisionData.length} with players
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5 text-center">
          <p className="text-4xl font-bold font-display text-amber-500">
            {overallTotal - overallReady}
          </p>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-1">
            Players Missing Items
          </p>
        </div>
      </div>

      {/* Division Breakdown */}
      {divisionData.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
          <p className="text-gray-400 text-sm">
            No selected players yet. Select players from the Tryouts page first.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {divisionData.map((div) => {
            const isReady =
              div.totalPlayers > 0 && div.readyCount === div.totalPlayers;
            const pct =
              div.totalPlayers > 0
                ? Math.round((div.readyCount / div.totalPlayers) * 100)
                : 0;
            const isExpanded = expandedDivisions.has(div.division);

            return (
              <div
                key={div.division}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden"
              >
                {/* Division header */}
                <button
                  onClick={() => toggleDivision(div.division)}
                  className="w-full flex items-center gap-3 p-4 md:p-5 text-left hover:bg-gray-50 transition-colors"
                >
                  {/* Ready icon */}
                  {isReady ? (
                    <ShieldCheck
                      size={22}
                      className="text-green-500 shrink-0"
                    />
                  ) : (
                    <Shield size={22} className="text-amber-400 shrink-0" />
                  )}

                  {/* Division info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-lg font-bold uppercase tracking-wide text-charcoal">
                        {div.division}
                      </span>
                      {div.totalPlayers > 0 ? (
                        isReady ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-green-100 text-green-700">
                            Tournament Ready
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-amber-100 text-amber-700">
                            {div.readyCount}/{div.totalPlayers} Ready
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-gray-100 text-gray-500">
                          No Players Yet
                        </span>
                      )}
                    </div>
                    {div.teams.length > 0 && (
                      <div className="text-xs text-gray-400 mt-0.5">
                        {div.teams.length} team{div.teams.length === 1 ? "" : "s"}
                      </div>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="hidden sm:block w-32 shrink-0">
                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          pct === 100
                            ? "bg-green-500"
                            : pct >= 50
                            ? "bg-amber-400"
                            : "bg-flag-red"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 text-right mt-0.5">
                      {pct}%
                    </p>
                  </div>

                  {isExpanded ? (
                    <ChevronUp size={16} className="text-gray-400 shrink-0" />
                  ) : (
                    <ChevronDown size={16} className="text-gray-400 shrink-0" />
                  )}
                </button>

                {/* Expanded per-team breakdown */}
                {isExpanded && (
                  <div className="border-t border-gray-100">
                    {div.teams.map((team) => (
                      <div
                        key={team.teamId ?? "unassigned"}
                        className="border-b border-gray-100 last:border-0"
                      >
                        {/* Team header */}
                        <div className="px-5 py-3 bg-gray-50 flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-gray-100">
                          <span className="text-sm font-bold text-charcoal">
                            {team.teamName}
                          </span>
                          {team.headCoachName && (
                            <span className="text-xs text-gray-500">
                              Coach: {team.headCoachName}
                              {team.coachCount > 1 && (
                                <span className="text-gray-400 ml-1">
                                  +{team.coachCount - 1} asst
                                </span>
                              )}
                            </span>
                          )}
                          <span className="text-xs text-gray-400">
                            {team.players.filter((p) => p.isReady).length}/
                            {team.players.length} ready
                          </span>
                        </div>

                        {/* Column headers */}
                        <div className="hidden sm:grid grid-cols-[1fr_80px_80px] gap-2 px-5 py-2 bg-white text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-50">
                          <span>Player</span>
                          <span className="text-center">Contract</span>
                          <span className="text-center">Birth Cert</span>
                        </div>

                        {team.players.length === 0 ? (
                          <div className="px-5 py-3 text-xs text-gray-400">
                            No players assigned to this team yet.
                          </div>
                        ) : (
                          team.players.map((player) => (
                            <div
                              key={player.id}
                              className={`grid grid-cols-1 sm:grid-cols-[1fr_80px_80px] gap-2 px-5 py-3 border-b border-gray-50 last:border-0 ${
                                player.isReady ? "" : "bg-red-50/30"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-2 h-2 rounded-full shrink-0 ${
                                    player.isReady ? "bg-green-500" : "bg-amber-400"
                                  }`}
                                />
                                <span className="text-sm font-semibold text-charcoal">
                                  {player.name}
                                </span>
                              </div>
                              <div className="flex sm:justify-center items-center gap-1">
                                <span className="sm:hidden text-[10px] text-gray-400 uppercase tracking-wide w-16">
                                  Contract
                                </span>
                                {player.hasContract ? (
                                  <CheckCircle2 size={16} className="text-green-500" />
                                ) : (
                                  <XCircle size={16} className="text-gray-300" />
                                )}
                              </div>
                              <div className="flex sm:justify-center items-center gap-1">
                                <span className="sm:hidden text-[10px] text-gray-400 uppercase tracking-wide w-16">
                                  Birth Cert
                                </span>
                                {player.hasBirthCert ? (
                                  <CheckCircle2 size={16} className="text-green-500" />
                                ) : (
                                  <XCircle size={16} className="text-gray-300" />
                                )}
                              </div>
                            </div>
                          ))
                        )}

                        {/* Per-team coach cert status (skip for Unassigned bucket) */}
                        {team.teamId && (
                          <div className="bg-flag-blue/5 px-5 py-3">
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                              Coach Certifications
                              {team.coachNames.length > 0 && (
                                <span className="normal-case font-normal">
                                  . {team.coachNames.join(", ")}
                                </span>
                              )}
                            </p>
                            <div className="flex flex-wrap gap-4">
                              <div className="flex items-center gap-1.5">
                                {team.hasConcussion ? (
                                  <CheckCircle2 size={16} className="text-green-500" />
                                ) : (
                                  <XCircle size={16} className="text-gray-300" />
                                )}
                                <span className="text-xs text-charcoal">Concussion Training</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {team.hasCardiac ? (
                                  <CheckCircle2 size={16} className="text-green-500" />
                                ) : (
                                  <XCircle size={16} className="text-gray-300" />
                                )}
                                <span className="text-xs text-charcoal">Sudden Cardiac Arrest</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Team Affidavits (uploaded final PDF per division) */}
      <div className="mt-10">
        <div className="mb-4">
          <h2 className="font-display text-2xl font-bold uppercase tracking-wide">
            Team Affidavits
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Signed final PONY affidavit PDFs uploaded by each team. Click View
            + Download to open in a new tab and save a copy for the coach
            binder.
          </p>
        </div>

        {teamsSorted.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
            <p className="text-gray-400 text-sm">No teams created yet.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="hidden sm:grid grid-cols-[180px_1fr_180px_160px] gap-2 px-5 py-3 bg-gray-50 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
              <span>Team</span>
              <span>File</span>
              <span>Uploaded</span>
              <span className="text-right">Action</span>
            </div>
            {teamsSorted.map((team) => {
              const aff = affidavitByTeam.get(team.id);
              const pages = affidavitPagesByTeam.get(team.id);
              const pageEntries = pages
                ? [1, 2, 3]
                    .map((n) => ({ n, doc: pages.get(n) }))
                    .filter((p) => p.doc)
                : [];
              return (
                <div
                  key={team.id}
                  className={`grid grid-cols-1 sm:grid-cols-[180px_1fr_180px_160px] gap-2 px-5 py-3 border-b border-gray-50 last:border-0 items-center ${
                    aff ? "" : "bg-red-50/30"
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold text-charcoal">
                      {team.team_name}
                    </p>
                    <p className="text-xs text-gray-400">{team.division}</p>
                  </div>
                  <div className="min-w-0">
                    {aff?.file_name ? (
                      <>
                        <p className="text-xs text-charcoal truncate">
                          {aff.file_name}
                        </p>
                        {pageEntries.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {pageEntries.map(({ n, doc }) => (
                              <button
                                key={n}
                                onClick={() =>
                                  doc?.file_path &&
                                  viewAndDownloadDoc(
                                    doc.file_path,
                                    doc.file_name ?? `affidavit-page-${n}.pdf`,
                                    "player-documents"
                                  )
                                }
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-flag-blue/10 text-flag-blue hover:bg-flag-blue/20 transition-colors"
                              >
                                <Printer size={10} />
                                Page {n}
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-amber-100 text-amber-700">
                        <XCircle size={12} />
                        Not Uploaded
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {aff?.created_at
                      ? new Date(aff.created_at).toLocaleDateString()
                      : "—"}
                  </div>
                  <div className="sm:text-right">
                    {aff?.file_path ? (
                      <button
                        onClick={() =>
                          viewAndDownloadDoc(
                            aff.file_path!,
                            aff.file_name ?? "",
                            "player-documents"
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[36px] rounded-full text-xs font-semibold bg-flag-blue text-white hover:bg-flag-blue/90 transition-colors"
                      >
                        <FileText size={12} />
                        View + Download
                      </button>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </div>
                </div>
              );
            })}
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-200">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {affidavitByTeam.size} of {teamsSorted.length} teams uploaded
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Coach Pre-Tournament Agreements */}
      <div className="mt-10">
        <div className="mb-4">
          <h2 className="font-display text-2xl font-bold uppercase tracking-wide">
            Pre-Tournament Coach Agreements
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Coaches must acknowledge they have read and understand the tournament rules for their division.
          </p>
        </div>

        {profiles.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
            <p className="text-gray-400 text-sm">No coaches registered yet.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="hidden sm:grid grid-cols-[1fr_150px_150px_180px] gap-2 px-5 py-3 bg-gray-50 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
              <span>Coach</span>
              <span>Division</span>
              <span>Status</span>
              <span>Signed</span>
            </div>

            {profiles.map((coach) => {
              const agreement = agreements.find((a) => a.coach_id === coach.id);
              const signed = agreement?.acknowledged;

              return (
                <div
                  key={coach.id}
                  className={`grid grid-cols-1 sm:grid-cols-[1fr_150px_150px_180px] gap-2 px-5 py-3 border-b border-gray-50 last:border-0 items-center ${
                    signed ? "" : "bg-red-50/30"
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold text-charcoal">{coach.full_name}</p>
                    <p className="text-xs text-gray-400">{coach.email}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-600">
                      {coachDivisionsById.get(coach.id)?.join(", ") || "—"}
                    </span>
                  </div>
                  <div>
                    {signed ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-green-100 text-green-700">
                        <CheckCircle2 size={12} />
                        Signed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-amber-100 text-amber-700">
                        <XCircle size={12} />
                        Not Signed
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {signed && agreement ? (
                      <>
                        <span>
                          {agreement.coach_name} — {new Date(agreement.acknowledged_at).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => setViewingAgreement({ coach, agreement })}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-flag-blue/10 text-flag-blue hover:bg-flag-blue/20 transition-colors"
                        >
                          <Eye size={10} />
                          View
                        </button>
                      </>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Summary */}
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {agreements.filter((a) => a.acknowledged).length} of {profiles.length} coaches signed
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Printable Agreement Modal */}
      {viewingAgreement && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 print:p-0 print:bg-white print:items-start">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto print:max-h-none print:overflow-visible print:rounded-none print:shadow-none">
            {/* Modal header — hidden on print */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 print:hidden">
              <h3 className="font-display text-lg font-bold uppercase tracking-wide text-charcoal">
                Tournament Rules Agreement
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide bg-flag-blue text-white hover:bg-flag-blue/90 transition-colors"
                >
                  <Printer size={12} />
                  Print
                </button>
                <button
                  onClick={() => setViewingAgreement(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Printable content */}
            <div className="px-6 py-8 print:px-12 print:py-8">
              {/* Header */}
              <div className="text-center mb-8">
                <p className="text-sm text-gray-500 uppercase tracking-widest mb-1">Irvine PONY Baseball</p>
                <h1 className="text-2xl font-bold uppercase tracking-wide text-flag-blue">
                  2026 All-Stars Pre-Tournament Rules
                </h1>
                <h2 className="text-lg font-semibold text-charcoal mt-1">
                  Coach Acknowledgment
                </h2>
              </div>

              {/* Coach Info */}
              <div className="border border-gray-200 rounded-2xl p-5 mb-6 print:border-gray-400">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-0.5">Coach Name</p>
                    <p className="font-semibold text-charcoal">{viewingAgreement.coach.full_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-0.5">Email</p>
                    <p className="text-charcoal">{viewingAgreement.coach.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-0.5">Division</p>
                    <p className="font-semibold text-charcoal">{coachDivisionsById.get(viewingAgreement.coach.id)?.join(", ") || viewingAgreement.agreement.division}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-0.5">Rules Category</p>
                    <p className="text-charcoal">{viewingAgreement.agreement.division}</p>
                  </div>
                </div>
              </div>

              {/* Agreement Text */}
              <div className="mb-6">
                <p className="text-sm text-gray-700 leading-relaxed">
                  I, <strong>{viewingAgreement.agreement.coach_name}</strong>, hereby acknowledge that I have read,
                  understand, and agree to abide by all tournament rules and regulations for the{" "}
                  <strong>{viewingAgreement.agreement.division}</strong> division of the 2026 Irvine PONY All-Stars season.
                </p>
                <p className="text-sm text-gray-700 leading-relaxed mt-3">
                  I understand that it is my responsibility as a coach to know and follow all applicable PONY Baseball rules,
                  including but not limited to pitch count regulations, substitution rules, bat requirements, and coaching conduct
                  standards. I acknowledge that local league rules and CIF rules do not apply to tournament play.
                </p>
              </div>

              {/* Signature Block */}
              <div className="border-t border-gray-300 pt-6 mt-8">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-2">Digital Signature</p>
                    <p className="text-xl font-serif italic text-charcoal border-b border-gray-300 pb-2">
                      {viewingAgreement.agreement.coach_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-2">Date Signed</p>
                    <p className="text-lg text-charcoal border-b border-gray-300 pb-2">
                      {new Date(viewingAgreement.agreement.acknowledged_at).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 mt-4 text-center">
                  This agreement was digitally signed via irvineallstars.com on{" "}
                  {new Date(viewingAgreement.agreement.acknowledged_at).toLocaleString()}.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

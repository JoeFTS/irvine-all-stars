"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
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
} from "lucide-react";

/* ---------- Types ---------- */

interface Registration {
  id: string;
  player_first_name: string;
  player_last_name: string;
  division: string;
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

interface DivisionCompliance {
  division: string;
  players: Array<{
    id: string;
    name: string;
    hasContract: boolean;
    hasBirthCert: boolean;
    hasPhoto: boolean;
    isReady: boolean;
  }>;
  totalPlayers: number;
  readyCount: number;
  contractCount: number;
  birthCertCount: number;
  photoCount: number;
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

    const [regsRes, docsRes, contractsRes, teamsRes, teamCoachesRes, certsRes, coachAppsRes, agreementsRes, profilesRes] = await Promise.all([
      supabase
        .from("tryout_registrations")
        .select("id, player_first_name, player_last_name, division, status")
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

  const divisionData: DivisionCompliance[] = useMemo(() => {
    return DIVISIONS.map((division) => {
      const divRegs = registrations.filter((r) => r.division === division);
      const players = divRegs.map((r) => {
        const docTypes = docsByReg.get(r.id) ?? new Set();
        const hasContract = contractSet.has(r.id);
        const hasBirthCert = docTypes.has("birth_certificate");
        const hasPhoto = docTypes.has("player_photo");
        return {
          id: r.id,
          name: `${r.player_first_name} ${r.player_last_name}`,
          hasContract,
          hasBirthCert,
          hasPhoto,
          isReady: hasContract && hasBirthCert && hasPhoto,
        };
      });

      return {
        division,
        players,
        totalPlayers: players.length,
        readyCount: players.filter((p) => p.isReady).length,
        contractCount: players.filter((p) => p.hasContract).length,
        birthCertCount: players.filter((p) => p.hasBirthCert).length,
        photoCount: players.filter((p) => p.hasPhoto).length,
      };
    }).filter((d) => d.totalPlayers > 0 || teams.some((t) => t.division === d.division));
  }, [registrations, docsByReg, contractSet, teams]);

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

  // Email → name lookup from coach applications
  const coachNameByEmail = useMemo(() => {
    const map = new Map<string, string>();
    for (const app of coachApps) {
      map.set(app.email.toLowerCase(), app.full_name);
    }
    return map;
  }, [coachApps]);

  // Coach cert status per division — built from team_coaches join table.
  // A team is "compliant" only if ALL assigned coaches have BOTH certs.
  // Pre-existing limitation: keying by division means only one team per
  // division is shown when multiple teams exist (e.g. 12U-Bronco Red + White).
  const coachCertsByDivision = useMemo(() => {
    const map = new Map<string, {
      teamName: string;
      coachNames: string[];
      headCoachName: string | null;
      coachIds: string[];
      hasConcussion: boolean;
      hasCardiac: boolean;
      coachCount: number;
    }>();

    for (const team of teams) {
      const assignments = teamCoaches.filter((tc) => tc.team_id === team.id);
      const coachIds = assignments.map((a) => a.coach_id);
      const headCoach = assignments.find((a) => a.role === "head");
      const headCoachName = headCoach
        ? (headCoach.full_name ?? headCoach.email)
        : null;
      const coachNames = assignments.map((a) => a.full_name ?? a.email);

      if (assignments.length === 0) {
        // Fallback to legacy teams.coach_id path so we don't blank out teams
        // that were created the old way and never migrated to team_coaches.
        const legacyName = team.coach_email
          ? (coachNameByEmail.get(team.coach_email.toLowerCase()) ?? team.coach_email)
          : null;
        map.set(team.division, {
          teamName: team.team_name,
          coachNames: legacyName ? [legacyName] : [],
          headCoachName: legacyName,
          coachIds: team.coach_id ? [team.coach_id] : [],
          hasConcussion: team.coach_id
            ? coachCerts.some((c) => c.coach_id === team.coach_id && c.cert_type === "concussion")
            : false,
          hasCardiac: team.coach_id
            ? coachCerts.some((c) => c.coach_id === team.coach_id && c.cert_type === "cardiac_arrest")
            : false,
          coachCount: team.coach_id ? 1 : 0,
        });
        continue;
      }

      // ALL coaches must have each cert for the team to be compliant
      const allHaveConcussion = coachIds.every((id) =>
        coachCerts.some((c) => c.coach_id === id && c.cert_type === "concussion")
      );
      const allHaveCardiac = coachIds.every((id) =>
        coachCerts.some((c) => c.coach_id === id && c.cert_type === "cardiac_arrest")
      );

      map.set(team.division, {
        teamName: team.team_name,
        coachNames,
        headCoachName,
        coachIds,
        hasConcussion: allHaveConcussion,
        hasCardiac: allHaveCardiac,
        coachCount: coachIds.length,
      });
    }
    return map;
  }, [teams, teamCoaches, coachCerts, coachNameByEmail]);

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
          Which divisions are tournament-ready. All players need contracts,
          birth certs, and photos AND all assigned coaches need both certifications.
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
                    {(() => {
                      const coachInfo = coachCertsByDivision.get(div.division);
                      if (!coachInfo) return null;
                      return (
                        <div className="flex flex-wrap gap-x-4 text-xs text-gray-400 mt-0.5">
                          <span>Team: {coachInfo.teamName}</span>
                          {coachInfo.headCoachName && (
                            <span>
                              Coach: {coachInfo.headCoachName}
                              {coachInfo.coachCount > 1 && (
                                <span className="text-gray-300 ml-1">
                                  +{coachInfo.coachCount - 1} asst
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      );
                    })()}
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

                {/* Expanded player list */}
                {isExpanded && (
                  <div className="border-t border-gray-100">
                    {/* Column headers */}
                    <div className="hidden sm:grid grid-cols-[1fr_80px_80px_80px] gap-2 px-5 py-2 bg-gray-50 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                      <span>Player</span>
                      <span className="text-center">Contract</span>
                      <span className="text-center">Birth Cert</span>
                      <span className="text-center">Photo</span>
                    </div>

                    {div.players.map((player) => (
                      <div
                        key={player.id}
                        className={`grid grid-cols-1 sm:grid-cols-[1fr_80px_80px_80px] gap-2 px-5 py-3 border-b border-gray-50 last:border-0 ${
                          player.isReady ? "" : "bg-red-50/30"
                        }`}
                      >
                        {/* Player name */}
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

                        {/* Status cells */}
                        <div className="flex sm:justify-center items-center gap-1">
                          <span className="sm:hidden text-[10px] text-gray-400 uppercase tracking-wide w-16">
                            Contract
                          </span>
                          {player.hasContract ? (
                            <CheckCircle2
                              size={16}
                              className="text-green-500"
                            />
                          ) : (
                            <XCircle size={16} className="text-gray-300" />
                          )}
                        </div>
                        <div className="flex sm:justify-center items-center gap-1">
                          <span className="sm:hidden text-[10px] text-gray-400 uppercase tracking-wide w-16">
                            Birth Cert
                          </span>
                          {player.hasBirthCert ? (
                            <CheckCircle2
                              size={16}
                              className="text-green-500"
                            />
                          ) : (
                            <XCircle size={16} className="text-gray-300" />
                          )}
                        </div>
                        <div className="flex sm:justify-center items-center gap-1">
                          <span className="sm:hidden text-[10px] text-gray-400 uppercase tracking-wide w-16">
                            Photo
                          </span>
                          {player.hasPhoto ? (
                            <CheckCircle2
                              size={16}
                              className="text-green-500"
                            />
                          ) : (
                            <XCircle size={16} className="text-gray-300" />
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Coach Certifications */}
                    {(() => {
                      const coachInfo = coachCertsByDivision.get(div.division);
                      if (!coachInfo) return null;
                      const coachLabel = coachInfo.coachNames.length > 0
                        ? coachInfo.coachNames.join(", ")
                        : null;
                      return (
                        <div className="border-t border-gray-200 bg-flag-blue/5 px-5 py-3">
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                            Coach Certifications {coachLabel && <span className="normal-case font-normal">. {coachLabel}</span>}
                          </p>
                          <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-1.5">
                              {coachInfo.hasConcussion ? (
                                <CheckCircle2 size={16} className="text-green-500" />
                              ) : (
                                <XCircle size={16} className="text-gray-300" />
                              )}
                              <span className="text-xs text-charcoal">Concussion Training</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {coachInfo.hasCardiac ? (
                                <CheckCircle2 size={16} className="text-green-500" />
                              ) : (
                                <XCircle size={16} className="text-gray-300" />
                              )}
                              <span className="text-xs text-charcoal">Sudden Cardiac Arrest</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

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

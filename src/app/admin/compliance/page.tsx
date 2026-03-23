"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import {
  ShieldCheck,
  Shield,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
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
  division: string;
  coach_id: string | null;
  coach_email: string | null;
}

interface CoachCert {
  coach_id: string;
  cert_type: string;
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
  const [coachCerts, setCoachCerts] = useState<CoachCert[]>([]);
  const [loading, setLoading] = useState(true);
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

    const [regsRes, docsRes, contractsRes, teamsRes, certsRes] = await Promise.all([
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
      supabase.from("teams").select("division, coach_id, coach_email"),
      supabase.from("coach_certifications").select("coach_id, cert_type"),
    ]);

    if (regsRes.data) setRegistrations(regsRes.data);
    if (docsRes.data) setDocuments(docsRes.data);
    if (contractsRes.data) setContracts(contractsRes.data);
    if (teamsRes.data) setTeams(teamsRes.data);
    if (certsRes.data) setCoachCerts(certsRes.data);
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
    }).filter((d) => d.totalPlayers > 0);
  }, [registrations, docsByReg, contractSet]);

  // Coach cert status per division
  const coachCertsByDivision = useMemo(() => {
    const map = new Map<string, { coachEmail: string | null; hasConcussion: boolean; hasCardiac: boolean }>();
    for (const team of teams) {
      if (!team.coach_id) {
        map.set(team.division, { coachEmail: team.coach_email, hasConcussion: false, hasCardiac: false });
        continue;
      }
      const certs = coachCerts.filter((c) => c.coach_id === team.coach_id);
      map.set(team.division, {
        coachEmail: team.coach_email,
        hasConcussion: certs.some((c) => c.cert_type === "concussion"),
        hasCardiac: certs.some((c) => c.cert_type === "cardiac_arrest"),
      });
    }
    return map;
  }, [teams, coachCerts]);

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
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
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
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg" />
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
        <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide">
          Tournament Compliance
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Which divisions are tournament-ready — all players have contracts,
          birth certs, and photos.
        </p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-5 text-center">
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
        <div className="bg-white border border-gray-200 rounded-lg p-5 text-center">
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
        <div className="bg-white border border-gray-200 rounded-lg p-5 text-center">
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
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
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
                className="bg-white border border-gray-200 rounded-lg overflow-hidden"
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
                      {isReady ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-green-100 text-green-700">
                          Tournament Ready
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-amber-100 text-amber-700">
                          {div.readyCount}/{div.totalPlayers} Ready
                        </span>
                      )}
                    </div>
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
                      return (
                        <div className="border-t border-gray-200 bg-flag-blue/5 px-5 py-3">
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                            Coach Certifications {coachInfo.coachEmail && <span className="normal-case font-normal">— {coachInfo.coachEmail}</span>}
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
    </div>
  );
}

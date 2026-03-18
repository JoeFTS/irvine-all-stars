"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Trash2, Shield, ShieldCheck } from "lucide-react";

interface Team {
  id: string;
  division: string;
  team_name: string;
  coach_id: string | null;
  coach_email: string | null;
  season: number;
  created_at: string;
}

interface Registration {
  id: string;
  division: string;
  player_first_name: string;
  player_last_name: string;
}

interface Document {
  registration_id: string;
  document_type: string;
}

interface Contract {
  registration_id: string;
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
];

interface ComplianceStats {
  totalPlayers: number;
  birthCert: number;
  contractSigned: number;
  photoUploaded: number;
  readyPercent: number;
}

function computeCompliance(
  division: string,
  regs: Registration[],
  docs: Document[],
  contracts: Contract[]
): ComplianceStats {
  const divRegs = regs.filter((r) => r.division === division);
  const totalPlayers = divRegs.length;
  if (totalPlayers === 0) {
    return { totalPlayers: 0, birthCert: 0, contractSigned: 0, photoUploaded: 0, readyPercent: 0 };
  }

  const regIds = new Set(divRegs.map((r) => r.id));

  const birthCert = docs.filter(
    (d) => regIds.has(d.registration_id) && d.document_type === "birth_certificate"
  ).length;
  const photoUploaded = docs.filter(
    (d) => regIds.has(d.registration_id) && d.document_type === "player_photo"
  ).length;
  const contractSigned = contracts.filter((c) => regIds.has(c.registration_id)).length;

  // Ready = has all 3 docs
  const regDocsMap = new Map<string, Set<string>>();
  for (const d of docs) {
    if (!regIds.has(d.registration_id)) continue;
    if (!regDocsMap.has(d.registration_id)) regDocsMap.set(d.registration_id, new Set());
    regDocsMap.get(d.registration_id)!.add(d.document_type);
  }
  const contractSet = new Set(contracts.filter((c) => regIds.has(c.registration_id)).map((c) => c.registration_id));

  let readyCount = 0;
  for (const reg of divRegs) {
    const docSet = regDocsMap.get(reg.id);
    const hasBirth = docSet?.has("birth_certificate") ?? false;
    const hasPhoto = docSet?.has("player_photo") ?? false;
    const hasContract = contractSet.has(reg.id);
    if (hasBirth && hasPhoto && hasContract) readyCount++;
  }

  return {
    totalPlayers,
    birthCert,
    contractSigned,
    photoUploaded,
    readyPercent: Math.round((readyCount / totalPlayers) * 100),
  };
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [divisionFilter, setDivisionFilter] = useState<string>("all");

  // Create form state
  const [formDivision, setFormDivision] = useState(DIVISIONS[0]);
  const [formTeamName, setFormTeamName] = useState("");
  const [formCoachEmail, setFormCoachEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    fetchAll();
  }, []);

  async function fetchAll() {
    if (!supabase) return;
    setLoading(true);

    const [teamsRes, regsRes, docsRes, contractsRes] = await Promise.all([
      supabase.from("teams").select("*").order("division"),
      supabase
        .from("tryout_registrations")
        .select("id, division, player_first_name, player_last_name"),
      supabase.from("player_documents").select("registration_id, document_type"),
      supabase.from("player_contracts").select("registration_id"),
    ]);

    if (teamsRes.data) setTeams(teamsRes.data);
    if (regsRes.data) setRegistrations(regsRes.data);
    if (docsRes.data) setDocuments(docsRes.data);
    if (contractsRes.data) setContracts(contractsRes.data);

    setLoading(false);
  }

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setCreating(true);
    setCreateError(null);

    const teamData: {
      division: string;
      team_name: string;
      season: number;
      coach_email: string | null;
      coach_id: string | null;
    } = {
      division: formDivision,
      team_name: formTeamName.trim(),
      season: 2026,
      coach_email: formCoachEmail.trim() || null,
      coach_id: null,
    };

    // Try to look up coach by email in profiles
    if (formCoachEmail.trim()) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", formCoachEmail.trim())
        .single();
      if (profile) {
        teamData.coach_id = profile.id;
      }
    }

    const { error } = await supabase.from("teams").insert(teamData);

    if (error) {
      setCreateError(error.message);
    } else {
      setFormTeamName("");
      setFormCoachEmail("");
      await fetchAll();
    }
    setCreating(false);
  }

  async function handleDelete(id: string) {
    if (!supabase) return;
    const { error } = await supabase.from("teams").delete().eq("id", id);
    if (!error) {
      setTeams((prev) => prev.filter((t) => t.id !== id));
    }
    setDeletingId(null);
  }

  const filtered = teams.filter((t) => {
    if (divisionFilter !== "all" && t.division !== divisionFilter) return false;
    return true;
  });

  if (!supabase) {
    return (
      <div className="p-6 md:p-10">
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="font-display text-xl font-bold uppercase tracking-wide text-flag-blue mb-2">
            Connect Supabase to View Data
          </p>
          <p className="text-gray-600 text-sm">
            Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in
            your environment.
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
          <div className="h-10 bg-gray-200 rounded w-72" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-lg" />
          ))}
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
          Team Management
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          {teams.length} team{teams.length !== 1 ? "s" : ""} across {new Set(teams.map((t) => t.division)).size} division{new Set(teams.map((t) => t.division)).size !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Create Team Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
          Create New Team
        </h2>
        <form onSubmit={handleCreateTeam} className="flex flex-col sm:flex-row flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Division
            </label>
            <select
              value={formDivision}
              onChange={(e) => setFormDivision(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-flag-blue/30"
            >
              {DIVISIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Team Name
            </label>
            <input
              type="text"
              value={formTeamName}
              onChange={(e) => setFormTeamName(e.target.value)}
              placeholder="e.g. 11U-White"
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-charcoal placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-flag-blue/30"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Coach Email
            </label>
            <input
              type="email"
              value={formCoachEmail}
              onChange={(e) => setFormCoachEmail(e.target.value)}
              placeholder="coach@example.com"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-charcoal placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-flag-blue/30"
            />
          </div>
          <button
            type="submit"
            disabled={creating || !formTeamName.trim()}
            className="inline-flex items-center gap-2 bg-flag-blue text-white px-5 py-2 rounded-lg text-sm font-semibold uppercase tracking-wide hover:bg-flag-blue/90 transition-colors disabled:opacity-50"
          >
            <Plus size={16} />
            {creating ? "Creating..." : "Create Team"}
          </button>
        </form>
        {createError && (
          <p className="mt-2 text-flag-red text-xs font-semibold">{createError}</p>
        )}
      </div>

      {/* Division Filter */}
      <div className="mb-6">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-2">
          Division:
        </span>
        <div className="inline-flex flex-wrap gap-1.5">
          <button
            onClick={() => setDivisionFilter("all")}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide transition-colors ${
              divisionFilter === "all"
                ? "bg-flag-blue text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          {DIVISIONS.map((div) => (
            <button
              key={div}
              onClick={() => setDivisionFilter(div)}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide transition-colors ${
                divisionFilter === div
                  ? "bg-flag-blue text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {div.split("-")[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-gray-400 mb-3">
        Showing {filtered.length} of {teams.length}
      </p>

      {/* Teams List */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-400 text-sm">
            No teams found. Create one above to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((team) => {
            const compliance = computeCompliance(
              team.division,
              registrations,
              documents,
              contracts
            );
            const isReady = compliance.totalPlayers > 0 && compliance.readyPercent === 100;

            return (
              <div
                key={team.id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden"
              >
                {/* Team Header */}
                <div className="p-4 md:p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-display text-lg font-bold uppercase tracking-wide text-charcoal">
                          {team.team_name}
                        </h3>
                        <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-flag-blue/10 text-flag-blue">
                          {team.division}
                        </span>
                        {isReady ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-green-100 text-green-700">
                            <ShieldCheck size={12} />
                            Tournament Ready
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-flag-red/10 text-flag-red">
                            <Shield size={12} />
                            Not Ready
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                        <span>Season: {team.season}</span>
                        {team.coach_email && <span>Coach: {team.coach_email}</span>}
                        {!team.coach_email && team.coach_id && (
                          <span>Coach ID: {team.coach_id.slice(0, 8)}...</span>
                        )}
                        {!team.coach_email && !team.coach_id && (
                          <span className="text-star-gold">No coach assigned</span>
                        )}
                      </div>
                    </div>

                    {/* Delete Button */}
                    <div className="shrink-0">
                      {deletingId === team.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-flag-red font-semibold">Delete?</span>
                          <button
                            onClick={() => handleDelete(team.id)}
                            className="px-2.5 py-1 rounded text-xs font-semibold uppercase bg-flag-red text-white hover:bg-flag-red/90 transition-colors"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="px-2.5 py-1 rounded text-xs font-semibold uppercase bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeletingId(team.id)}
                          className="p-2 rounded-lg text-gray-300 hover:text-flag-red hover:bg-flag-red/5 transition-colors"
                          title="Delete team"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Compliance Section */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h4 className="font-display text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                      Division Compliance ({team.division})
                    </h4>

                    {compliance.totalPlayers === 0 ? (
                      <p className="text-xs text-gray-300">
                        No registered players in this division yet.
                      </p>
                    ) : (
                      <>
                        {/* Progress Bar */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-charcoal">
                              Overall Readiness
                            </span>
                            <span className="text-xs font-bold text-charcoal">
                              {compliance.readyPercent}%
                            </span>
                          </div>
                          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                compliance.readyPercent === 100
                                  ? "bg-green-500"
                                  : compliance.readyPercent >= 50
                                  ? "bg-star-gold"
                                  : "bg-flag-red"
                              }`}
                              style={{ width: `${compliance.readyPercent}%` }}
                            />
                          </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="text-center p-2 bg-gray-50 rounded-lg">
                            <p className="text-lg font-bold text-charcoal">
                              {compliance.totalPlayers}
                            </p>
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                              Registered
                            </p>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded-lg">
                            <p className="text-lg font-bold text-charcoal">
                              {compliance.birthCert}
                              <span className="text-xs text-gray-400 font-normal">
                                /{compliance.totalPlayers}
                              </span>
                            </p>
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                              Birth Cert
                            </p>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded-lg">
                            <p className="text-lg font-bold text-charcoal">
                              {compliance.contractSigned}
                              <span className="text-xs text-gray-400 font-normal">
                                /{compliance.totalPlayers}
                              </span>
                            </p>
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                              Contract
                            </p>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded-lg">
                            <p className="text-lg font-bold text-charcoal">
                              {compliance.photoUploaded}
                              <span className="text-xs text-gray-400 font-normal">
                                /{compliance.totalPlayers}
                              </span>
                            </p>
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                              Photo
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

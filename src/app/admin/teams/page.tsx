"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Plus, Trash2, Shield, ShieldCheck, FileText, Pencil, Check, X, Users } from "lucide-react";
import { HelpTooltip } from "@/components/help-tooltip";

interface Team {
  id: string;
  division: string;
  team_name: string;
  coach_id: string | null;
  coach_email: string | null;
  season: number;
  created_at: string;
}

interface CoachApplication {
  id: string;
  full_name: string;
  email: string;
  division_preference: string;
  status: string;
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
  "13U-Pony",
  "14U-Pony",
];

interface ComplianceStats {
  totalPlayers: number;
  birthCert: number;
  contractSigned: number;
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
    return { totalPlayers: 0, birthCert: 0, contractSigned: 0, readyPercent: 0 };
  }

  const regIds = new Set(divRegs.map((r) => r.id));

  const birthCert = docs.filter(
    (d) => regIds.has(d.registration_id) && d.document_type === "birth_certificate"
  ).length;
  const contractSigned = contracts.filter((c) => regIds.has(c.registration_id)).length;

  // Ready = has birth cert + signed contract
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
    const hasContract = contractSet.has(reg.id);
    if (hasBirth && hasContract) readyCount++;
  }

  return {
    totalPlayers,
    birthCert,
    contractSigned,
    readyPercent: Math.round((readyCount / totalPlayers) * 100),
  };
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [allCoachApps, setAllCoachApps] = useState<CoachApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [divisionFilter, setDivisionFilter] = useState<string>("all");

  // Create form state
  const [formDivision, setFormDivision] = useState(DIVISIONS[0]);
  const [formTeamName, setFormTeamName] = useState("");
  const [formCoachEmail, setFormCoachEmail] = useState("");
  const [formCoachSource, setFormCoachSource] = useState<"dropdown" | "manual">("dropdown");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Inline team name editing
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editingTeamName, setEditingTeamName] = useState("");

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

    const [teamsRes, regsRes, docsRes, contractsRes, coachAppsRes] = await Promise.all([
      supabase.from("teams").select("*").order("division"),
      supabase
        .from("tryout_registrations")
        .select("id, division, player_first_name, player_last_name"),
      supabase.from("player_documents").select("registration_id, document_type"),
      supabase.from("player_contracts").select("registration_id"),
      supabase
        .from("coach_applications")
        .select("id, full_name, email, division_preference, status")
        .order("full_name"),
    ]);

    if (teamsRes.data) setTeams(teamsRes.data);
    if (regsRes.data) setRegistrations(regsRes.data);
    if (docsRes.data) setDocuments(docsRes.data);
    if (contractsRes.data) setContracts(contractsRes.data);
    if (coachAppsRes.data) setAllCoachApps(coachAppsRes.data);

    setLoading(false);
  }

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setCreating(true);
    setCreateError(null);

    const coachEmail = formCoachSource === "dropdown"
      ? allCoachApps.find((c) => c.id === formCoachEmail)?.email ?? null
      : formCoachEmail.trim() || null;

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
      coach_email: coachEmail,
      coach_id: null,
    };

    // Try to look up coach by email in profiles
    if (coachEmail) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", coachEmail)
        .single();
      if (profile) {
        teamData.coach_id = profile.id;
      }
    }

    const { data: createdTeam, error } = await supabase
      .from("teams")
      .insert(teamData)
      .select("id")
      .single();

    if (error) {
      setCreateError(error.message);
    } else {
      // Mirror the assignment into team_coaches so coach sees the team via
      // the team-scoped RLS path. If this fails, surface the error but don't
      // undo the team creation (admin can fix via the roster manager).
      if (createdTeam?.id && teamData.coach_id) {
        const { error: tcErr } = await supabase.from("team_coaches").insert({
          team_id: createdTeam.id,
          coach_id: teamData.coach_id,
          role: "head",
        });
        if (tcErr) {
          setCreateError(
            `Team created, but failed to add coach to team_coaches: ${tcErr.message}. You can re-add via Manage Roster.`
          );
        }
      }
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

  async function handleRenameTeam(id: string) {
    if (!supabase || !editingTeamName.trim()) return;
    const { error } = await supabase
      .from("teams")
      .update({ team_name: editingTeamName.trim() })
      .eq("id", id);
    if (!error) {
      setTeams((prev) =>
        prev.map((t) => (t.id === id ? { ...t, team_name: editingTeamName.trim() } : t))
      );
    }
    setEditingTeamId(null);
  }

  const filtered = teams.filter((t) => {
    if (divisionFilter !== "all" && t.division !== divisionFilter) return false;
    return true;
  });

  if (!supabase) {
    return (
      <div className="p-6 md:p-10">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
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
            <div key={i} className="h-20 bg-gray-200 rounded-2xl" />
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
        <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide flex items-center">
          Team Management
          <HelpTooltip
            text="Assign selected players to their teams after tryouts."
            guideUrl="/admin/help"
          />
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          {teams.length} team{teams.length !== 1 ? "s" : ""} across {new Set(teams.map((t) => t.division)).size} division{new Set(teams.map((t) => t.division)).size !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Create Team Form */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
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
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-flag-blue/30"
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
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-charcoal placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-flag-blue/30"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Coach
              </label>
              <button
                type="button"
                onClick={() => {
                  setFormCoachSource((s) => s === "dropdown" ? "manual" : "dropdown");
                  setFormCoachEmail("");
                }}
                className="text-[10px] text-flag-blue hover:underline"
              >
                {formCoachSource === "dropdown" ? "Enter email manually" : "Select from list"}
              </button>
            </div>
            {formCoachSource === "dropdown" ? (
              <select
                value={formCoachEmail}
                onChange={(e) => {
                  const coachId = e.target.value;
                  setFormCoachEmail(coachId);
                  const coach = allCoachApps.find((c) => c.id === coachId);
                  if (coach?.division_preference) {
                    setFormDivision(coach.division_preference);
                  }
                }}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-flag-blue/30"
              >
                <option value="">Select accepted coach...</option>
                {allCoachApps.filter((c) => c.status === "accepted").map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} — {c.email} ({c.division_preference})
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="email"
                value={formCoachEmail}
                onChange={(e) => setFormCoachEmail(e.target.value)}
                placeholder="coach@example.com"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-charcoal placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-flag-blue/30"
              />
            )}
          </div>
          <button
            type="submit"
            disabled={creating || !formTeamName.trim()}
            className="inline-flex items-center gap-2 bg-flag-blue text-white px-5 py-2 rounded-full text-sm font-semibold uppercase tracking-wide hover:bg-flag-blue/90 transition-colors disabled:opacity-50"
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
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
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
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden"
              >
                {/* Team Header */}
                <div className="p-4 md:p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        {editingTeamId === team.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={editingTeamName}
                              onChange={(e) => setEditingTeamName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleRenameTeam(team.id);
                                if (e.key === "Escape") setEditingTeamId(null);
                              }}
                              autoFocus
                              className="font-display text-lg font-bold uppercase tracking-wide text-charcoal border border-flag-blue/30 rounded-xl px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-flag-blue/30"
                            />
                            <button
                              onClick={() => handleRenameTeam(team.id)}
                              className="p-1 rounded-full text-green-600 hover:bg-green-50 transition-colors"
                              title="Save"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={() => setEditingTeamId(null)}
                              className="p-1 rounded-full text-gray-400 hover:bg-gray-100 transition-colors"
                              title="Cancel"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <h3 className="font-display text-lg font-bold uppercase tracking-wide text-charcoal">
                            {team.team_name}
                          </h3>
                        )}
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
                        {team.coach_email && (
                          <span>Coach: {allCoachApps.find((c) => c.email.toLowerCase() === team.coach_email!.toLowerCase())?.full_name ?? team.coach_email}</span>
                        )}
                        {!team.coach_email && team.coach_id && (
                          <span>Coach ID: {team.coach_id.slice(0, 8)}...</span>
                        )}
                        {!team.coach_email && !team.coach_id && (
                          <span className="text-star-gold">No coach assigned</span>
                        )}
                      </div>
                    </div>

                    {/* Edit / Delete Buttons */}
                    <div className="shrink-0 flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingTeamId(team.id);
                          setEditingTeamName(team.team_name);
                        }}
                        className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-gray-300 hover:text-flag-blue hover:bg-flag-blue/5 transition-colors"
                        title="Rename team"
                      >
                        <Pencil size={16} />
                      </button>
                      {deletingId === team.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-flag-red font-semibold">Delete?</span>
                          <button
                            onClick={() => handleDelete(team.id)}
                            className="px-2.5 py-1 rounded-full text-xs font-semibold uppercase bg-flag-red text-white hover:bg-flag-red/90 transition-colors"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="px-2.5 py-1 rounded-full text-xs font-semibold uppercase bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeletingId(team.id)}
                          className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-gray-300 hover:text-flag-red hover:bg-flag-red/5 transition-colors"
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
                          <div className="text-center p-2 bg-gray-50 rounded-2xl">
                            <p className="text-lg font-bold text-charcoal">
                              {compliance.totalPlayers}
                            </p>
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                              Registered
                            </p>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded-2xl">
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
                          <div className="text-center p-2 bg-gray-50 rounded-2xl">
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
                        </div>

                        {/* Action Links */}
                        <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-2">
                          <Link
                            href={`/admin/teams/${team.id}/roster`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide bg-flag-blue text-white hover:bg-flag-blue/90 transition-colors"
                          >
                            <Users size={14} />
                            Manage Roster
                          </Link>
                          {compliance.contractSigned > 0 && (
                            <Link
                              href={`/admin/compliance?division=${encodeURIComponent(team.division)}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide bg-flag-blue/10 text-flag-blue hover:bg-flag-blue/20 transition-colors"
                            >
                              <FileText size={14} />
                              View Contracts ({compliance.contractSigned})
                            </Link>
                          )}
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

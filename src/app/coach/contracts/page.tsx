"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { HelpTooltip } from "@/components/help-tooltip";
import { useCoachTeams, type CoachTeam as MyTeam } from "@/hooks/use-coach-teams";
import {
  FileText,
  ExternalLink,
  Calendar,
  Palmtree,
  Search,
  Users,
} from "lucide-react";

interface Contract {
  id: string;
  registration_id: string;
  player_name: string;
  division: string;
  parent_name: string;
  parent_email: string;
  planned_vacations: string | null;
  signed_at: string;
}

const POOL_TAB = "__pool__";
const ALL_TAB = "__all__";

const DIVISIONS = [
  "All",
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
] as const;

const DIVISION_LABELS: Record<string, string> = {
  All: "All",
  "5U-Shetland": "5U",
  "6U-Shetland": "6U",
  "7U MP-Pinto": "7U MP",
  "7U KP-Pinto": "7U KP",
  "8U MP-Pinto": "8U MP",
  "8U KP-Pinto": "8U KP",
  "9U-Mustang": "9U",
  "10U-Mustang": "10U",
  "11U-Bronco": "11U",
  "12U-Bronco": "12U",
  "13U-Pony": "13U",
  "14U-Pony": "14U",
};

export default function CoachContractsPage() {
  const { user, role, loading: authLoading } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [accessibleRegIds, setAccessibleRegIds] = useState<Set<string>>(
    new Set()
  );
  const [regTeamMap, setRegTeamMap] = useState<Map<string, string | null>>(
    new Map()
  );
  const [loading, setLoading] = useState(true);
  // For admin: divisionFilter ("All" or specific division). For coach: tab id (team id, POOL_TAB, or ALL_TAB).
  const [divisionFilter, setDivisionFilter] = useState<string>("All");
  const [teamFilter, setTeamFilter] = useState<string>(ALL_TAB);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isAdmin = role === "admin";

  // Admins skip the team_coaches fetch and use the all-divisions filter UI.
  // Even if an admin is also assigned to specific teams via team_coaches
  // (e.g., league president coaching their kid's team), they get the admin
  // view here. To see their own coach view, they should switch to a non-admin
  // account or open /coach/roster directly which uses the same skip.
  const {
    teams: fetchedTeams,
    loaded: teamsLoaded,
    error: teamsError,
  } = useCoachTeams(isAdmin ? undefined : user?.id);
  const myTeams: MyTeam[] = useMemo(
    () => (isAdmin ? [] : fetchedTeams),
    [isAdmin, fetchedTeams]
  );

  // Surface team-fetch errors through the page's error banner.
  useEffect(() => {
    if (teamsError) setError(teamsError);
  }, [teamsError]);

  useEffect(() => {
    if (authLoading || !user || !supabase) return;
    if (!teamsLoaded) return;
    fetchAll(myTeams);
  }, [user, authLoading, teamsLoaded, myTeams, isAdmin]);

  async function fetchAll(teams: MyTeam[]) {
    if (!supabase) return;
    setLoading(true);

    // Check URL for division override (admin linking from teams page).
    const params = new URLSearchParams(window.location.search);
    const divParam = params.get("division");

    if (isAdmin) {
      // Admin: fetch all (or override by ?division=)
      let query = supabase
        .from("player_contracts")
        .select(
          "id, registration_id, player_name, division, parent_name, parent_email, planned_vacations, signed_at"
        )
        .order("signed_at", { ascending: false });

      // Validate ?division= against the DIVISIONS allowlist. Unknown values
      // are silently ignored so the page falls back to the "All" view rather
      // than running an unfilterable query.
      if (divParam && (DIVISIONS as readonly string[]).includes(divParam)) {
        query = query.eq("division", divParam);
        setDivisionFilter(divParam);
      }

      const { data, error: err } = await query;
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
      setContracts((data as Contract[]) || []);
      // Admin path doesn't use accessibleRegIds — skip building it.
      setAccessibleRegIds(new Set());
      setRegTeamMap(new Map());
      setLoading(false);
      return;
    }

    // Coach path: parallel queries for accessible registrations + contracts.
    const teamIds = teams.map((t) => t.id);
    const myDivisions = [...new Set(teams.map((t) => t.division))];

    const [draftedRes, undraftedRes, contractsRes] = await Promise.all([
      teamIds.length > 0
        ? supabase
            .from("tryout_registrations")
            .select("id, team_id")
            .in("team_id", teamIds)
        : Promise.resolve({
            data: [] as { id: string; team_id: string | null }[],
            error: null,
          }),
      myDivisions.length > 0
        ? supabase
            .from("tryout_registrations")
            .select("id, team_id")
            .is("team_id", null)
            .in("division", myDivisions)
        : Promise.resolve({
            data: [] as { id: string; team_id: string | null }[],
            error: null,
          }),
      supabase
        .from("player_contracts")
        .select(
          "id, registration_id, player_name, division, parent_name, parent_email, planned_vacations, signed_at"
        )
        .order("signed_at", { ascending: false }),
    ]);

    const fetchErr =
      draftedRes.error || undraftedRes.error || contractsRes.error;
    if (fetchErr) {
      setError(fetchErr.message ?? "Failed to load contracts");
      setLoading(false);
      return;
    }

    const draftedRegs = (draftedRes.data ?? []) as {
      id: string;
      team_id: string | null;
    }[];
    const undraftedRegs = (undraftedRes.data ?? []) as {
      id: string;
      team_id: string | null;
    }[];
    const allContracts = (contractsRes.data ?? []) as Contract[];

    const accessibleSet = new Set<string>();
    const teamMap = new Map<string, string | null>();
    for (const r of draftedRegs) {
      accessibleSet.add(r.id);
      teamMap.set(r.id, r.team_id);
    }
    for (const r of undraftedRegs) {
      accessibleSet.add(r.id);
      teamMap.set(r.id, r.team_id);
    }

    setAccessibleRegIds(accessibleSet);
    setRegTeamMap(teamMap);
    setContracts(allContracts.filter((c) => accessibleSet.has(c.registration_id)));
    setLoading(false);
  }

  const filtered = contracts.filter((c) => {
    // Search filter (applies to both admin and coach paths)
    const matchesSearch =
      !search ||
      c.player_name.toLowerCase().includes(search.toLowerCase()) ||
      c.parent_name.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (isAdmin) {
      const matchesDivision =
        divisionFilter === "All" || c.division === divisionFilter;
      return matchesDivision;
    }

    // Coach: filter by selected team tab
    if (teamFilter === ALL_TAB) return true;
    const teamId = regTeamMap.get(c.registration_id) ?? null;
    if (teamFilter === POOL_TAB) return teamId === null;
    return teamId === teamFilter;
  });

  if (loading || authLoading) {
    return (
      <div className="p-6 md:p-8">
        <p className="text-gray-400 text-sm">Loading contracts...</p>
      </div>
    );
  }

  // Coach with no team assignments
  if (!isAdmin && myTeams.length === 0) {
    return (
      <div className="p-6 md:p-8 max-w-5xl">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-charcoal flex items-center">
            Player Contracts
            <HelpTooltip
              text="Track which players have signed their participation contracts."
              guideUrl="/coach/help"
            />
          </h1>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
          <Users size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="font-display text-lg font-bold uppercase tracking-wide text-charcoal mb-2">
            No Team Assigned Yet
          </p>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            You haven&apos;t been assigned to a team yet. Contact your league
            admin to get connected to your roster.
          </p>
          {error && (
            <p className="text-xs text-flag-red mt-4">Error: {error}</p>
          )}
        </div>
      </div>
    );
  }

  // Subtitle text
  let subtitle = "All signed player contracts across divisions";
  if (!isAdmin) {
    if (myTeams.length === 1) {
      subtitle = `Signed contracts for ${myTeams[0].team_name}`;
    } else {
      subtitle = `Signed contracts for your ${myTeams.length} teams`;
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-charcoal flex items-center">
          Player Contracts
          <HelpTooltip
            text="Track which players have signed their participation contracts."
            guideUrl="/coach/help"
          />
        </h1>
        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
      </div>

      {/* Admin: division filter pills */}
      {isAdmin && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {DIVISIONS.map((div) => (
            <button
              key={div}
              onClick={() => setDivisionFilter(div)}
              className={`px-3 py-2 min-h-[44px] rounded-full text-xs font-semibold uppercase tracking-wide transition-colors ${
                divisionFilter === div
                  ? "bg-flag-blue text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {DIVISION_LABELS[div] || div}
            </button>
          ))}
        </div>
      )}

      {/* Coach: team filter tabs (only if more than one team or there's a pool) */}
      {!isAdmin && myTeams.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          <button
            onClick={() => setTeamFilter(ALL_TAB)}
            className={`px-3 py-2 min-h-[44px] rounded-full text-xs font-semibold uppercase tracking-wide transition-colors ${
              teamFilter === ALL_TAB
                ? "bg-flag-blue text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          {myTeams.map((team) => (
            <button
              key={team.id}
              onClick={() => setTeamFilter(team.id)}
              className={`px-3 py-2 min-h-[44px] rounded-full text-xs font-semibold uppercase tracking-wide transition-colors ${
                teamFilter === team.id
                  ? "bg-flag-blue text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {team.team_name}
            </button>
          ))}
          <button
            onClick={() => setTeamFilter(POOL_TAB)}
            className={`px-3 py-2 min-h-[44px] rounded-full text-xs font-semibold uppercase tracking-wide transition-colors ${
              teamFilter === POOL_TAB
                ? "bg-flag-blue text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            Pool
          </button>
        </div>
      )}

      {/* Search */}
      <div className="mb-6 relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by player or parent name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-flag-blue/20 focus:border-flag-blue"
        />
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-flag-red">
          {error}
        </div>
      )}

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <FileText size={40} className="mx-auto text-gray-200 mb-3" />
          <p className="font-display text-sm font-semibold uppercase tracking-wider text-gray-400">
            No contracts found
          </p>
          <p className="text-xs text-gray-300 mt-1">
            {contracts.length === 0
              ? "No players have signed contracts yet."
              : "Try adjusting your search or filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
            {filtered.length} contract{filtered.length !== 1 ? "s" : ""} signed
          </p>

          {filtered.map((contract) => {
            const signedDate = new Date(contract.signed_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <div
                key={contract.id}
                className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-wrap items-center gap-3 sm:gap-4"
              >
                {/* Player Info */}
                <div className="flex-1 min-w-[200px]">
                  <h3 className="font-display text-sm font-bold uppercase tracking-wide text-charcoal">
                    {contract.player_name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-flag-blue/10 text-flag-blue">
                      {contract.division}
                    </span>
                    <span className="text-xs text-gray-400">
                      Parent: {contract.parent_name}
                    </span>
                  </div>
                </div>

                {/* Vacations indicator */}
                {contract.planned_vacations && (
                  <div className="flex items-center gap-1 text-xs text-star-gold" title={contract.planned_vacations}>
                    <Palmtree size={14} />
                    <span className="hidden sm:inline">Vacations noted</span>
                  </div>
                )}

                {/* Signed date */}
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Calendar size={14} />
                  <span>{signedDate}</span>
                </div>

                {/* View button */}
                <a
                  href={`/contract-view?id=${contract.registration_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] bg-flag-blue text-white rounded-full text-xs font-semibold uppercase tracking-wide hover:bg-flag-blue/90 transition-colors"
                >
                  <ExternalLink size={14} />
                  View
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

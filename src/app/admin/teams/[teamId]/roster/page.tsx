"use client";

import { useCallback, useEffect, useMemo, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Plus, Minus, Search, Users, UserPlus, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { HelpTooltip } from "@/components/help-tooltip";

interface Player {
  id: string;
  player_first_name: string;
  player_last_name: string;
  jersey_number: string | null;
  primary_position: string;
  parent_name: string;
  status: string;
}

interface Team {
  id: string;
  team_name: string;
  division: string;
  coach_id: string | null;
}

interface CoachAssignment {
  coach_id: string;
  role: string;
  profile: { full_name: string | null; email: string };
}

interface CoachApplication {
  id: string;
  full_name: string;
  email: string;
  division_preference: string;
  status: string;
}

type CoachRole = "head" | "assistant";

const PLAYER_COLS =
  "id, player_first_name, player_last_name, jersey_number, primary_position, parent_name, status";

export default function TeamRosterPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = use(params);

  const [team, setTeam] = useState<Team | null>(null);
  const [coaches, setCoaches] = useState<CoachAssignment[]>([]);
  const [acceptedCoachApps, setAcceptedCoachApps] = useState<CoachApplication[]>([]);
  const [roster, setRoster] = useState<Player[]>([]);
  const [pool, setPool] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  // Add-coach form state
  const [selectedCoachAppId, setSelectedCoachAppId] = useState("");
  const [selectedRole, setSelectedRole] = useState<CoachRole>("assistant");
  const [removingCoachId, setRemovingCoachId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    setError(null);

    const { data: teamRow, error: teamErr } = await supabase
      .from("teams")
      .select("id, team_name, division, coach_id")
      .eq("id", teamId)
      .single();

    if (teamErr || !teamRow) {
      setError(teamErr?.message ?? "Team not found");
      setLoading(false);
      return;
    }
    setTeam(teamRow);

    const [rosterRes, poolRes, coachesRes, coachAppsRes, profilesRes] = await Promise.all([
      supabase
        .from("tryout_registrations")
        .select(PLAYER_COLS)
        .eq("team_id", teamRow.id)
        .in("status", ["selected", "alternate"])
        .order("player_last_name"),
      supabase
        .from("tryout_registrations")
        .select(PLAYER_COLS)
        .is("team_id", null)
        .eq("division", teamRow.division)
        .in("status", ["selected", "alternate"])
        .order("player_last_name"),
      supabase
        .from("team_coaches")
        .select("coach_id, role, profile:profiles!team_coaches_coach_id_fkey(full_name, email)")
        .eq("team_id", teamRow.id),
      supabase
        .from("coach_applications")
        .select("id, full_name, email, division_preference, status")
        .eq("status", "accepted")
        .order("full_name"),
      supabase.from("profiles").select("email"),
    ]);

    if (rosterRes.data) setRoster(rosterRes.data as Player[]);
    if (poolRes.data) setPool(poolRes.data as Player[]);
    if (coachAppsRes.data) {
      // Only surface coach applications whose email matches an existing profile.
      // Coaches without a profile yet are intentionally hidden; admins invite
      // them from the invites page. This keeps the picker honest (no rows
      // that would fail insertion).
      const profileEmails = new Set(
        ((profilesRes.data ?? []) as Array<{ email: string | null }>)
          .map((p) => (p.email ?? "").toLowerCase())
          .filter((e) => e.length > 0)
      );
      const apps = (coachAppsRes.data as CoachApplication[]).filter((a) =>
        profileEmails.has(a.email.toLowerCase())
      );
      setAcceptedCoachApps(apps);
    }
    if (coachesRes.data) {
      // Supabase typed join may return profile as array; normalize to single object.
      const normalized: CoachAssignment[] = (coachesRes.data as unknown as Array<{
        coach_id: string;
        role: string;
        profile: { full_name: string | null; email: string } | { full_name: string | null; email: string }[] | null;
      }>).map((c) => ({
        coach_id: c.coach_id,
        role: c.role,
        profile: Array.isArray(c.profile)
          ? c.profile[0] ?? { full_name: null, email: "" }
          : c.profile ?? { full_name: null, email: "" },
      }));
      setCoaches(normalized);
    }

    setLoading(false);
  }, [teamId]);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    fetchAll();
  }, [teamId, fetchAll]);

  async function moveToTeam(player: Player) {
    if (!supabase || !team) return;
    if (pendingIds.has(player.id)) return;
    setPendingIds((prev) => {
      const next = new Set(prev);
      next.add(player.id);
      return next;
    });
    // Optimistic move
    setPool((prev) => prev.filter((p) => p.id !== player.id));
    setRoster((prev) =>
      [...prev, player].sort((a, b) =>
        a.player_last_name.localeCompare(b.player_last_name)
      )
    );

    const { error: upErr } = await supabase
      .from("tryout_registrations")
      .update({ team_id: team.id })
      .eq("id", player.id);

    if (upErr) {
      setError(upErr.message);
      await fetchAll();
    }
    setPendingIds((prev) => {
      const next = new Set(prev);
      next.delete(player.id);
      return next;
    });
  }

  async function removeFromTeam(player: Player) {
    if (!supabase || !team) return;
    if (pendingIds.has(player.id)) return;
    setPendingIds((prev) => {
      const next = new Set(prev);
      next.add(player.id);
      return next;
    });
    // Optimistic move
    setRoster((prev) => prev.filter((p) => p.id !== player.id));
    setPool((prev) =>
      [...prev, player].sort((a, b) =>
        a.player_last_name.localeCompare(b.player_last_name)
      )
    );

    const { error: upErr } = await supabase
      .from("tryout_registrations")
      .update({ team_id: null })
      .eq("id", player.id);

    if (upErr) {
      setError(upErr.message);
      await fetchAll();
    }
    setPendingIds((prev) => {
      const next = new Set(prev);
      next.delete(player.id);
      return next;
    });
  }

  async function addCoach() {
    if (!supabase || !team || busy || !selectedCoachAppId) return;
    setBusy(true);

    const app = acceptedCoachApps.find((a) => a.id === selectedCoachAppId);
    if (!app) {
      setBusy(false);
      return;
    }

    // Look up profile by email (case-insensitive). The picker is already
    // filtered to apps whose email maps to a profile (see fetchAll), so the
    // lookup is expected to succeed; treat a miss as an error.
    const { data: profile, error: profErr } = await supabase
      .from("profiles")
      .select("id")
      .ilike("email", app.email)
      .maybeSingle();

    if (profErr) {
      setError(profErr.message);
      setBusy(false);
      return;
    }

    if (!profile) {
      setError(
        `Could not find a profile for ${app.email}. Refresh and try again.`
      );
      setBusy(false);
      return;
    }

    // Optimistic insert
    const newAssignment: CoachAssignment = {
      coach_id: profile.id,
      role: selectedRole,
      profile: { full_name: app.full_name, email: app.email },
    };
    const roleToInsert = selectedRole;
    setCoaches((prev) => [...prev, newAssignment]);
    setSelectedCoachAppId("");
    setSelectedRole("assistant");

    const { error: insErr } = await supabase.from("team_coaches").insert({
      team_id: team.id,
      coach_id: profile.id,
      role: roleToInsert,
    });

    if (insErr) {
      setError(insErr.message);
      await fetchAll();
    }
    setBusy(false);
  }

  async function removeCoach(coachId: string) {
    if (!supabase || !team || busy) return;
    setBusy(true);

    // Optimistic remove
    setCoaches((prev) => prev.filter((c) => c.coach_id !== coachId));
    setRemovingCoachId(null);

    const { error: delErr } = await supabase
      .from("team_coaches")
      .delete()
      .eq("team_id", team.id)
      .eq("coach_id", coachId);

    if (delErr) {
      setError(delErr.message);
      await fetchAll();
    }
    setBusy(false);
  }

  // Filter out coach apps whose underlying profile is already assigned.
  // We can't know the profile id at filter time without an extra fetch, so we
  // filter by email match against current assignments (case-insensitive).
  const assignedEmails = useMemo(
    () => new Set(coaches.map((c) => c.profile.email.toLowerCase())),
    [coaches]
  );
  const availableCoachApps = useMemo(
    () =>
      acceptedCoachApps.filter(
        (a) => !assignedEmails.has(a.email.toLowerCase())
      ),
    [acceptedCoachApps, assignedEmails]
  );

  const q = search.trim().toLowerCase();
  const filteredRoster = useMemo(
    () =>
      q
        ? roster.filter((p) =>
            `${p.player_first_name} ${p.player_last_name} ${p.parent_name}`
              .toLowerCase()
              .includes(q)
          )
        : roster,
    [roster, q]
  );
  const filteredPool = useMemo(
    () =>
      q
        ? pool.filter((p) =>
            `${p.player_first_name} ${p.player_last_name} ${p.parent_name}`
              .toLowerCase()
              .includes(q)
          )
        : pool,
    [pool, q]
  );

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
          <div className="h-4 bg-gray-200 rounded w-40" />
          <div className="h-8 bg-gray-200 rounded w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-72 bg-gray-200 rounded-2xl" />
            <div className="h-72 bg-gray-200 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error && !team) {
    return (
      <div className="p-6 md:p-10">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
          <p className="font-display text-lg font-bold text-flag-red uppercase tracking-wide mb-2">
            Error
          </p>
          <p className="text-gray-600 text-sm mb-4">{error}</p>
          <Link
            href="/admin/teams"
            className="inline-flex items-center gap-1.5 text-flag-blue text-sm font-semibold hover:underline"
          >
            <ArrowLeft size={14} /> Back to Teams
          </Link>
        </div>
      </div>
    );
  }

  if (!team) return null;

  return (
    <div className="p-6 md:p-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
        <Link
          href="/admin/teams"
          className="inline-flex items-center gap-1 hover:text-flag-blue transition-colors"
        >
          <ArrowLeft size={12} />
          Teams
        </Link>
        <ChevronRight size={12} />
        <span className="text-charcoal">{team.team_name}</span>
        <ChevronRight size={12} />
        <span>Roster</span>
      </nav>

      {/* Header */}
      <div className="mb-6">
        <p className="font-display text-sm font-semibold text-flag-red uppercase tracking-[3px] mb-1">
          Admin
        </p>
        <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide flex items-center text-charcoal">
          {team.team_name}
          <HelpTooltip
            text="Move players between this team's roster and the undrafted pool for this division. Changes save instantly."
            guideUrl="/admin/help"
          />
        </h1>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-flag-blue/10 text-flag-blue">
            {team.division}
          </span>
        </div>
      </div>

      {/* Coaches section */}
      <section className="bg-white border border-gray-200 rounded-2xl p-4 md:p-5 mb-5">
        <header className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <UserPlus size={16} className="text-flag-blue" />
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-gray-400">
              Coaches
            </h2>
          </div>
          <span className="text-xs font-bold text-charcoal">
            {coaches.length}
          </span>
        </header>

        {coaches.length === 0 ? (
          <p className="text-xs text-star-gold font-semibold mb-3">
            No coaches assigned to this team yet.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100 mb-4">
            {coaches.map((c) => (
              <li
                key={c.coach_id}
                className="py-2.5 flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-sm text-charcoal truncate">
                      {c.profile.full_name ?? c.profile.email}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                        c.role === "head"
                          ? "bg-flag-blue/10 text-flag-blue"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {c.role === "head" ? "Head" : "Asst"}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5 truncate">
                    {c.profile.email}
                  </div>
                </div>
                {removingCoachId === c.coach_id ? (
                  <div className="shrink-0 flex items-center gap-2">
                    <span className="text-xs text-flag-red font-semibold">
                      Remove?
                    </span>
                    <button
                      onClick={() => removeCoach(c.coach_id)}
                      disabled={busy}
                      className="px-2.5 py-1 rounded-full text-xs font-semibold uppercase bg-flag-red text-white hover:bg-flag-red/90 transition-colors disabled:opacity-50"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setRemovingCoachId(null)}
                      disabled={busy}
                      className="px-2.5 py-1 rounded-full text-xs font-semibold uppercase bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setRemovingCoachId(c.coach_id);
                    }}
                    disabled={busy}
                    className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide bg-flag-red/10 text-flag-red hover:bg-flag-red/20 transition-colors disabled:opacity-50"
                    title="Remove coach"
                  >
                    <X size={12} />
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Add coach form */}
        <div className="border-t border-gray-100 pt-3">
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Coach
              </label>
              <select
                value={selectedCoachAppId}
                onChange={(e) => {
                  setSelectedCoachAppId(e.target.value);
                }}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-flag-blue/30"
              >
                <option value="">
                  {availableCoachApps.length === 0
                    ? "No more accepted coaches available"
                    : "Select accepted coach..."}
                </option>
                {availableCoachApps.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} — {c.email} ({c.division_preference})
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-[140px]">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as CoachRole)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-flag-blue/30"
              >
                <option value="head">Head</option>
                <option value="assistant">Assistant</option>
              </select>
            </div>
            <button
              onClick={addCoach}
              disabled={busy || !selectedCoachAppId}
              className="inline-flex items-center gap-2 bg-flag-blue text-white px-5 py-2 rounded-full text-sm font-semibold uppercase tracking-wide hover:bg-flag-blue/90 transition-colors disabled:opacity-50"
            >
              <Plus size={16} />
              {busy ? "Adding..." : "Add Coach"}
            </button>
          </div>
        </div>
      </section>

      {/* Search */}
      <div className="mb-5">
        <div className="relative max-w-sm">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by player or parent name..."
            className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm text-charcoal placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-flag-blue/30"
          />
        </div>
      </div>

      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="mb-4 bg-flag-red/5 border border-flag-red/20 text-flag-red text-xs font-semibold px-3 py-2 rounded-xl"
        >
          {error}
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Roster column */}
        <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <header className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-flag-blue" />
              <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-gray-400">
                Roster
              </h2>
            </div>
            <span className="text-xs font-bold text-charcoal">
              {filteredRoster.length}
              {q && (
                <span className="text-gray-400 font-normal"> of {roster.length}</span>
              )}
            </span>
          </header>

          {filteredRoster.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400">
              {roster.length === 0
                ? "No players assigned to this team yet."
                : "No players match your search."}
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filteredRoster.map((p) => (
                <PlayerRow
                  key={p.id}
                  player={p}
                  busy={pendingIds.has(p.id)}
                  actionLabel="Remove"
                  actionIcon={<Minus size={12} />}
                  actionStyle="bg-flag-red/10 text-flag-red hover:bg-flag-red/20"
                  onAction={() => removeFromTeam(p)}
                />
              ))}
            </ul>
          )}
        </section>

        {/* Available Pool column */}
        <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <header className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-gray-400" />
              <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-gray-400">
                Available Pool
                <span className="ml-2 text-[10px] font-normal text-gray-300 normal-case tracking-normal">
                  (undrafted in {team.division})
                </span>
              </h2>
            </div>
            <span className="text-xs font-bold text-charcoal">
              {filteredPool.length}
              {q && (
                <span className="text-gray-400 font-normal"> of {pool.length}</span>
              )}
            </span>
          </header>

          {filteredPool.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400">
              {pool.length === 0
                ? "No undrafted players in this division."
                : "No players match your search."}
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filteredPool.map((p) => (
                <PlayerRow
                  key={p.id}
                  player={p}
                  busy={pendingIds.has(p.id)}
                  actionLabel="Add"
                  actionIcon={<Plus size={12} />}
                  actionStyle="bg-flag-blue text-white hover:bg-flag-blue/90"
                  onAction={() => moveToTeam(p)}
                />
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function PlayerRow({
  player,
  busy,
  actionLabel,
  actionIcon,
  actionStyle,
  onAction,
}: {
  player: Player;
  busy: boolean;
  actionLabel: string;
  actionIcon: React.ReactNode;
  actionStyle: string;
  onAction: () => void;
}) {
  return (
    <li className="p-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-sm text-charcoal truncate">
            {player.player_first_name} {player.player_last_name}
          </span>
          {player.jersey_number && (
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
              #{player.jersey_number}
            </span>
          )}
          {player.status === "alternate" && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-star-gold/15 text-star-gold">
              Alt
            </span>
          )}
        </div>
        <div className="text-[11px] text-gray-400 mt-0.5 truncate">
          {player.primary_position} &middot; Parent: {player.parent_name}
        </div>
      </div>
      <button
        onClick={onAction}
        disabled={busy}
        className={`shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide transition-colors disabled:opacity-50 ${actionStyle}`}
      >
        {actionIcon}
        {busy ? "..." : actionLabel}
      </button>
    </li>
  );
}

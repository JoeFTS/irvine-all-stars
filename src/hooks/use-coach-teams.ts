"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface CoachTeam {
  id: string;
  division: string;
  team_name: string;
  role: string; // 'head' | 'assistant'
}

export interface UseCoachTeamsResult {
  teams: CoachTeam[];
  loaded: boolean;
  error: string | null;
}

/**
 * Fetches teams the current user is assigned to via team_coaches.
 * Returns sorted (head first, then alpha by team_name).
 * `loaded` lets callers distinguish "haven't fetched yet" from "fetched, found zero."
 */
export function useCoachTeams(userId: string | undefined): UseCoachTeamsResult {
  const [teams, setTeams] = useState<CoachTeam[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase || !userId) {
      setLoaded(true);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error: fetchErr } = await supabase
        .from("team_coaches")
        .select("role, teams!team_coaches_team_id_fkey ( id, division, team_name )")
        .eq("coach_id", userId);
      if (cancelled) return;
      if (fetchErr) {
        setError(fetchErr.message);
        setLoaded(true);
        return;
      }
      type TeamRow = { id: string; division: string; team_name: string };
      type Row = {
        role: string;
        teams: TeamRow | TeamRow[] | null;
      };
      const rows = (data ?? []) as Row[];
      const normalized: CoachTeam[] = rows.flatMap((row) => {
        // Supabase typings for joined tables can be array-wrapped in some paths.
        const t = Array.isArray(row.teams) ? row.teams[0] : row.teams;
        if (!t) return [];
        return [
          {
            id: t.id,
            division: t.division,
            team_name: t.team_name,
            role: row.role,
          },
        ];
      });
      // Head first, then alpha
      normalized.sort((a, b) => {
        if (a.role !== b.role) return a.role === "head" ? -1 : 1;
        return a.team_name.localeCompare(b.team_name);
      });
      // Stabilize array identity: only update state when contents actually changed.
      // Teams are tiny (<10 entries) so JSON.stringify deep-equality is fine and
      // prevents re-fetch storms in consumers that put `teams` in effect deps.
      setTeams((prev) =>
        JSON.stringify(prev) === JSON.stringify(normalized) ? prev : normalized
      );
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { teams, loaded, error };
}

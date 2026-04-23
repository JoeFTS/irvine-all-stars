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
      const normalized: CoachTeam[] = (data ?? []).flatMap(
        (row: { role: string; teams: unknown }) => {
          const t = Array.isArray(row.teams) ? row.teams[0] : row.teams;
          if (!t || typeof t !== "object") return [];
          const team = t as { id: string; division: string; team_name: string };
          return [
            {
              id: team.id,
              division: team.division,
              team_name: team.team_name,
              role: row.role,
            },
          ];
        }
      );
      // Head first, then alpha
      normalized.sort((a, b) => {
        if (a.role !== b.role) return a.role === "head" ? -1 : 1;
        return a.team_name.localeCompare(b.team_name);
      });
      setTeams(normalized);
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { teams, loaded, error };
}

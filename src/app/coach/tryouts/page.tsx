"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { HelpTooltip } from "@/components/help-tooltip";
import {
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  Send,
  AlertTriangle,
  User,
  Mail,
  X,
} from "lucide-react";

/* ---------- Types ---------- */

type Status =
  | "registered"
  | "invited"
  | "confirmed"
  | "tryout_complete"
  | "selected"
  | "not_selected"
  | "alternate"
  | "withdrawn";

interface Registration {
  id: string;
  player_first_name: string;
  player_last_name: string;
  player_date_of_birth: string;
  division: string;
  primary_position: string;
  secondary_position: string | null;
  bats: string;
  throws: string;
  current_team: string | null;
  jersey_number: string | null;
  status: Status;
  parent_name: string;
  parent_email: string;
}

interface EvaluatorScore {
  id: string;
  player_name: string;
  division: string;
  evaluator_name: string;
  hitting: number;
  fielding: number;
  throwing: number;
  running: number;
  effort: number;
  attitude: number;
  notes: string | null;
}

interface CoachSelection {
  id: string;
  registration_id: string;
  coach_id: string;
  division: string;
  notes: string | null;
  selected_at: string;
}

/* ---------- Constants ---------- */

const STATUS_OPTIONS: { value: Status; label: string; color: string }[] = [
  { value: "registered", label: "Registered", color: "bg-gray-100 text-gray-600" },
  { value: "invited", label: "Invited", color: "bg-blue-50 text-blue-600" },
  { value: "confirmed", label: "Confirmed", color: "bg-green-100 text-green-700" },
  { value: "tryout_complete", label: "Tryout Complete", color: "bg-blue-100 text-blue-700" },
  { value: "selected", label: "Selected", color: "bg-green-100 text-green-800 font-bold" },
  { value: "not_selected", label: "Not Selected", color: "bg-gray-100 text-gray-500" },
  { value: "alternate", label: "Alternate", color: "bg-orange-100 text-orange-700" },
  { value: "withdrawn", label: "Withdrawn", color: "bg-flag-red/10 text-flag-red" },
];

const SCORE_CATEGORIES = [
  { key: "hitting", label: "Hitting" },
  { key: "fielding", label: "Fielding" },
  { key: "throwing", label: "Throwing" },
  { key: "running", label: "Running / Speed" },
  { key: "effort", label: "Effort" },
  { key: "attitude", label: "Attitude" },
] as const;

/* ---------- Helpers ---------- */

function calcAge(dob: string): number {
  return Math.floor(
    (Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );
}

function StatusBadge({ status }: { status: Status }) {
  const opt = STATUS_OPTIONS.find((s) => s.value === status) ?? STATUS_OPTIONS[0];
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${opt.color}`}
    >
      {opt.label}
    </span>
  );
}

function ScoreBar({ value, max = 9 }: { value: number; max?: number }) {
  const pct = Math.min((value / max) * 100, 100);
  const color =
    pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-star-gold" : pct >= 40 ? "bg-orange-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-charcoal w-6 text-right">{value}</span>
    </div>
  );
}

function computeTotal(s: EvaluatorScore): number {
  return (s.hitting || 0) + (s.fielding || 0) + (s.throwing || 0) + (s.running || 0) + (s.effort || 0) + (s.attitude || 0);
}

/* ---------- Main averages for a player ---------- */

interface PlayerWithScores {
  registration: Registration;
  scores: EvaluatorScore[];
  avgTotal: number;
  avgCategories: Record<string, number>;
}

function computePlayerData(
  registrations: Registration[],
  scores: EvaluatorScore[]
): PlayerWithScores[] {
  const scoresByPlayer = new Map<string, EvaluatorScore[]>();
  for (const s of scores) {
    const key = s.player_name.toLowerCase().trim();
    if (!scoresByPlayer.has(key)) scoresByPlayer.set(key, []);
    scoresByPlayer.get(key)!.push(s);
  }

  return registrations.map((r) => {
    const fullName = `${r.player_first_name} ${r.player_last_name}`.toLowerCase().trim();
    const playerScores = scoresByPlayer.get(fullName) ?? [];

    let avgTotal = 0;
    const avgCategories: Record<string, number> = {};

    if (playerScores.length > 0) {
      avgTotal =
        playerScores.reduce((sum, s) => sum + computeTotal(s), 0) / playerScores.length;
      for (const cat of SCORE_CATEGORIES) {
        avgCategories[cat.key] =
          playerScores.reduce((sum, s) => sum + s[cat.key], 0) / playerScores.length;
      }
    }

    return { registration: r, scores: playerScores, avgTotal, avgCategories };
  });
}

/* ---------- Component ---------- */

export default function CoachTryoutsPage() {
  const { user } = useAuth();

  const [division, setDivision] = useState<string | null>(null);
  const [coachName, setCoachName] = useState<string | null>(null);
  const [divisionLoading, setDivisionLoading] = useState(true);

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [scores, setScores] = useState<EvaluatorScore[]>([]);
  const [selections, setSelections] = useState<CoachSelection[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [localSelected, setLocalSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<string | null>(null);

  // Fetch coach's division
  useEffect(() => {
    if (!supabase || !user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("division, full_name")
        .eq("id", user.id)
        .single();
      setDivision(data?.division ?? null);
      setCoachName(data?.full_name ?? null);
      setDivisionLoading(false);
    })();
  }, [user]);

  // Fetch data once division is known
  const fetchData = useCallback(async () => {
    if (!supabase || !user || !division) return;
    setDataLoading(true);

    const [regRes, scoresRes, selRes] = await Promise.all([
      supabase
        .from("tryout_registrations")
        .select(
          "id, player_first_name, player_last_name, player_date_of_birth, division, primary_position, secondary_position, bats, throws, current_team, jersey_number, status, parent_name, parent_email"
        )
        .eq("division", division),
      supabase
        .from("evaluator_scores")
        .select(
          "id, player_name, division, evaluator_name, hitting, fielding, throwing, running, effort, attitude, notes"
        )
        .eq("division", division),
      supabase
        .from("coach_selections")
        .select("id, registration_id, coach_id, division, notes, selected_at")
        .eq("coach_id", user.id)
        .eq("division", division),
    ]);

    if (regRes.data) setRegistrations(regRes.data);
    if (scoresRes.data) setScores(scoresRes.data);
    if (selRes.data) {
      setSelections(selRes.data);
      setLocalSelected(new Set(selRes.data.map((s) => s.registration_id)));
    }
    setDataLoading(false);
  }, [user, division]);

  useEffect(() => {
    if (division) fetchData();
  }, [division, fetchData]);

  // Derived data
  const players = computePlayerData(registrations, scores).sort(
    (a, b) => b.avgTotal - a.avgTotal
  );

  const selectedCount = localSelected.size;

  // Selection handlers
  function toggleSelect(regId: string) {
    setLocalSelected((prev) => {
      const next = new Set(prev);
      if (next.has(regId)) next.delete(regId);
      else next.add(regId);
      return next;
    });
    setSubmitMsg(null);
  }

  async function removeRecommendation(regId: string) {
    if (!supabase) return;
    const sel = selections.find((s) => s.registration_id === regId);
    if (!sel) return;

    const { error } = await supabase
      .from("coach_selections")
      .delete()
      .eq("id", sel.id);

    if (!error) {
      setLocalSelected((prev) => {
        const next = new Set(prev);
        next.delete(regId);
        return next;
      });
      setSelections((prev) => prev.filter((s) => s.id !== sel.id));
      setSubmitMsg("Recommendation removed.");
    }
  }

  async function submitRecommendations() {
    if (!supabase || !user || !division) return;
    setSubmitting(true);
    setSubmitMsg(null);

    try {
      // Determine adds and removes
      const existingIds = new Set(selections.map((s) => s.registration_id));
      const toAdd = [...localSelected].filter((id) => !existingIds.has(id));
      const toRemove = selections.filter((s) => !localSelected.has(s.registration_id));

      // Insert new selections
      if (toAdd.length > 0) {
        const rows = toAdd.map((registration_id) => ({
          registration_id,
          coach_id: user.id,
          division,
        }));
        const { error } = await supabase.from("coach_selections").insert(rows);
        if (error) throw error;
      }

      // Remove deselected
      for (const sel of toRemove) {
        const { error } = await supabase.from("coach_selections").delete().eq("id", sel.id);
        if (error) throw error;
      }

      // Refresh
      await fetchData();

      // Send notification email to coordinator with full pick list
      const pickedPlayers = registrations
        .filter((r) => localSelected.has(r.id))
        .map((r) => ({
          name: `${r.player_first_name} ${r.player_last_name}`,
          position: r.primary_position,
          parentName: r.parent_name,
          parentEmail: r.parent_email,
        }));

      if (pickedPlayers.length > 0) {
        fetch("/api/send-coach-picks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            coachName: coachName || "Unknown Coach",
            division,
            players: pickedPlayers,
          }),
        }).catch(() => {}); // Non-blocking — don't fail the save if email fails
      }

      setSubmitMsg("Recommendations saved successfully.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save recommendations";
      setSubmitMsg(`Error: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  }

  // Has unsaved changes?
  const existingIds = new Set(selections.map((s) => s.registration_id));
  const hasChanges =
    localSelected.size !== existingIds.size ||
    [...localSelected].some((id) => !existingIds.has(id));

  /* ---------- Render ---------- */

  if (divisionLoading) {
    return (
      <div className="p-6 md:p-10">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!division) {
    return (
      <div className="p-6 md:p-10">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center max-w-md mx-auto">
          <AlertTriangle size={40} className="mx-auto text-star-gold mb-4" />
          <h2 className="font-display text-xl font-bold uppercase tracking-wide text-flag-blue mb-2">
            Division Not Assigned
          </h2>
          <p className="text-gray-600">
            Division not yet assigned. Contact the coordinator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-6">
      {/* Header */}
      <div>
        <p className="font-display text-sm font-semibold text-flag-red uppercase tracking-[3px] mb-1">
          Coach
        </p>
        <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide text-flag-blue flex items-center">
          Tryout Players
          <HelpTooltip
            text="Scout players and submit nominations for your division."
            guideUrl="/coach/help"
          />
        </h1>
      </div>

      {/* Summary Banner */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-wrap items-center gap-x-8 gap-y-3">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Division</p>
          <p className="font-display text-lg font-bold text-flag-blue">{division}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Total Players
          </p>
          <p className="font-display text-lg font-bold text-charcoal">{registrations.length}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Your Selections
          </p>
          <p className="font-display text-lg font-bold text-star-gold">
            {selectedCount} of {registrations.length}
          </p>
        </div>
        <div className="flex-1" />
        <button
          onClick={submitRecommendations}
          disabled={submitting || !hasChanges}
          className="flex items-center gap-2 px-5 py-2.5 bg-flag-blue text-white font-semibold rounded-full hover:bg-flag-blue/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send size={16} />
          {submitting ? "Saving..." : "Submit Recommendations"}
        </button>
      </div>

      {/* Submit feedback */}
      {submitMsg && (
        <div
          className={`px-4 py-3 rounded-2xl text-sm font-medium ${
            submitMsg.startsWith("Error")
              ? "bg-red-50 text-red-700"
              : "bg-green-50 text-green-700"
          }`}
        >
          {submitMsg}
        </div>
      )}

      {/* Info note */}
      {selections.length > 0 && !hasChanges && (
        <p className="text-sm text-gray-500 italic">
          Your recommendations have been submitted to the coordinator for review.
        </p>
      )}

      {/* Player List */}
      {dataLoading ? (
        <p className="text-gray-500">Loading players...</p>
      ) : players.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
          <p className="text-gray-500">No players registered for this division yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {players.map((p, idx) => {
            const r = p.registration;
            const isExpanded = expandedId === r.id;
            const isSelected = localSelected.has(r.id);

            return (
              <div
                key={r.id}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden"
              >
                {/* Row */}
                <div className="flex items-center gap-3 px-4 py-3">
                  {/* Select checkbox */}
                  <button
                    onClick={() => toggleSelect(r.id)}
                    className="shrink-0 text-flag-blue hover:text-star-gold transition-colors"
                    title={isSelected ? "Deselect" : "Select"}
                  >
                    {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                  </button>

                  {/* Rank */}
                  <span className="shrink-0 w-8 text-center font-display text-sm font-bold text-gray-400">
                    #{idx + 1}
                  </span>

                  {/* Name + positions */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-charcoal truncate">
                      {r.player_first_name} {r.player_last_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {r.primary_position}
                      {r.secondary_position ? ` / ${r.secondary_position}` : ""} &middot;{" "}
                      {r.bats}/{r.throws} &middot; Age {calcAge(r.player_date_of_birth)}
                      {r.current_team ? ` · ${r.current_team}` : ""}
                    </p>
                  </div>

                  {/* Status */}
                  <StatusBadge status={r.status} />

                  {/* Recommended badge with remove */}
                  {selections.some((s) => s.registration_id === r.id) && (
                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-star-gold/20 text-star-gold">
                      Recommended
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeRecommendation(r.id);
                        }}
                        className="hover:text-flag-red transition-colors"
                        title="Remove recommendation"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  )}

                  {/* Score */}
                  <div className="shrink-0 text-right w-16">
                    {p.scores.length > 0 ? (
                      <p className="font-display text-lg font-bold text-flag-blue">
                        {computeTotal(p.scores[0])}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400">No score</p>
                    )}
                  </div>

                  {/* Expand */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : r.id)}
                    className="shrink-0 p-1 text-gray-400 hover:text-charcoal transition-colors"
                  >
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-4 py-4 space-y-5 bg-gray-50/50">
                    {/* Personal info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                          Date of Birth
                        </p>
                        <p className="text-charcoal">
                          {new Date(r.player_date_of_birth + "T00:00:00").toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric", year: "numeric" }
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                          Age
                        </p>
                        <p className="text-charcoal">{calcAge(r.player_date_of_birth)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                          Positions
                        </p>
                        <p className="text-charcoal">
                          {r.primary_position}
                          {r.secondary_position ? ` / ${r.secondary_position}` : ""}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                          Bats / Throws
                        </p>
                        <p className="text-charcoal">
                          {r.bats} / {r.throws}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                          Current Team
                        </p>
                        <p className="text-charcoal">{r.current_team || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                          Jersey #
                        </p>
                        <p className="text-charcoal">{r.jersey_number || "—"}</p>
                      </div>
                    </div>

                    {/* Parent info */}
                    <div className="flex flex-wrap gap-6 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <User size={14} className="text-gray-400" />
                        <span>{r.parent_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail size={14} className="text-gray-400" />
                        <a href={`mailto:${r.parent_email}`} className="text-flag-blue hover:underline">
                          {r.parent_email}
                        </a>
                      </div>
                    </div>

                    {/* Score breakdown — single evaluator */}
                    {p.scores.length > 0 ? (
                      <div className="space-y-4">
                        <h3 className="font-display text-sm font-bold uppercase tracking-wide text-flag-blue">
                          Score Breakdown
                        </h3>

                        {(() => {
                          // Use the most recent score entry
                          const s = p.scores[0];
                          return (
                            <div className="bg-white border border-gray-200 rounded-2xl p-4">
                              <div className="space-y-2">
                                {SCORE_CATEGORIES.map((cat) => (
                                  <div key={cat.key} className="flex items-center gap-3">
                                    <span className="w-28 text-xs font-medium text-gray-600">
                                      {cat.label}
                                    </span>
                                    <div className="flex-1">
                                      <ScoreBar value={s[cat.key]} />
                                    </div>
                                  </div>
                                ))}
                                <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                                  <span className="w-28 text-xs font-bold text-charcoal">Total</span>
                                  <span className="font-display text-lg font-bold text-flag-blue">
                                    {computeTotal(s)}
                                  </span>
                                  <span className="text-xs text-gray-400">/ 54</span>
                                </div>
                              </div>
                              {s.notes && (
                                <div className="mt-3 border-t border-gray-100 pt-3">
                                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                                    Notes
                                  </p>
                                  <p className="text-sm text-gray-700">
                                    {s.notes}
                                  </p>
                                </div>
                              )}
                              <p className="text-[10px] text-gray-300 mt-3">
                                Evaluated by {s.evaluator_name}
                              </p>
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400 italic">
                        No evaluator scores recorded yet.
                      </div>
                    )}
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

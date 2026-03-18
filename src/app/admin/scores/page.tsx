"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { ChevronDown, ChevronUp, Download } from "lucide-react";

interface TryoutSession {
  id: string;
  division: string;
  session_date: string;
  start_time: string;
  end_time: string | null;
  location: string;
  field: string | null;
  max_players: number;
}

interface Score {
  id: string;
  player_number: string | null;
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
  created_at: string;
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

const SCORE_CATEGORIES = [
  { key: "hitting", label: "Hitting" },
  { key: "fielding", label: "Fielding" },
  { key: "throwing", label: "Throwing" },
  { key: "running", label: "Running / Speed" },
  { key: "effort", label: "Effort" },
  { key: "attitude", label: "Attitude" },
] as const;

function computeTotal(score: Score): number {
  return (score.hitting || 0) + (score.fielding || 0) + (score.throwing || 0) + (score.running || 0) + (score.effort || 0) + (score.attitude || 0);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${display}:${m} ${ampm}`;
}

export default function ScoresPage() {
  const [scores, setScores] = useState<Score[]>([]);
  const [sessions, setSessions] = useState<TryoutSession[]>([]);
  const [assignmentCounts, setAssignmentCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [divisionFilter, setDivisionFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);

    const [scoresRes, sessionsRes, assignmentsRes] = await Promise.all([
      supabase.from("evaluator_scores").select("*"),
      supabase.from("tryout_sessions").select("*").order("session_date").order("start_time"),
      supabase.from("tryout_assignments").select("session_id"),
    ]);

    if (scoresRes.data) setScores(scoresRes.data);
    if (sessionsRes.data) setSessions(sessionsRes.data);

    // Count assignments per session
    if (assignmentsRes.data) {
      const counts: Record<string, number> = {};
      for (const a of assignmentsRes.data) {
        counts[a.session_id] = (counts[a.session_id] || 0) + 1;
      }
      setAssignmentCounts(counts);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    fetchData();
  }, [fetchData]);

  const filtered =
    divisionFilter === "all"
      ? scores
      : scores.filter((s) => s.division === divisionFilter);

  // Group by division for display
  const grouped = filtered.reduce<Record<string, Score[]>>((acc, score) => {
    const div = score.division || "Unknown";
    if (!acc[div]) acc[div] = [];
    acc[div].push(score);
    return acc;
  }, {});

  // Sort each group by computed total descending
  for (const div of Object.keys(grouped)) {
    grouped[div].sort((a, b) => computeTotal(b) - computeTotal(a));
  }

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
          Evaluator Scores
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          {scores.length} total score{scores.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Score Sheet Downloads */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-gray-400">
              Download Score Sheets
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Pre-filled Excel sheets with player names and scoring columns. Print for coaches or fill in digitally.
            </p>
          </div>
          <a
            href="/api/score-sheet?blank=true"
            download
            className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wide hover:bg-gray-200 transition-colors shrink-0"
          >
            <Download size={14} />
            Blank Template
          </a>
        </div>
        {sessions.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sessions.map((session) => {
              const count = assignmentCounts[session.id] || 0;
              return (
                <a
                  key={session.id}
                  href={count > 0 ? `/api/score-sheet?session_id=${session.id}` : undefined}
                  download={count > 0 ? true : undefined}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    count > 0
                      ? "border-flag-blue/20 bg-flag-blue/5 hover:bg-flag-blue/10 cursor-pointer"
                      : "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                  }`}
                >
                  <Download size={16} className={count > 0 ? "text-flag-blue" : "text-gray-300"} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-charcoal truncate">{session.division}</p>
                    <p className="text-xs text-gray-400">
                      {formatDate(session.session_date)} &middot; {formatTime(session.start_time)}
                      {session.location ? ` &middot; ${session.location}` : ""}
                      &middot; {count} player{count !== 1 ? "s" : ""}
                    </p>
                  </div>
                </a>
              );
            })}
          </div>
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

      {/* Scores by Division */}
      {Object.keys(grouped).length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-400 text-sm">No scores found.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {(divisionFilter === "all" ? DIVISIONS : [divisionFilter]).map(
            (div) => {
              const divScores = grouped[div];
              if (!divScores || divScores.length === 0) return null;

              return (
                <div key={div}>
                  <h2 className="font-display text-lg font-bold uppercase tracking-wide mb-3 flex items-center gap-2">
                    <span className="text-star-gold">&#9733;</span>
                    {div}
                    <span className="text-xs text-gray-400 font-normal normal-case tracking-normal">
                      ({divScores.length} score{divScores.length !== 1 ? "s" : ""})
                    </span>
                  </h2>

                  <div className="space-y-2">
                    {divScores.map((score, idx) => {
                      const expanded = expandedId === score.id;
                      return (
                        <div
                          key={score.id}
                          className="bg-white border border-gray-200 rounded-lg overflow-hidden"
                        >
                          {/* Summary Row */}
                          <button
                            onClick={() =>
                              setExpandedId(expanded ? null : score.id)
                            }
                            className="w-full text-left p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
                          >
                            {/* Rank */}
                            <div className="w-8 h-8 rounded-full bg-flag-blue/10 flex items-center justify-center font-display text-sm font-bold text-flag-blue shrink-0">
                              {idx + 1}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                                {score.player_number && (
                                  <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono">
                                    #{score.player_number}
                                  </span>
                                )}
                                <p className="text-sm font-semibold text-charcoal truncate">
                                  {score.player_name}
                                </p>
                              </div>
                              <p className="text-xs text-gray-400">
                                Evaluator: {score.evaluator_name}
                              </p>
                            </div>

                            {/* Total Score */}
                            <div className="text-right shrink-0">
                              <p className="font-display text-2xl font-bold text-flag-blue">
                                {computeTotal(score)}
                              </p>
                              <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                                / 54
                              </p>
                            </div>

                            {expanded ? (
                              <ChevronUp
                                size={18}
                                className="text-gray-400 shrink-0"
                              />
                            ) : (
                              <ChevronDown
                                size={18}
                                className="text-gray-400 shrink-0"
                              />
                            )}
                          </button>

                          {/* Score Breakdown */}
                          {expanded && (
                            <div className="border-t border-gray-200 p-4 md:p-5 space-y-4">
                              <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-gray-400">
                                Score Breakdown
                              </h3>
                              <div className="space-y-2.5">
                                {SCORE_CATEGORIES.map((cat) => {
                                  const val =
                                    score[cat.key as keyof Score] as number;
                                  return (
                                    <div key={cat.key}>
                                      <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm text-charcoal font-medium">
                                          {cat.label}
                                        </span>
                                        <span className="text-sm font-semibold text-flag-blue">
                                          {val} / 9
                                        </span>
                                      </div>
                                      <div className="w-full bg-gray-100 rounded-full h-2">
                                        <div
                                          className="bg-flag-blue h-2 rounded-full transition-all"
                                          style={{
                                            width: `${(val / 9) * 100}%`,
                                          }}
                                        />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Total */}
                              <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                                <span className="font-display text-sm font-bold uppercase tracking-wide">
                                  Total
                                </span>
                                <span className="font-display text-2xl font-bold text-flag-blue">
                                  {computeTotal(score)} / 54
                                </span>
                              </div>

                              {/* Notes */}
                              {score.notes && (
                                <div>
                                  <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-gray-400 mb-1">
                                    Evaluator Notes
                                  </h3>
                                  <p className="text-charcoal text-sm whitespace-pre-wrap bg-cream border border-sand rounded-lg p-3">
                                    {score.notes}
                                  </p>
                                </div>
                              )}

                              <p className="text-xs text-gray-400">
                                Evaluated:{" "}
                                {new Date(score.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}

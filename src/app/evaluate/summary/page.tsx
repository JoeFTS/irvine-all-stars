"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit3, LogOut, Trophy, AlertTriangle } from "lucide-react";

interface PlayerScore {
  id?: string;
  playerNumber: string;
  playerName: string;
  hitting: number | null;
  fielding: number | null;
  throwing: number | null;
  running: number | null;
  effort: number | null;
  attitude: number | null;
  notes: string;
  standoutSkills: string;
  concerns: string;
  synced: boolean;
}

interface EvaluatorInfo {
  evaluatorName: string;
  division: string;
  sessionId: string;
}

const CATEGORIES = [
  { key: "hitting", label: "HIT" },
  { key: "fielding", label: "FLD" },
  { key: "throwing", label: "THR" },
  { key: "running", label: "RUN" },
  { key: "effort", label: "EFF" },
  { key: "attitude", label: "ATT" },
] as const;

function totalScore(p: PlayerScore): number {
  let sum = 0;
  for (const c of CATEGORIES) {
    const v = p[c.key as keyof PlayerScore];
    if (typeof v === "number") sum += v;
  }
  return sum;
}

function hasScores(p: PlayerScore): boolean {
  return CATEGORIES.some((c) => p[c.key as keyof PlayerScore] != null);
}

export default function SummaryPage() {
  const router = useRouter();
  const [evaluator, setEvaluator] = useState<EvaluatorInfo | null>(null);
  const [players, setPlayers] = useState<PlayerScore[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("evaluator");
    if (!raw) {
      router.replace("/evaluate");
      return;
    }
    setEvaluator(JSON.parse(raw));

    const saved = localStorage.getItem("evaluator_players");
    if (saved) {
      try {
        setPlayers(JSON.parse(saved));
      } catch {
        // ignore
      }
    }
  }, [router]);

  const scoredPlayers = players.filter(hasScores);
  const unsyncedCount = scoredPlayers.filter((p) => !p.synced).length;

  function editPlayer(idx: number) {
    // find the real index in the full players array
    const realIdx = players.findIndex((p) => p === scoredPlayers[idx]);
    // store the index to navigate to
    sessionStorage.setItem("evaluator_goto", String(realIdx));
    router.push("/evaluate/score");
  }

  function endSession() {
    localStorage.removeItem("evaluator_players");
    sessionStorage.removeItem("evaluator");
    sessionStorage.removeItem("evaluator_goto");
    router.push("/evaluate");
  }

  if (!evaluator) return null;

  // sort by total score descending
  const sorted = [...scoredPlayers].sort(
    (a, b) => totalScore(b) - totalScore(a)
  );

  const avgScore =
    sorted.length > 0
      ? (sorted.reduce((s, p) => s + totalScore(p), 0) / sorted.length).toFixed(
          1
        )
      : "0";

  return (
    <div className="pt-16 min-h-screen bg-off-white pb-8">
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Back button */}
        <button
          onClick={() => router.push("/evaluate/score")}
          className="flex items-center gap-1 text-flag-blue text-sm font-medium mb-4 active:opacity-70"
        >
          <ArrowLeft size={16} />
          Back to Scoring
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="font-display text-2xl font-bold text-flag-blue uppercase tracking-wide">
            Session Summary
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            {evaluator.division} &middot; {evaluator.evaluatorName}
          </p>
          <p className="text-gray-400 text-xs mt-0.5">
            Session: {evaluator.sessionId}
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
            <div className="font-display text-2xl font-bold text-flag-blue">
              {sorted.length}
            </div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wide font-display">
              Players
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
            <div className="font-display text-2xl font-bold text-star-gold">
              {avgScore}
            </div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wide font-display">
              Avg Score
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
            <div
              className={`font-display text-2xl font-bold ${
                unsyncedCount > 0 ? "text-flag-red" : "text-green-600"
              }`}
            >
              {unsyncedCount > 0 ? unsyncedCount : "All"}
            </div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wide font-display">
              {unsyncedCount > 0 ? "Pending" : "Synced"}
            </div>
          </div>
        </div>

        {/* Unsynced warning */}
        {unsyncedCount > 0 && (
          <div className="bg-star-gold-bright/10 border border-star-gold-bright/30 rounded-xl px-4 py-3 mb-4 flex items-start gap-2">
            <AlertTriangle
              size={18}
              className="text-star-gold-bright shrink-0 mt-0.5"
            />
            <p className="text-sm text-charcoal">
              <strong>{unsyncedCount}</strong> score{unsyncedCount !== 1 && "s"}{" "}
              not yet synced. They&apos;re saved locally and will auto-retry.
            </p>
          </div>
        )}

        {/* Player List */}
        {sorted.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="font-display text-lg uppercase">No players scored yet</p>
            <p className="text-sm mt-1">Go back and start evaluating!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.map((player, i) => {
              const total = totalScore(player);
              const rank = i + 1;
              return (
                <div
                  key={player.playerNumber + i}
                  className="bg-white rounded-xl border border-gray-200 px-4 py-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {rank <= 3 && (
                        <Trophy
                          size={14}
                          className={
                            rank === 1
                              ? "text-star-gold"
                              : rank === 2
                              ? "text-gray-400"
                              : "text-orange-400"
                          }
                        />
                      )}
                      <div className="bg-flag-blue text-white font-display text-sm font-bold w-8 h-8 rounded-lg flex items-center justify-center">
                        #{player.playerNumber}
                      </div>
                      <div>
                        <div className="font-display text-sm font-semibold text-charcoal uppercase tracking-wide">
                          {player.playerName || "No Name"}
                        </div>
                        <div className="text-xs text-gray-400">
                          {!player.synced && (
                            <span className="text-star-gold-bright mr-1">
                              Pending
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-display text-xl font-bold text-flag-blue leading-none">
                          {total}
                        </div>
                        <div className="text-[10px] text-gray-400">/ 30</div>
                      </div>
                      <button
                        onClick={() => editPlayer(i)}
                        className="p-2 rounded-lg bg-gray-100 active:bg-gray-200 text-gray-600"
                      >
                        <Edit3 size={16} />
                      </button>
                    </div>
                  </div>
                  {/* Score breakdown */}
                  <div className="grid grid-cols-6 gap-1">
                    {CATEGORIES.map((cat) => {
                      const v = player[cat.key as keyof PlayerScore];
                      return (
                        <div key={cat.key} className="text-center">
                          <div className="text-[9px] text-gray-400 uppercase font-display tracking-wide">
                            {cat.label}
                          </div>
                          <div
                            className={`text-sm font-bold ${
                              typeof v === "number" && v >= 4
                                ? "text-flag-blue"
                                : typeof v === "number" && v <= 2
                                ? "text-flag-red"
                                : "text-charcoal"
                            }`}
                          >
                            {v ?? "-"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* End Session */}
        <div className="mt-8">
          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="w-full py-3.5 border-2 border-flag-red text-flag-red font-display text-sm font-bold uppercase tracking-wider rounded-xl active:bg-flag-red/5 transition-colors flex items-center justify-center gap-2"
            >
              <LogOut size={16} />
              End Session
            </button>
          ) : (
            <div className="bg-flag-red/5 border-2 border-flag-red rounded-xl p-4">
              <p className="text-sm text-charcoal text-center mb-3">
                This will clear local data. Synced scores are safe in the
                database.
                {unsyncedCount > 0 && (
                  <strong className="text-flag-red block mt-1">
                    Warning: {unsyncedCount} unsynced score
                    {unsyncedCount !== 1 && "s"} will be lost!
                  </strong>
                )}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-2.5 bg-gray-100 text-charcoal font-display text-sm font-bold uppercase tracking-wide rounded-lg active:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={endSession}
                  className="flex-1 py-2.5 bg-flag-red text-white font-display text-sm font-bold uppercase tracking-wide rounded-lg active:bg-flag-red-dark"
                >
                  Confirm End
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

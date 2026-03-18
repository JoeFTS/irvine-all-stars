"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Check,
  WifiOff,
  Wifi,
  ClipboardList,
} from "lucide-react";

/* ────────────────────────────── types ────────────────────────────── */

interface PlayerScore {
  id?: string; // supabase row id
  playerNumber: string;
  playerName: string;
  hitting: number | null;
  fielding: number | null;
  throwing: number | null;
  running: number | null;
  baseballIq: number | null;
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
  { key: "hitting", label: "Hitting" },
  { key: "fielding", label: "Fielding" },
  { key: "throwing", label: "Throwing" },
  { key: "running", label: "Running" },
  { key: "effort", label: "Effort" },
  { key: "attitude", label: "Attitude" },
] as const;

type CategoryKey = (typeof CATEGORIES)[number]["key"];

function emptyPlayer(num: number): PlayerScore {
  return {
    playerNumber: String(num),
    playerName: "",
    hitting: null,
    fielding: null,
    throwing: null,
    running: null,
    baseballIq: null,
    effort: null,
    attitude: null,
    notes: "",
    standoutSkills: "",
    concerns: "",
    synced: false,
  };
}

function totalScore(p: PlayerScore): number {
  let sum = 0;
  for (const c of CATEGORIES) {
    if (p[c.key] != null) sum += p[c.key]!;
  }
  return sum;
}

function scoredCount(p: PlayerScore): number {
  let n = 0;
  for (const c of CATEGORIES) {
    if (p[c.key] != null) n++;
  }
  return n;
}

/* ──────────────────────────── component ──────────────────────────── */

export default function ScoringPage() {
  const router = useRouter();
  const [evaluator, setEvaluator] = useState<EvaluatorInfo | null>(null);
  const [players, setPlayers] = useState<PlayerScore[]>([emptyPlayer(1)]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [pendingSync, setPendingSync] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const [showStandout, setShowStandout] = useState(false);
  const [showConcerns, setShowConcerns] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const player = players[currentIdx];

  /* ──── load evaluator info ──── */
  useEffect(() => {
    const raw = sessionStorage.getItem("evaluator");
    if (!raw) {
      router.replace("/evaluate");
      return;
    }
    setEvaluator(JSON.parse(raw));

    // restore from localStorage
    const saved = localStorage.getItem("evaluator_players");
    if (saved) {
      try {
        const parsed: PlayerScore[] = JSON.parse(saved);
        if (parsed.length > 0) setPlayers(parsed);
      } catch {
        // ignore
      }
    }

    // jump to specific player if coming from summary edit
    const gotoIdx = sessionStorage.getItem("evaluator_goto");
    if (gotoIdx != null) {
      setCurrentIdx(Number(gotoIdx));
      sessionStorage.removeItem("evaluator_goto");
    }
  }, [router]);

  /* ──── persist to localStorage on any change ──── */
  const persistLocal = useCallback(
    (updated: PlayerScore[]) => {
      localStorage.setItem("evaluator_players", JSON.stringify(updated));
      // count unsynced
      setPendingSync(updated.filter((p) => !p.synced && scoredCount(p) > 0).length);
    },
    []
  );

  /* ──── save to supabase ──── */
  const saveToSupabase = useCallback(
    async (p: PlayerScore, idx: number) => {
      if (!evaluator || !supabase) return;
      if (scoredCount(p) === 0) return; // nothing to save

      const row = {
        session_id: evaluator.sessionId,
        player_number: p.playerNumber,
        player_name: p.playerName || null,
        division: evaluator.division,
        evaluator_name: evaluator.evaluatorName,
        hitting: p.hitting,
        fielding: p.fielding,
        throwing: p.throwing,
        running: p.running,
        effort: p.effort,
        attitude: p.attitude,
        notes: p.notes || null,
        standout_skills: p.standoutSkills || null,
        concerns: p.concerns || null,
        updated_at: new Date().toISOString(),
      };

      try {
        if (p.id) {
          // update
          const { error } = await supabase
            .from("evaluator_scores")
            .update(row)
            .eq("id", p.id);
          if (error) throw error;
        } else {
          // insert
          const { data, error } = await supabase
            .from("evaluator_scores")
            .insert(row)
            .select("id")
            .single();
          if (error) throw error;
          if (data) {
            setPlayers((prev) => {
              const next = [...prev];
              next[idx] = { ...next[idx], id: data.id, synced: true };
              persistLocal(next);
              return next;
            });
            return;
          }
        }
        setPlayers((prev) => {
          const next = [...prev];
          next[idx] = { ...next[idx], synced: true };
          persistLocal(next);
          return next;
        });
      } catch {
        // failed — stays in localStorage queue
        setPlayers((prev) => {
          const next = [...prev];
          next[idx] = { ...next[idx], synced: false };
          persistLocal(next);
          return next;
        });
      }
    },
    [evaluator, persistLocal]
  );

  /* ──── debounced auto-save ──── */
  const debouncedSave = useCallback(
    (updated: PlayerScore[], idx: number) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        saveToSupabase(updated[idx], idx);
      }, 500);
    },
    [saveToSupabase]
  );

  /* ──── retry unsynced on mount and periodically ──── */
  useEffect(() => {
    const interval = setInterval(() => {
      setPlayers((prev) => {
        prev.forEach((p, i) => {
          if (!p.synced && scoredCount(p) > 0) {
            saveToSupabase(p, i);
          }
        });
        return prev;
      });
    }, 10000);
    return () => clearInterval(interval);
  }, [saveToSupabase]);

  /* ──── update helpers ──── */
  function updatePlayer(patch: Partial<PlayerScore>) {
    setPlayers((prev) => {
      const next = [...prev];
      next[currentIdx] = { ...next[currentIdx], ...patch, synced: false };
      persistLocal(next);
      debouncedSave(next, currentIdx);
      return next;
    });
  }

  function setScore(cat: CategoryKey, val: number) {
    // toggle off if same value tapped
    const current = player[cat];
    updatePlayer({ [cat]: current === val ? null : val });
  }

  /* ──── navigation ──── */
  function goNext() {
    // force save current
    saveToSupabase(players[currentIdx], currentIdx);

    if (currentIdx === players.length - 1) {
      // add new player
      const newPlayer = emptyPlayer(players.length + 1);
      setPlayers((prev) => {
        const next = [...prev, newPlayer];
        persistLocal(next);
        return next;
      });
      setCurrentIdx(currentIdx + 1);
    } else {
      setCurrentIdx(currentIdx + 1);
    }
    setShowNotes(false);
    setShowStandout(false);
    setShowConcerns(false);
    // flash saved indicator
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1200);
  }

  function goPrev() {
    if (currentIdx > 0) {
      saveToSupabase(players[currentIdx], currentIdx);
      setCurrentIdx(currentIdx - 1);
      setShowNotes(false);
      setShowStandout(false);
      setShowConcerns(false);
    }
  }

  function goToSummary() {
    // save current first
    saveToSupabase(players[currentIdx], currentIdx);
    router.push("/evaluate/summary");
  }

  if (!evaluator) return null;

  const total = totalScore(player);
  const scored = scoredCount(player);

  return (
    <div className="pt-[98px] min-h-screen bg-off-white pb-24">
      {/* ───── Sticky Header ───── */}
      <div className="sticky top-[98px] z-40 bg-flag-blue text-white px-4 py-3 shadow-md">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-display text-sm uppercase tracking-wide opacity-75 shrink-0">
                {evaluator.division}
              </span>
              <span className="text-white/40 shrink-0">|</span>
              <span className="text-sm opacity-75 truncate">
                {evaluator.evaluatorName}
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {/* Sync indicator */}
              {pendingSync > 0 ? (
                <span className="flex items-center gap-1 text-star-gold-bright text-xs">
                  <WifiOff size={14} />
                  {pendingSync}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-green-400 text-xs">
                  <Wifi size={14} />
                </span>
              )}
              <button
                onClick={goToSummary}
                className="flex items-center gap-1 text-xs bg-white/10 rounded px-2 py-1 active:bg-white/20"
              >
                <ClipboardList size={14} />
                Summary
              </button>
            </div>
          </div>

          {/* Player info row */}
          <div className="flex items-center gap-3 mt-2">
            <div className="bg-white text-flag-blue font-display text-xl font-bold w-12 h-12 rounded-lg flex items-center justify-center shrink-0">
              #{player.playerNumber}
            </div>
            <input
              type="text"
              value={player.playerName}
              onChange={(e) => updatePlayer({ playerName: e.target.value })}
              placeholder="Player name (optional)"
              className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder:text-white/40 focus:outline-none focus:bg-white/15 text-base"
            />
            <div className="text-right shrink-0">
              <div className="font-display text-2xl font-bold leading-none">
                {total}
              </div>
              <div className="text-[10px] opacity-60 uppercase tracking-wide">
                / 54
              </div>
            </div>
          </div>

          {/* Player counter */}
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs opacity-60">
              Player {currentIdx + 1} of {players.length}
            </span>
            {justSaved && (
              <span className="flex items-center gap-1 text-green-400 text-xs animate-pulse">
                <Check size={12} /> Saved
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ───── Scoring Categories ───── */}
      <div className="max-w-lg mx-auto px-4 mt-4 space-y-2">
        {CATEGORIES.map((cat) => {
          const val = player[cat.key];
          return (
            <div
              key={cat.key}
              className="bg-white rounded-xl border border-gray-200 px-4 py-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-sm font-semibold text-charcoal uppercase tracking-wide">
                  {cat.label}
                </span>
                {val != null && (
                  <span className="text-xs text-gray-400 font-medium">
                    {val}/9
                  </span>
                )}
              </div>
              <div className="flex gap-2 mt-2">
                {[1, 3, 5, 7, 9].map((n) => {
                  const selected = val === n;
                  return (
                    <button
                      key={n}
                      onClick={() => setScore(cat.key, n)}
                      className={`flex-1 h-14 rounded-xl text-lg font-bold transition-all duration-100 ${
                        selected
                          ? "bg-flag-blue text-white shadow-md scale-105"
                          : "bg-gray-100 text-gray-600 active:bg-gray-200"
                      }`}
                      style={{ minWidth: 48, minHeight: 48 }}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* ───── Collapsible Text Fields ───── */}
        <CollapsibleField
          label="Notes"
          value={player.notes}
          open={showNotes}
          onToggle={() => setShowNotes(!showNotes)}
          onChange={(v) => updatePlayer({ notes: v })}
          placeholder="General observations..."
        />
        <CollapsibleField
          label="Standout Skills"
          value={player.standoutSkills}
          open={showStandout}
          onToggle={() => setShowStandout(!showStandout)}
          onChange={(v) => updatePlayer({ standoutSkills: v })}
          placeholder="What impressed you..."
        />
        <CollapsibleField
          label="Concerns"
          value={player.concerns}
          open={showConcerns}
          onToggle={() => setShowConcerns(!showConcerns)}
          onChange={(v) => updatePlayer({ concerns: v })}
          placeholder="Areas of concern..."
        />

        {/* Score progress bar */}
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400 uppercase tracking-wide font-display">
              Completion
            </span>
            <span className="text-xs text-gray-400">
              {scored}/6 categories
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-flag-blue rounded-full transition-all duration-300"
              style={{ width: `${(scored / 6) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* ───── Bottom Navigation ───── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-40">
        <div className="max-w-lg mx-auto flex gap-3">
          <button
            onClick={goPrev}
            disabled={currentIdx === 0}
            className={`flex items-center justify-center gap-1 px-4 py-3.5 rounded-xl font-display text-sm font-bold uppercase tracking-wide transition-colors ${
              currentIdx === 0
                ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                : "bg-gray-100 text-charcoal active:bg-gray-200"
            }`}
          >
            <ChevronLeft size={18} />
            Prev
          </button>
          <button
            onClick={goNext}
            className="flex-1 flex items-center justify-center gap-1 py-3.5 rounded-xl bg-flag-blue text-white font-display text-sm font-bold uppercase tracking-wide active:bg-flag-blue-mid transition-colors"
          >
            Save & Next
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ────────────── Collapsible Text Field ────────────── */

function CollapsibleField({
  label,
  value,
  open,
  onToggle,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  open: boolean;
  onToggle: () => void;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 active:bg-gray-50"
      >
        <span className="font-display text-sm font-semibold text-charcoal uppercase tracking-wide">
          {label}
          {value && !open && (
            <span className="ml-2 text-flag-blue text-xs normal-case tracking-normal">
              (has content)
            </span>
          )}
        </span>
        {open ? (
          <ChevronUp size={18} className="text-gray-400" />
        ) : (
          <ChevronDown size={18} className="text-gray-400" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-3">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={3}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-charcoal text-sm focus:outline-none focus:ring-2 focus:ring-flag-blue focus:border-transparent resize-none"
          />
        </div>
      )}
    </div>
  );
}

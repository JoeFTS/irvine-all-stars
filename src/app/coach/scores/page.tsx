"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import {
  parseTSV,
  parseCSV,
  parseXLSX,
  validateScores,
  VALID_SCORES,
  MAX_TOTAL,
  type ParsedScore,
} from "@/lib/score-parser";
import {
  Upload,
  ClipboardPaste,
  PenLine,
  Download,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Send,
  Plus,
} from "lucide-react";

/* ---------- Types ---------- */

interface Profile {
  division: string | null;
  full_name: string | null;
}

interface Registration {
  id: string;
  player_first_name: string;
  player_last_name: string;
  primary_position: string;
  bats: string;
  throws: string;
  current_team: string | null;
  jersey_number: string | null;
}

interface ExistingScore {
  id: string;
  player_name: string;
}

type Tab = "paste" | "upload" | "manual";

/* ---------- Component ---------- */

export default function CoachScoresPage() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [existingScores, setExistingScores] = useState<ExistingScore[]>([]);

  const [tab, setTab] = useState<Tab>("paste");
  const [pasteText, setPasteText] = useState("");
  const [parsedScores, setParsedScores] = useState<ParsedScore[] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    count: number;
    message: string;
  } | null>(null);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);

  /* ---- Data fetching ---- */

  useEffect(() => {
    if (!user || !supabase) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      if (!supabase || !user) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("division, full_name")
        .eq("id", user.id)
        .single();

      if (cancelled) return;
      setProfile(profileData as Profile | null);

      const division = profileData?.division;
      if (!division) {
        setLoading(false);
        return;
      }

      const [regsResult, scoresResult] = await Promise.all([
        supabase
          .from("tryout_registrations")
          .select(
            "id, player_first_name, player_last_name, primary_position, bats, throws, current_team, jersey_number"
          )
          .eq("division", division)
          .order("player_last_name"),
        supabase
          .from("evaluator_scores")
          .select("id, player_name")
          .eq("evaluator_name", profileData?.full_name || "")
          .eq("division", division),
      ]);

      if (cancelled) return;
      setRegistrations((regsResult.data ?? []) as Registration[]);
      setExistingScores((scoresResult.data ?? []) as ExistingScore[]);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const division = profile?.division ?? null;
  const coachName = profile?.full_name ?? "Coach";

  const registrationNames = useMemo(
    () =>
      registrations.map(
        (r) => `${r.player_first_name} ${r.player_last_name}`
      ),
    [registrations]
  );

  /* ---- Parsing handlers ---- */

  const handleParse = useCallback(() => {
    if (!pasteText.trim()) return;
    const raw = parseTSV(pasteText);
    const validated = validateScores(raw, registrationNames);
    setParsedScores(validated);
    setSubmitResult(null);
  }, [pasteText, registrationNames]);

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setSubmitResult(null);

      try {
        let raw: ParsedScore[];

        if (
          file.name.endsWith(".xlsx") ||
          file.name.endsWith(".xls")
        ) {
          const buffer = await file.arrayBuffer();
          raw = await parseXLSX(buffer);
        } else {
          const text = await file.text();
          raw = parseCSV(text);
        }

        const validated = validateScores(raw, registrationNames);
        setParsedScores(validated);
      } catch {
        setParsedScores([]);
      }

      // Reset input
      e.target.value = "";
    },
    [registrationNames]
  );

  const handleManualInit = useCallback(() => {
    const rows: ParsedScore[] = registrations.map((r, i) => ({
      rowIndex: i + 1,
      playerNumber: r.jersey_number || String(i + 1),
      lastName: r.player_last_name,
      firstName: r.player_first_name,
      position: r.primary_position,
      bats: r.bats,
      throws: r.throws,
      team: r.current_team || "",
      hitting: null,
      fielding: null,
      throwing: null,
      running: null,
      effort: null,
      attitude: null,
      total: null,
      notes: "",
      errors: [],
      status: "valid" as const,
    }));
    setParsedScores(rows);
    setSubmitResult(null);
  }, [registrations]);

  const handleAddManualRow = useCallback(() => {
    setParsedScores((prev) => {
      if (!prev) return prev;
      return [
        ...prev,
        {
          rowIndex: prev.length + 1,
          playerNumber: "",
          lastName: "",
          firstName: "",
          position: "",
          bats: "",
          throws: "",
          team: "",
          hitting: null,
          fielding: null,
          throwing: null,
          running: null,
          effort: null,
          attitude: null,
          total: null,
          notes: "",
          errors: [],
          status: "valid" as const,
        },
      ];
    });
  }, []);

  /* ---- Preview table handlers ---- */

  const updateScore = useCallback(
    (
      idx: number,
      field: keyof ParsedScore,
      value: number | null | string
    ) => {
      setParsedScores((prev) => {
        if (!prev) return prev;
        const next = [...prev];
        const row = { ...next[idx], [field]: value };
        // Recalculate total
        const vals = [
          row.hitting,
          row.fielding,
          row.throwing,
          row.running,
          row.effort,
          row.attitude,
        ];
        const filled = (vals.filter((v) => v !== null) as number[]);
        row.total = filled.length > 0 ? filled.reduce((a, b) => a + b, 0) : null;
        next[idx] = row;
        return validateScores(next, registrationNames);
      });
    },
    [registrationNames]
  );

  const removeRow = useCallback((idx: number) => {
    setParsedScores((prev) => {
      if (!prev) return prev;
      return prev.filter((_, i) => i !== idx);
    });
  }, []);

  /* ---- Submit ---- */

  const validRows = useMemo(
    () =>
      parsedScores?.filter(
        (s) => s.status === "valid" || s.status === "warning"
      ) ?? [],
    [parsedScores]
  );

  const errorCount = useMemo(
    () => parsedScores?.filter((s) => s.status === "error").length ?? 0,
    [parsedScores]
  );

  const handleSubmit = useCallback(
    async (mode: "update" | "add") => {
      if (!supabase || !division || validRows.length === 0) return;

      setSubmitting(true);
      setShowDuplicateDialog(false);

      try {
        if (mode === "update" && existingScores.length > 0) {
          // Delete existing scores by this coach in this division
          const existingIds = existingScores.map((s) => s.id);
          await supabase
            .from("evaluator_scores")
            .delete()
            .in("id", existingIds);
        }

        const dbRows = validRows.map((score) => ({
          player_number: score.playerNumber || null,
          player_name:
            `${score.firstName} ${score.lastName}`.trim() || "Unknown",
          division,
          evaluator_name: coachName,
          hitting: score.hitting,
          fielding: score.fielding,
          throwing: score.throwing,
          running: score.running,
          effort: score.effort,
          attitude: score.attitude,
          notes: score.notes || null,
          updated_at: new Date().toISOString(),
        }));

        const { error } = await supabase
          .from("evaluator_scores")
          .insert(dbRows);

        if (error) {
          setSubmitResult({
            success: false,
            count: 0,
            message: `Error: ${error.message}`,
          });
        } else {
          setSubmitResult({
            success: true,
            count: dbRows.length,
            message: `${dbRows.length} score${dbRows.length !== 1 ? "s" : ""} submitted successfully!`,
          });
          setParsedScores(null);
          setPasteText("");

          // Refresh existing scores
          const { data } = await supabase
            .from("evaluator_scores")
            .select("id, player_name")
            .eq("evaluator_name", coachName)
            .eq("division", division);
          setExistingScores((data ?? []) as ExistingScore[]);
        }
      } catch {
        setSubmitResult({
          success: false,
          count: 0,
          message: "An unexpected error occurred.",
        });
      }

      setSubmitting(false);
    },
    [supabase, division, validRows, coachName, existingScores]
  );

  const handleSubmitClick = useCallback(() => {
    if (existingScores.length > 0) {
      setShowDuplicateDialog(true);
    } else {
      handleSubmit("add");
    }
  }, [existingScores, handleSubmit]);

  /* ---- Loading / guards ---- */

  if (loading) {
    return (
      <div className="p-6 md:p-10 space-y-4">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
        <div className="h-40 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!division) {
    return (
      <div className="p-6 md:p-10">
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="font-display text-xl font-bold uppercase tracking-wide text-flag-blue mb-2">
            Division Not Assigned
          </p>
          <p className="text-gray-500 text-sm">
            Contact the coordinator to get assigned to a division before
            entering scores.
          </p>
        </div>
      </div>
    );
  }

  const TABS: { id: Tab; label: string; icon: typeof Upload }[] = [
    { id: "paste", label: "Paste from Spreadsheet", icon: ClipboardPaste },
    { id: "upload", label: "Upload File", icon: Upload },
    { id: "manual", label: "Manual Entry", icon: PenLine },
  ];

  const scoreFields: {
    key: "hitting" | "fielding" | "throwing" | "running" | "effort" | "attitude";
    label: string;
  }[] = [
    { key: "hitting", label: "Hit" },
    { key: "fielding", label: "Fld" },
    { key: "throwing", label: "Thr" },
    { key: "running", label: "Run" },
    { key: "effort", label: "Eff" },
    { key: "attitude", label: "Att" },
  ];

  return (
    <div className="p-6 md:p-10">
      {/* Header */}
      <div className="mb-6">
        <p className="font-display text-sm font-semibold text-flag-red uppercase tracking-[3px] mb-1">
          Coach
        </p>
        <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide">
          Enter Scores
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          {division} &middot; {registrations.length} registered player
          {registrations.length !== 1 ? "s" : ""}
          {existingScores.length > 0 && (
            <span className="text-star-gold">
              {" "}
              &middot; {existingScores.length} existing score
              {existingScores.length !== 1 ? "s" : ""} submitted
            </span>
          )}
        </p>
      </div>

      {/* Success/Error Result */}
      {submitResult && (
        <div
          className={`mb-6 p-4 rounded-lg border ${
            submitResult.success
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-flag-red"
          }`}
        >
          <div className="flex items-center gap-2">
            {submitResult.success ? (
              <CheckCircle2 size={18} />
            ) : (
              <XCircle size={18} />
            )}
            <span className="font-semibold text-sm">
              {submitResult.message}
            </span>
          </div>
        </div>
      )}

      {/* Tab Bar */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => {
              setTab(id);
              if (id === "manual" && !parsedScores) handleManualInit();
            }}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              tab === id
                ? "bg-flag-blue text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {!parsedScores && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          {tab === "paste" && (
            <div>
              <h2 className="font-display text-lg font-bold uppercase tracking-wide mb-2">
                Paste from Google Sheets or Excel
              </h2>
              <p className="text-gray-500 text-sm mb-4">
                Select your score data in Google Sheets (including player names
                and scores), copy it (Ctrl+C / Cmd+C), then paste below.
                The data should match the score sheet template format.
              </p>
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Paste your score data here..."
                rows={10}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm font-mono text-charcoal placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-flag-blue/30 resize-y"
              />
              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={handleParse}
                  disabled={!pasteText.trim()}
                  className="inline-flex items-center gap-2 bg-flag-blue text-white px-5 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wide hover:bg-flag-blue/90 transition-colors disabled:opacity-50"
                >
                  <ClipboardPaste size={16} />
                  Parse Scores
                </button>
                <a
                  href="/api/score-sheet?blank=true"
                  download
                  className="inline-flex items-center gap-2 bg-gray-100 text-gray-600 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
                >
                  <Download size={16} />
                  Download Template
                </a>
              </div>
            </div>
          )}

          {tab === "upload" && (
            <div>
              <h2 className="font-display text-lg font-bold uppercase tracking-wide mb-2">
                Upload Score File
              </h2>
              <p className="text-gray-500 text-sm mb-4">
                Upload a CSV or Excel (.xlsx) file with your scores. Use the
                template for the correct format.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-3">
                <label className="inline-flex items-center gap-2 bg-flag-blue text-white px-5 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wide hover:bg-flag-blue/90 transition-colors cursor-pointer">
                  <Upload size={16} />
                  Choose File
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <a
                  href="/api/score-sheet?blank=true"
                  download
                  className="inline-flex items-center gap-2 bg-gray-100 text-gray-600 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
                >
                  <Download size={16} />
                  Download Template
                </a>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                Accepts .csv and .xlsx files
              </p>
            </div>
          )}

          {tab === "manual" && (
            <div className="text-center py-4">
              <p className="text-gray-500 text-sm mb-4">
                Enter scores manually for {registrations.length} registered
                players in {division}.
              </p>
              <button
                onClick={handleManualInit}
                disabled={registrations.length === 0}
                className="inline-flex items-center gap-2 bg-flag-blue text-white px-5 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wide hover:bg-flag-blue/90 transition-colors disabled:opacity-50"
              >
                <PenLine size={16} />
                Start Entering Scores
              </button>
            </div>
          )}
        </div>
      )}

      {/* Preview Table */}
      {parsedScores && (
        <div>
          {/* Summary bar */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="font-semibold text-charcoal">
                {parsedScores.length} row
                {parsedScores.length !== 1 ? "s" : ""}
              </span>
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle2 size={14} />
                {validRows.length} valid
              </span>
              {errorCount > 0 && (
                <span className="flex items-center gap-1 text-flag-red">
                  <XCircle size={14} />
                  {errorCount} error{errorCount !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {tab === "manual" && (
                <button
                  onClick={handleAddManualRow}
                  className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide hover:bg-gray-200 transition-colors"
                >
                  <Plus size={14} />
                  Add Row
                </button>
              )}
              <button
                onClick={() => {
                  setParsedScores(null);
                  setPasteText("");
                }}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors px-2 py-1"
              >
                Clear All
              </button>
              <button
                onClick={handleSubmitClick}
                disabled={validRows.length === 0 || submitting}
                className="inline-flex items-center gap-2 bg-flag-blue text-white px-5 py-2 rounded-lg text-sm font-semibold uppercase tracking-wide hover:bg-flag-blue/90 transition-colors disabled:opacity-50"
              >
                <Send size={14} />
                {submitting
                  ? "Submitting..."
                  : `Submit ${validRows.length} Score${validRows.length !== 1 ? "s" : ""}`}
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider w-8">
                    #
                  </th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider min-w-[140px]">
                    Player
                  </th>
                  {scoreFields.map((f) => (
                    <th
                      key={f.key}
                      className="px-2 py-2.5 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider w-16"
                    >
                      {f.label}
                    </th>
                  ))}
                  <th className="px-2 py-2.5 text-center text-[10px] font-semibold text-flag-blue uppercase tracking-wider w-14">
                    Total
                  </th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider min-w-[120px]">
                    Notes
                  </th>
                  <th className="px-2 py-2.5 w-10" />
                </tr>
              </thead>
              <tbody>
                {parsedScores.map((score, idx) => (
                  <tr
                    key={idx}
                    className={`border-b border-gray-100 last:border-0 ${
                      score.status === "error"
                        ? "bg-red-50/50"
                        : score.status === "warning"
                        ? "bg-amber-50/50"
                        : ""
                    }`}
                  >
                    {/* Row number + status */}
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        {score.status === "valid" && (
                          <CheckCircle2
                            size={12}
                            className="text-green-500 shrink-0"
                          />
                        )}
                        {score.status === "warning" && (
                          <AlertTriangle
                            size={12}
                            className="text-amber-500 shrink-0"
                          />
                        )}
                        {score.status === "error" && (
                          <XCircle
                            size={12}
                            className="text-flag-red shrink-0"
                          />
                        )}
                        <span className="text-xs text-gray-400">
                          {idx + 1}
                        </span>
                      </div>
                    </td>

                    {/* Player name */}
                    <td className="px-3 py-2">
                      {tab === "manual" ? (
                        <div className="flex gap-1">
                          <input
                            type="text"
                            value={score.firstName}
                            onChange={(e) =>
                              updateScore(idx, "firstName", e.target.value)
                            }
                            placeholder="First"
                            className="w-20 border border-gray-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-flag-blue/30"
                          />
                          <input
                            type="text"
                            value={score.lastName}
                            onChange={(e) =>
                              updateScore(idx, "lastName", e.target.value)
                            }
                            placeholder="Last"
                            className="w-20 border border-gray-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-flag-blue/30"
                          />
                        </div>
                      ) : (
                        <div>
                          <span className="font-semibold text-charcoal">
                            {score.firstName} {score.lastName}
                          </span>
                          {score.position && (
                            <span className="text-xs text-gray-400 ml-1">
                              ({score.position})
                            </span>
                          )}
                        </div>
                      )}
                      {score.errors.length > 0 && (
                        <p className="text-[10px] text-flag-red mt-0.5">
                          {score.errors.join("; ")}
                        </p>
                      )}
                    </td>

                    {/* Score cells */}
                    {scoreFields.map((f) => (
                      <td key={f.key} className="px-1 py-2 text-center">
                        <select
                          value={
                            (score[f.key] as number | null) ?? ""
                          }
                          onChange={(e) =>
                            updateScore(
                              idx,
                              f.key,
                              e.target.value ? parseInt(e.target.value) : null
                            )
                          }
                          className="w-14 border border-gray-200 rounded px-1 py-1.5 text-xs text-center font-semibold text-charcoal focus:outline-none focus:ring-1 focus:ring-flag-blue/30 bg-white"
                        >
                          <option value="">—</option>
                          {VALID_SCORES.map((v) => (
                            <option key={v} value={v}>
                              {v}
                            </option>
                          ))}
                        </select>
                      </td>
                    ))}

                    {/* Total */}
                    <td className="px-2 py-2 text-center">
                      <span className="font-display text-sm font-bold text-flag-blue">
                        {score.total ?? "—"}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        /{MAX_TOTAL}
                      </span>
                    </td>

                    {/* Notes */}
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={score.notes}
                        onChange={(e) =>
                          updateScore(idx, "notes", e.target.value)
                        }
                        placeholder="Notes..."
                        className="w-full border border-gray-200 rounded px-2 py-1 text-xs text-charcoal placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-flag-blue/30"
                      />
                    </td>

                    {/* Remove */}
                    <td className="px-2 py-2">
                      <button
                        onClick={() => removeRow(idx)}
                        className="p-1 rounded text-gray-300 hover:text-flag-red hover:bg-red-50 transition-colors"
                        title="Remove row"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Score scale legend */}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-400">
            <span className="font-semibold uppercase tracking-wider">
              Scale:
            </span>
            {VALID_SCORES.map((v) => (
              <span key={v} className="bg-gray-100 px-2 py-0.5 rounded">
                {v} ={" "}
                {v === 1
                  ? "Needs Work"
                  : v === 3
                  ? "Below Avg"
                  : v === 5
                  ? "Average"
                  : v === 7
                  ? "Above Avg"
                  : "Excellent"}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Duplicate Dialog */}
      {showDuplicateDialog && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="font-display text-lg font-bold uppercase tracking-wide mb-2">
              Existing Scores Found
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              You have {existingScores.length} existing score
              {existingScores.length !== 1 ? "s" : ""} in {division}. What
              would you like to do?
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleSubmit("update")}
                disabled={submitting}
                className="w-full bg-flag-blue text-white px-4 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wide hover:bg-flag-blue/90 transition-colors disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Replace Existing Scores"}
              </button>
              <button
                onClick={() => handleSubmit("add")}
                disabled={submitting}
                className="w-full bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wide hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Add as Additional Scores
              </button>
              <button
                onClick={() => setShowDuplicateDialog(false)}
                className="w-full text-gray-400 text-sm py-2 hover:text-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

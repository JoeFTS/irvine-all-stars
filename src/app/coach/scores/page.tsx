"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import {
  parseCSV,
  parseXLSX,
  validateScores,
} from "@/lib/score-parser";
import {
  Upload,
  Download,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
} from "lucide-react";

/* ---------- Types ---------- */

interface Profile {
  division: string | null;
  full_name: string | null;
}

interface ExistingScore {
  id: string;
  player_name: string;
}

/* ---------- Component ---------- */

export default function CoachScoresPage() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [playerCount, setPlayerCount] = useState(0);
  const [existingScores, setExistingScores] = useState<ExistingScore[]>([]);

  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

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
          .select("id", { count: "exact", head: true })
          .eq("division", division),
        supabase
          .from("evaluator_scores")
          .select("id, player_name")
          .eq("evaluator_name", profileData?.full_name || "")
          .eq("division", division),
      ]);

      if (cancelled) return;
      setPlayerCount(regsResult.count ?? 0);
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

  /* ---- File selection (separate from upload) ---- */

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setSelectedFile(file);
      setResult(null);
      e.target.value = "";
    },
    []
  );

  const handleClearFile = useCallback(() => {
    setSelectedFile(null);
  }, []);

  /* ---- Upload handler ---- */

  const handleUpload = useCallback(async () => {
    if (!selectedFile || !supabase || !division) return;

    setUploading(true);

    try {
      // Parse the file
      let parsed;
      if (
        selectedFile.name.endsWith(".xlsx") ||
        selectedFile.name.endsWith(".xls")
      ) {
        const buffer = await selectedFile.arrayBuffer();
        parsed = await parseXLSX(buffer);
      } else {
        const text = await selectedFile.text();
        parsed = parseCSV(text);
      }

      const validated = validateScores(parsed);
      const valid = validated.filter(
        (s) => s.status === "valid" || s.status === "warning"
      );

      if (valid.length === 0) {
        setResult({
          success: false,
          message:
            "No valid scores found in the file. Make sure you filled in scores using the template.",
        });
        setUploading(false);
        return;
      }

      // Delete all previous scores by this coach in this division
      const { error: deleteError } = await supabase
        .from("evaluator_scores")
        .delete()
        .eq("evaluator_name", coachName)
        .eq("division", division);

      // Verify deletion actually worked (RLS may silently block it)
      if (!deleteError) {
        const { count } = await supabase
          .from("evaluator_scores")
          .select("id", { count: "exact", head: true })
          .eq("evaluator_name", coachName)
          .eq("division", division);

        if (count && count > 0) {
          setResult({
            success: false,
            message: "Could not clear previous scores. Please contact the coordinator.",
          });
          setUploading(false);
          return;
        }
      } else {
        setResult({
          success: false,
          message: "Could not clear previous scores. Please contact the coordinator.",
        });
        setUploading(false);
        return;
      }

      // Insert new scores
      const dbRows = valid.map((score) => ({
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
        setResult({ success: false, message: `Error: ${error.message}` });
      } else {
        setResult({
          success: true,
          message: `${dbRows.length} score${dbRows.length !== 1 ? "s" : ""} saved successfully!`,
        });
        setSelectedFile(null);

        // Refresh existing scores count
        const { data } = await supabase
          .from("evaluator_scores")
          .select("id, player_name")
          .eq("evaluator_name", coachName)
          .eq("division", division);
        setExistingScores((data ?? []) as ExistingScore[]);
      }
    } catch {
      setResult({
        success: false,
        message:
          "Could not read the file. Make sure it is a valid .xlsx or .csv file.",
      });
    }

    setUploading(false);
  }, [selectedFile, supabase, division, coachName, existingScores]);

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

  return (
    <div className="p-6 md:p-10">
      {/* Header */}
      <div className="mb-8">
        <p className="font-display text-sm font-semibold text-flag-red uppercase tracking-[3px] mb-1">
          Coach
        </p>
        <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide">
          Enter Scores
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          {division} &middot; {playerCount} registered player
          {playerCount !== 1 ? "s" : ""}
          {existingScores.length > 0 && (
            <span className="text-green-600">
              {" "}
              &middot; {existingScores.length} score
              {existingScores.length !== 1 ? "s" : ""} submitted
            </span>
          )}
        </p>
      </div>

      {/* Result message */}
      {result && (
        <div
          className={`mb-6 p-4 rounded-lg border flex items-center gap-2 ${
            result.success
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-flag-red"
          }`}
        >
          {result.success ? (
            <CheckCircle2 size={18} className="shrink-0" />
          ) : (
            <XCircle size={18} className="shrink-0" />
          )}
          <span className="font-semibold text-sm">{result.message}</span>
        </div>
      )}

      {/* Step 1: Download Template */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 mb-4">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="w-10 h-10 rounded-full bg-flag-blue text-white font-display text-lg font-bold flex items-center justify-center shrink-0">
            1
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-base sm:text-lg font-bold uppercase tracking-wide mb-2">
              Download the Score Sheet
            </h2>
            <p className="text-gray-500 text-sm mb-4">
              This template already has your players&apos; names filled in.
              Just enter the scores.
            </p>
            <button
              onClick={async () => {
                if (!supabase) return;
                const { data: { session } } = await supabase.auth.getSession();
                const res = await fetch(`/api/score-sheet?division=${encodeURIComponent(division)}`, {
                  headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
                });
                if (!res.ok) return alert("Download failed");
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${division}_Score_Sheet.xlsx`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto bg-flag-blue text-white px-5 py-3 sm:py-2.5 min-h-[44px] rounded-lg text-sm font-semibold uppercase tracking-wide hover:bg-flag-blue/90 transition-colors"
            >
              <Download size={16} />
              Download Score Sheet
            </button>
          </div>
        </div>
      </div>

      {/* Step 2: Fill in scores */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 mb-4">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="w-10 h-10 rounded-full bg-flag-blue text-white font-display text-lg font-bold flex items-center justify-center shrink-0">
            2
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-base sm:text-lg font-bold uppercase tracking-wide mb-2">
              Fill In Scores
            </h2>
            <p className="text-gray-500 text-sm mb-3">
              Open the file and enter a score for each player. Use{" "}
              <strong>1, 3, 5, 7, or 9</strong> for each category (9 is
              highest).
            </p>

            <div className="bg-flag-blue/5 border border-flag-blue/10 rounded-lg p-4">
              <p className="font-display text-xs font-semibold uppercase tracking-wider text-flag-blue mb-2">
                Option A &mdash; Use Excel or Numbers
              </p>
              <p className="text-gray-600 text-sm mb-3">
                Double-click the downloaded .xlsx file. It opens directly in
                Excel or Numbers. Fill in the yellow score columns, then save.
              </p>

              <p className="font-display text-xs font-semibold uppercase tracking-wider text-flag-blue mb-2">
                Option B &mdash; Use Google Sheets
              </p>
              <ol className="text-gray-600 text-sm space-y-1 list-decimal list-inside">
                <li>
                  Go to{" "}
                  <strong>sheets.google.com</strong> and create a new
                  spreadsheet.
                </li>
                <li>
                  Click <strong>File &rarr; Import &rarr; Upload</strong>,
                  then select the downloaded .xlsx file.
                </li>
                <li>Fill in the yellow score columns for each player.</li>
                <li>
                  Click <strong>File &rarr; Download &rarr; Microsoft
                  Excel (.xlsx)</strong> to save it back to your computer.
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* Step 3: Upload */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="w-10 h-10 rounded-full bg-flag-blue text-white font-display text-lg font-bold flex items-center justify-center shrink-0">
            3
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-base sm:text-lg font-bold uppercase tracking-wide mb-2">
              Upload Your Completed File
            </h2>
            <p className="text-gray-500 text-sm mb-4">
              Upload the score sheet with your scores filled in. We&apos;ll
              save everything automatically.
              {existingScores.length > 0 && (
                <span className="text-amber-600">
                  {" "}
                  This will replace your {existingScores.length} previously
                  submitted score{existingScores.length !== 1 ? "s" : ""}.
                </span>
              )}
            </p>

            {selectedFile ? (
              /* File selected — show name with Upload and Replace buttons */
              <div className="border-2 border-flag-blue/30 bg-flag-blue/5 rounded-lg px-5 py-4 inline-flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <FileSpreadsheet size={20} className="text-flag-blue shrink-0" />
                  <span className="text-sm font-semibold text-charcoal truncate">
                    {selectedFile.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="inline-flex items-center gap-2 bg-flag-blue text-white px-5 py-2.5 min-h-[44px] rounded-lg text-sm font-semibold uppercase tracking-wide hover:bg-flag-blue/90 transition-colors disabled:opacity-50"
                  >
                    <Upload size={14} />
                    {uploading ? "Uploading..." : "Upload Scores"}
                  </button>
                  <button
                    onClick={handleClearFile}
                    disabled={uploading}
                    className="inline-flex items-center gap-2 bg-gray-100 text-gray-600 px-4 py-2.5 min-h-[44px] rounded-lg text-sm font-semibold uppercase tracking-wide hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    Replace File
                  </button>
                </div>
              </div>
            ) : (
              /* No file selected — show file picker */
              <label className="inline-flex items-center gap-3 border-2 border-dashed border-gray-300 hover:border-flag-blue hover:bg-flag-blue/5 rounded-lg px-8 py-5 transition-colors cursor-pointer">
                <Upload size={20} className="text-gray-400" />
                <span className="text-sm font-semibold text-gray-600">
                  Choose .xlsx or .csv file
                </span>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Score scale reference */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="font-display text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
          Scoring Scale
        </p>
        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
          <span className="bg-white px-2.5 py-1 rounded border border-gray-200">
            <strong>1</strong> = Needs Work
          </span>
          <span className="bg-white px-2.5 py-1 rounded border border-gray-200">
            <strong>3</strong> = Below Avg
          </span>
          <span className="bg-white px-2.5 py-1 rounded border border-gray-200">
            <strong>5</strong> = Average
          </span>
          <span className="bg-white px-2.5 py-1 rounded border border-gray-200">
            <strong>7</strong> = Above Avg
          </span>
          <span className="bg-white px-2.5 py-1 rounded border border-gray-200">
            <strong>9</strong> = Excellent
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          6 categories: Hitting, Fielding, Throwing, Running / Speed, Effort,
          Attitude. Max total: 54 points.
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DIVISIONS = [
  "7U-Shetland",
  "8U-Pinto",
  "9U-Mustang",
  "10U-Mustang",
  "11U-Bronco",
  "12U-Bronco",
];

export default function EvaluateSetupPage() {
  const router = useRouter();
  const [evaluatorName, setEvaluatorName] = useState("");
  const [division, setDivision] = useState("");
  const [sessionId, setSessionId] = useState(() => {
    const now = new Date();
    const date = now.toISOString().slice(0, 10).replace(/-/g, "");
    const time = now.toTimeString().slice(0, 5).replace(":", "");
    return `${date}-${time}`;
  });
  const [error, setError] = useState("");

  function handleStart() {
    if (!evaluatorName.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!division) {
      setError("Please select a division.");
      return;
    }
    if (!sessionId.trim()) {
      setError("Please enter a session ID.");
      return;
    }

    sessionStorage.setItem(
      "evaluator",
      JSON.stringify({
        evaluatorName: evaluatorName.trim(),
        division,
        sessionId: sessionId.trim(),
      })
    );

    router.push("/evaluate/score");
  }

  return (
    <div className="pt-[98px] min-h-screen bg-off-white">
      <div className="max-w-md mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-flag-blue uppercase tracking-wide">
            Evaluator Setup
          </h1>
          <p className="text-gray-600 mt-2">
            Enter your info to begin scoring players
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          {/* Evaluator Name */}
          <div>
            <label className="block font-display text-sm font-semibold text-charcoal uppercase tracking-wide mb-1.5">
              Your Name
            </label>
            <input
              type="text"
              value={evaluatorName}
              onChange={(e) => {
                setEvaluatorName(e.target.value);
                setError("");
              }}
              placeholder="e.g. Coach Smith"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-charcoal text-lg focus:outline-none focus:ring-2 focus:ring-flag-blue focus:border-transparent"
            />
          </div>

          {/* Division */}
          <div>
            <label className="block font-display text-sm font-semibold text-charcoal uppercase tracking-wide mb-1.5">
              Division
            </label>
            <select
              value={division}
              onChange={(e) => {
                setDivision(e.target.value);
                setError("");
              }}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-charcoal text-lg focus:outline-none focus:ring-2 focus:ring-flag-blue focus:border-transparent bg-white"
            >
              <option value="">Select division...</option>
              {DIVISIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Session ID */}
          <div>
            <label className="block font-display text-sm font-semibold text-charcoal uppercase tracking-wide mb-1.5">
              Session ID
            </label>
            <input
              type="text"
              value={sessionId}
              onChange={(e) => {
                setSessionId(e.target.value);
                setError("");
              }}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-charcoal text-lg focus:outline-none focus:ring-2 focus:ring-flag-blue focus:border-transparent"
            />
            <p className="text-gray-400 text-xs mt-1">
              Auto-generated. Share with other evaluators to group scores.
            </p>
          </div>

          {/* Error */}
          {error && (
            <p className="text-flag-red text-sm font-medium">{error}</p>
          )}

          {/* Start Button */}
          <button
            onClick={handleStart}
            className="w-full py-4 bg-flag-blue text-white font-display text-lg font-bold uppercase tracking-wider rounded-lg active:bg-flag-blue-mid transition-colors"
          >
            Start Scoring
          </button>
        </div>

        {/* Resume Session Notice */}
        <p className="text-center text-gray-400 text-sm mt-6">
          Scores auto-save. You can close and resume anytime.
        </p>
      </div>
    </div>
  );
}

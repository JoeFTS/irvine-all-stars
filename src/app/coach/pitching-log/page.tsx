"use client";

import { useState } from "react";
import { Printer, AlertTriangle } from "lucide-react";
import {
  pitchingRules,
  universalPitchingRules,
  type PitchingRule,
} from "@/content/pitching-rules";

const PITCHING_DIVISIONS = [
  { key: "Pinto Kid Pitch", label: "Pinto Kid Pitch" },
  { key: "Mustang", label: "Mustang" },
  { key: "Bronco", label: "Bronco" },
  { key: "Pony", label: "Pony" },
] as const;

const BLANK_ROWS = 12;

export default function PitchingLogPage() {
  const [selectedDivision, setSelectedDivision] = useState<string>(
    "Pinto Kid Pitch"
  );

  const rule: PitchingRule = pitchingRules[selectedDivision];

  return (
    <div className="p-6 md:p-10 max-w-4xl print-full-width print-landscape">
      {/* Screen Header */}
      <div className="no-print">
        <p className="font-display text-sm font-semibold text-flag-red uppercase tracking-[3px] mb-1">
          Coach
        </p>
        <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide mb-4">
          Tournament Pitching Log
        </h1>
        <p className="text-gray-600 mb-6">
          Track pitch counts and rest days during tournament play. Select your
          division, then print this page to bring to the ballpark.
        </p>
      </div>

      {/* Division Selector + Print Button */}
      <div className="no-print flex flex-wrap items-end gap-4 mb-8">
        <div>
          <label
            htmlFor="division-select"
            className="block text-sm font-semibold text-charcoal font-display uppercase tracking-wide mb-1"
          >
            Division
          </label>
          <select
            id="division-select"
            value={selectedDivision}
            onChange={(e) => setSelectedDivision(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-flag-blue focus:border-transparent"
          >
            {PITCHING_DIVISIONS.map((div) => (
              <option key={div.key} value={div.key}>
                {div.label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-6 py-2.5 bg-flag-blue text-white font-display font-bold uppercase tracking-wider text-sm rounded-lg hover:bg-flag-blue/90 transition-colors"
        >
          <Printer size={16} />
          Print This Page
        </button>
      </div>

      {/* ============================================================== */}
      {/* PRINT LAYOUT — all on one landscape page                        */}
      {/* ============================================================== */}

      {/* Print Header */}
      <div className="hidden print:block mb-2">
        <h1 className="text-center text-base font-bold uppercase tracking-wider">
          TOURNAMENT PITCHING RECORD — {rule.group.toUpperCase()}
        </h1>
        <p className="text-center text-[10px] text-gray-600">
          Irvine All-Stars — Max {rule.maxPitches} pitches per day
        </p>
      </div>

      {/* Top row: Rest Day Chart + Universal Rules side-by-side in print */}
      <div className="space-y-6 print:space-y-0 print:flex print:gap-4 print:mb-2">
        {/* Rest Day Chart */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden print:shadow-none print:rounded-none print:border print:border-gray-400 print:flex-1">
          <div className="px-6 py-4 border-b border-gray-100 bg-flag-blue/5 print:bg-white print:border-gray-400 print:px-3 print:py-1.5">
            <h2 className="font-display text-lg font-bold uppercase tracking-wide text-flag-blue print:text-black print:text-xs">
              Rest Day Requirements — {rule.group}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5 print:text-[9px] print:mt-0">
              Max {rule.maxPitches} pitches per day
            </p>
          </div>
          <div className="px-6 py-5 print:px-3 print:py-1">
            <table className="w-full text-sm border-collapse print:text-[9px]">
              <thead>
                <tr className="border-b-2 border-gray-200 print:border-gray-400">
                  <th className="text-left py-2 pr-4 font-display uppercase tracking-wider text-charcoal text-xs print:text-[8px] print:py-0.5">
                    Pitches Thrown
                  </th>
                  <th className="text-left py-2 font-display uppercase tracking-wider text-charcoal text-xs print:text-[8px] print:py-0.5">
                    Required Rest
                  </th>
                </tr>
              </thead>
              <tbody>
                {rule.restThresholds.map((t, i) => (
                  <tr
                    key={i}
                    className="border-b border-gray-100 print:border-gray-300"
                  >
                    <td className="py-2 pr-4 font-medium text-charcoal print:py-0.5">
                      {t.label} pitches
                    </td>
                    <td className="py-2 text-gray-700 print:py-0.5">
                      {t.days === 0
                        ? "No rest required"
                        : `${t.days} calendar day${t.days > 1 ? "s" : ""} rest`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Universal Rules */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden print:shadow-none print:rounded-none print:border print:border-gray-400 print:flex-1">
          <div className="px-6 py-4 border-b border-gray-100 bg-flag-red/5 print:bg-white print:border-gray-400 print:px-3 print:py-1.5">
            <div className="flex items-center gap-2">
              <AlertTriangle
                size={18}
                className="text-flag-red shrink-0 print:hidden"
              />
              <h2 className="font-display text-lg font-bold uppercase tracking-wide text-flag-red print:text-black print:text-xs">
                Universal Pitching Rules
              </h2>
            </div>
          </div>
          <div className="px-6 py-5 print:px-3 print:py-1">
            <ul className="space-y-2 print:space-y-0">
              {universalPitchingRules.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700 print:text-[9px] print:leading-tight print:gap-1">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-flag-red shrink-0 print:bg-black print:mt-1 print:w-1 print:h-1" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Pitching Record Table */}
      <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden print:mt-2 print:shadow-none print:rounded-none print:border print:border-gray-400">
        <div className="px-6 py-4 border-b border-gray-100 print:border-gray-400 print:px-3 print:py-1">
          <h2 className="font-display text-lg font-bold uppercase tracking-wide text-charcoal print:text-black print:text-xs">
            Pitching Record
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse print:text-[9px]">
            <thead>
              <tr className="border-b-2 border-gray-200 print:border-gray-400 bg-gray-50 print:bg-white">
                <th className="text-left py-2.5 px-3 font-display uppercase tracking-wider text-charcoal text-xs whitespace-nowrap print:border print:border-gray-400 print:text-[8px] print:py-1 print:px-1.5">
                  Date
                </th>
                <th className="text-left py-2.5 px-3 font-display uppercase tracking-wider text-charcoal text-xs whitespace-nowrap print:border print:border-gray-400 print:text-[8px] print:py-1 print:px-1.5">
                  Game / Opponent
                </th>
                <th className="text-left py-2.5 px-3 font-display uppercase tracking-wider text-charcoal text-xs whitespace-nowrap print:border print:border-gray-400 print:text-[8px] print:py-1 print:px-1.5">
                  Player Name
                </th>
                <th className="text-center py-2.5 px-3 font-display uppercase tracking-wider text-charcoal text-xs whitespace-nowrap print:border print:border-gray-400 print:text-[8px] print:py-1 print:px-1.5">
                  Jersey #
                </th>
                <th className="text-center py-2.5 px-3 font-display uppercase tracking-wider text-charcoal text-xs whitespace-nowrap print:border print:border-gray-400 print:text-[8px] print:py-1 print:px-1.5">
                  Pitches
                </th>
                <th className="text-center py-2.5 px-3 font-display uppercase tracking-wider text-charcoal text-xs whitespace-nowrap print:border print:border-gray-400 print:text-[8px] print:py-1 print:px-1.5">
                  Rest Days
                </th>
                <th className="text-center py-2.5 px-3 font-display uppercase tracking-wider text-charcoal text-xs whitespace-nowrap print:border print:border-gray-400 print:text-[8px] print:py-1 print:px-1.5">
                  Eligible Date
                </th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: BLANK_ROWS }).map((_, i) => (
                <tr
                  key={i}
                  className="border-b border-gray-100 print:border-gray-400"
                >
                  <td className="py-3 px-3 print:py-[5px] print:px-1.5 print:border print:border-gray-400">
                    &nbsp;
                  </td>
                  <td className="py-3 px-3 print:py-[5px] print:px-1.5 print:border print:border-gray-400">
                    &nbsp;
                  </td>
                  <td className="py-3 px-3 print:py-[5px] print:px-1.5 print:border print:border-gray-400">
                    &nbsp;
                  </td>
                  <td className="py-3 px-3 print:py-[5px] print:px-1.5 print:border print:border-gray-400">
                    &nbsp;
                  </td>
                  <td className="py-3 px-3 print:py-[5px] print:px-1.5 print:border print:border-gray-400">
                    &nbsp;
                  </td>
                  <td className="py-3 px-3 print:py-[5px] print:px-1.5 print:border print:border-gray-400">
                    &nbsp;
                  </td>
                  <td className="py-3 px-3 print:py-[5px] print:px-1.5 print:border print:border-gray-400">
                    &nbsp;
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Print Footer */}
      <div className="hidden print:block mt-1 text-center text-[8px] text-gray-500">
        <p>
          Irvine All-Stars — {rule.group} Division — Max {rule.maxPitches}{" "}
          pitches/day — No pitcher may pitch 3 consecutive days
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Printer, AlertTriangle, FileDown } from "lucide-react";
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

// Official PONY Baseball pitch count worksheet PDFs (two age groups)
const PONY_PITCHING_LOG_URLS: Record<string, string> = {
  "Pinto Kid Pitch":
    "https://cdn1.sportngin.com/attachments/document/8fbf-1583484/PINTO_MUSTANG_-_pony_baseball_pitch_count_worksheets.pdf",
  Mustang:
    "https://cdn1.sportngin.com/attachments/document/8fbf-1583484/PINTO_MUSTANG_-_pony_baseball_pitch_count_worksheets.pdf",
  Bronco:
    "https://cdn1.sportngin.com/attachments/document/3ffb-1583485/BRONCO_PONY_-_pony_baseball_pitch_count_worksheets.pdf",
  Pony:
    "https://cdn1.sportngin.com/attachments/document/3ffb-1583485/BRONCO_PONY_-_pony_baseball_pitch_count_worksheets.pdf",
};

/**
 * On beforeprint: walk up from #pitching-log-print-area to body,
 * hiding all sibling elements at each level and collapsing wrapper spacing.
 * On afterprint: restore everything.
 * Also injects @page { size: landscape }.
 */
function usePrintStyles() {
  useEffect(() => {
    const style = document.createElement("style");
    style.id = "pitching-log-print-style";
    style.textContent = `@page { size: landscape; margin: 0.25in; }`;
    document.head.appendChild(style);

    const hiddenSiblings: HTMLElement[] = [];
    const collapsedParents: HTMLElement[] = [];

    function beforePrint() {
      const printArea = document.getElementById("pitching-log-print-area");
      if (!printArea) return;

      let current: HTMLElement | null = printArea;
      while (current && current !== document.body) {
        const par: HTMLElement | null = current.parentElement;
        if (par) {
          const cur = current;
          Array.from(par.children).forEach((sibling) => {
            if (sibling !== cur && sibling instanceof HTMLElement) {
              sibling.dataset.printWas = sibling.style.display;
              sibling.style.display = "none";
              hiddenSiblings.push(sibling);
            }
          });
          par.dataset.printPad = par.style.padding;
          par.dataset.printMar = par.style.margin;
          par.dataset.printMinH = par.style.minHeight;
          par.style.padding = "0";
          par.style.margin = "0";
          par.style.minHeight = "0";
          collapsedParents.push(par);
        }
        current = par;
      }
    }

    function afterPrint() {
      hiddenSiblings.forEach((el) => {
        el.style.display = el.dataset.printWas ?? "";
        delete el.dataset.printWas;
      });
      hiddenSiblings.length = 0;

      collapsedParents.forEach((el) => {
        el.style.padding = el.dataset.printPad ?? "";
        el.style.margin = el.dataset.printMar ?? "";
        el.style.minHeight = el.dataset.printMinH ?? "";
        delete el.dataset.printPad;
        delete el.dataset.printMar;
        delete el.dataset.printMinH;
      });
      collapsedParents.length = 0;
    }

    window.addEventListener("beforeprint", beforePrint);
    window.addEventListener("afterprint", afterPrint);

    return () => {
      style.remove();
      window.removeEventListener("beforeprint", beforePrint);
      window.removeEventListener("afterprint", afterPrint);
    };
  }, []);
}

export default function PitchingLogPage() {
  usePrintStyles();

  const [selectedDivision, setSelectedDivision] = useState<string>(
    "Pinto Kid Pitch"
  );

  const rule: PitchingRule = pitchingRules[selectedDivision];

  return (
    <div className="p-6 md:p-10 max-w-4xl">
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
      <div className="no-print flex flex-col sm:flex-row flex-wrap items-stretch sm:items-end gap-4 mb-8">
        <div className="w-full sm:w-auto">
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
            className="w-full sm:w-auto rounded-xl border border-gray-300 px-4 py-3 sm:py-2.5 min-h-[44px] text-sm text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-flag-blue focus:border-transparent"
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
          className="flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] w-full sm:w-auto bg-flag-blue text-white font-display font-bold uppercase tracking-wider text-sm rounded-full hover:bg-flag-blue/90 transition-colors"
        >
          <Printer size={16} />
          Print This Page
        </button>

        {PONY_PITCHING_LOG_URLS[selectedDivision] && (
          <a
            href={PONY_PITCHING_LOG_URLS[selectedDivision]}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] w-full sm:w-auto bg-white text-flag-blue border-2 border-flag-blue font-display font-bold uppercase tracking-wider text-sm rounded-full hover:bg-flag-blue/5 transition-colors"
          >
            <FileDown size={16} />
            Official PONY Pitching Log
          </a>
        )}
      </div>

      {/* ============================================================== */}
      {/* PRINTABLE AREA — only this div prints                           */}
      {/* ============================================================== */}
      <div id="pitching-log-print-area">
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
        <div className="space-y-6 print:space-y-0 print:flex print:gap-3 print:mb-2">
          {/* Rest Day Chart */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden print:shadow-none print:rounded-none print:border print:border-gray-400 print:flex-1">
            <div className="px-6 py-4 border-b border-gray-100 bg-flag-blue/5 print:bg-white print:border-gray-400 print:px-2 print:py-1">
              <h2 className="font-display text-lg font-bold uppercase tracking-wide text-flag-blue print:text-black print:text-[10px]">
                Rest Day Requirements — {rule.group}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5 print:text-[8px] print:mt-0">
                Max {rule.maxPitches} pitches per day
              </p>
            </div>
            <div className="px-4 sm:px-6 py-5 print:px-2 print:py-1 overflow-x-auto">
              <table className="w-full text-sm border-collapse print:text-[8px]">
                <thead>
                  <tr className="border-b-2 border-gray-200 print:border-gray-400">
                    <th className="text-left py-2 pr-4 font-display uppercase tracking-wider text-charcoal text-xs print:text-[7px] print:py-0.5">
                      Pitches Thrown
                    </th>
                    <th className="text-left py-2 font-display uppercase tracking-wider text-charcoal text-xs print:text-[7px] print:py-0.5">
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
                        {t.label}
                      </td>
                      <td className="py-2 text-gray-700 print:py-0.5">
                        {t.days === 0
                          ? "No rest"
                          : `${t.days} day${t.days > 1 ? "s" : ""} rest`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Universal Rules */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden print:shadow-none print:rounded-none print:border print:border-gray-400 print:flex-1">
            <div className="px-6 py-4 border-b border-gray-100 bg-flag-red/5 print:bg-white print:border-gray-400 print:px-2 print:py-1">
              <div className="flex items-center gap-2">
                <AlertTriangle
                  size={18}
                  className="text-flag-red shrink-0 print:hidden"
                />
                <h2 className="font-display text-lg font-bold uppercase tracking-wide text-flag-red print:text-black print:text-[10px]">
                  Important Rules
                </h2>
              </div>
            </div>
            <div className="px-6 py-5 print:px-2 print:py-1">
              <ul className="space-y-2 print:space-y-0">
                {universalPitchingRules.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700 print:text-[8px] print:leading-tight print:gap-1">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-flag-red shrink-0 print:bg-black print:mt-0.5 print:w-1 print:h-1" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Print Footer */}
        <div className="hidden print:block mt-1 text-center text-[7px] text-gray-500">
          Irvine All-Stars — {rule.group} — Max {rule.maxPitches} pitches/day — No pitcher may pitch 3 consecutive days
        </div>
      </div>
    </div>
  );
}

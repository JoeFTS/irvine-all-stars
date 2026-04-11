"use client";

import { FileSpreadsheet, Download, Sparkles } from "lucide-react";

interface TemplateItem {
  title: string;
  description: string;
  filename: string;
  href: string;
  instructions: string;
}

const templates: TemplateItem[] = [
  {
    title: "Snack Schedule",
    description:
      "Assign snacks and drinks to families across the season so every game is covered.",
    filename: "snack-schedule.xlsx",
    href: "/templates/snack-schedule.xlsx",
    instructions:
      "Open in Excel or Google Sheets, add your family names, then share with your team via email or a shared drive.",
  },
];

const comingSoon = [
  "Team Roster Template",
  "Practice Plan Template",
  "Parent Contact Sheet",
];

export default function CornerTemplatesPage() {
  return (
    <>
      {/* ===== HERO HEADER ===== */}
      <div className="relative overflow-hidden rounded-2xl bg-flag-blue p-6 sm:p-8">
        <div
          aria-hidden
          className="absolute inset-0 text-white/[0.05] text-xl leading-[2.8rem] tracking-widest overflow-hidden pointer-events-none p-2"
        >
          {"\u2605 ".repeat(200)}
        </div>
        <div aria-hidden className="absolute top-0 left-0 w-24 h-1 bg-flag-red" />
        <div aria-hidden className="absolute top-0 left-0 w-1 h-24 bg-flag-red" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="bg-white/10 text-star-gold-bright p-3 rounded-xl border border-white/10 backdrop-blur-sm shrink-0">
            <FileSpreadsheet size={28} />
          </div>
          <div>
            <p className="font-display text-xs font-semibold text-star-gold-bright uppercase tracking-[3px] mb-1">
              &#9733; Coach&apos;s Corner
            </p>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-white uppercase tracking-wide leading-tight">
              Templates
            </h1>
            <p className="text-white/70 text-sm mt-1">
              Ready-to-use files for running your team.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {templates.map((t) => (
          <div
            key={t.filename}
            className="group relative overflow-hidden bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 hover:shadow-xl hover:shadow-flag-blue/10 transition-all duration-300"
          >
            <div
              aria-hidden
              className="absolute top-0 left-0 w-20 h-1 bg-flag-red"
            />
            <div className="flex items-start gap-4">
              <div className="bg-flag-blue/10 text-flag-blue p-3 rounded-xl shrink-0 border border-flag-blue/15">
                <FileSpreadsheet size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display text-[10px] font-semibold uppercase tracking-[2px] text-flag-red mb-0.5">
                  Excel Template
                </p>
                <p className="font-display text-xl font-bold uppercase tracking-wide text-charcoal">
                  {t.title}
                </p>
                <p className="text-sm text-gray-600 mt-2">{t.description}</p>
                <p className="text-xs text-gray-400 mt-3 italic">
                  {t.instructions}
                </p>
                <a
                  href={t.href}
                  download={t.filename}
                  className="relative mt-5 inline-flex items-center gap-2.5 bg-flag-red text-white px-6 py-3 rounded-full font-display text-sm font-semibold uppercase tracking-[1.5px] transition-all hover:bg-flag-red-dark hover:-translate-y-0.5 hover:shadow-lg hover:shadow-flag-red/30 active:scale-[0.97] min-h-[48px] overflow-hidden group/btn"
                >
                  <span
                    aria-hidden
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-star-gold-bright transition-all duration-300 group-hover/btn:w-2/3"
                  />
                  <Download size={16} className="relative" />
                  <span className="relative">Download {t.filename}</span>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="bg-gray-100 text-gray-400 p-3 rounded-lg shrink-0">
            <Sparkles size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display text-lg font-bold uppercase tracking-wide text-gray-400">
              More Templates Coming Soon
            </p>
            <p className="text-sm text-gray-500 mt-1">
              We&apos;re working on more ready-to-use files for your binder:
            </p>
            <ul className="mt-3 space-y-1.5">
              {comingSoon.map((item) => (
                <li
                  key={item}
                  className="text-sm text-gray-400 flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

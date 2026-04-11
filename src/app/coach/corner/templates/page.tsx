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
      <div className="flex items-center gap-4">
        <div className="bg-flag-blue/10 text-flag-blue p-3 rounded-2xl">
          <FileSpreadsheet size={28} />
        </div>
        <div>
          <p className="font-display text-sm font-semibold text-flag-red uppercase tracking-[3px]">
            Coach&apos;s Corner
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide">
            Templates
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Ready-to-use files for running your team.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {templates.map((t) => (
          <div
            key={t.filename}
            className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6"
          >
            <div className="flex items-start gap-4">
              <div className="bg-green-50 text-green-700 p-3 rounded-lg shrink-0">
                <FileSpreadsheet size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display text-lg font-bold uppercase tracking-wide text-charcoal">
                  {t.title}
                </p>
                <p className="text-sm text-gray-600 mt-1">{t.description}</p>
                <p className="text-xs text-gray-400 mt-3">{t.instructions}</p>
                <a
                  href={t.href}
                  download={t.filename}
                  className="mt-4 inline-flex items-center gap-2 bg-flag-blue hover:bg-flag-blue-mid text-white px-5 py-2.5 rounded-full font-display text-xs font-semibold uppercase tracking-widest transition-colors min-h-[44px]"
                >
                  <Download size={14} />
                  Download {t.filename}
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

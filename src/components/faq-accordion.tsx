"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export interface FaqItem {
  question: string;
  answer: React.ReactNode;
}

export interface FaqSection {
  title: string;
  items: FaqItem[];
}

function AccordionItem({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
        aria-expanded={open}
      >
        <span className="font-display text-base md:text-lg font-semibold uppercase tracking-wide leading-snug">
          {item.question}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`grid transition-all duration-200 ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5 text-gray-600 text-sm md:text-base leading-relaxed border-t border-gray-100 pt-4">
            {item.answer}
          </div>
        </div>
      </div>
    </div>
  );
}

export function FaqAccordion({ sections }: { sections: FaqSection[] }) {
  return (
    <div className="space-y-12">
      {sections.map((section) => (
        <div key={section.title}>
          <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide mb-5">
            {section.title}
          </h2>
          <div className="space-y-3">
            {section.items.map((item) => (
              <AccordionItem key={item.question} item={item} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

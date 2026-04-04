"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 bg-flag-blue hover:bg-flag-blue/90 text-white px-5 py-2.5 rounded-full font-display text-xs font-semibold uppercase tracking-widest transition-colors"
    >
      <Printer className="w-4 h-4" />
      Print
    </button>
  );
}

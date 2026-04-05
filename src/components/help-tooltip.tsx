"use client";

import { useState, useRef, useEffect } from "react";
import { HelpCircle } from "lucide-react";
import Link from "next/link";

interface HelpTooltipProps {
  text: string;
  guideUrl: string;
}

export function HelpTooltip({ text, guideUrl }: HelpTooltipProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleMouseDown(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [open]);

  return (
    <span ref={containerRef} className="relative inline-flex items-center ml-2">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Help"
        className="text-gray-400 hover:text-flag-blue transition-colors"
      >
        <HelpCircle size={20} />
      </button>

      {open && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-50">
          <p className="text-sm text-gray-600 mb-2">{text}</p>
          <Link
            href={guideUrl}
            onClick={() => setOpen(false)}
            className="text-flag-blue font-semibold text-sm hover:underline"
          >
            View full guide &rarr;
          </Link>
        </div>
      )}
    </span>
  );
}

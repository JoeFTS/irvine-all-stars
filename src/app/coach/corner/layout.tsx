"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

const crumbLabels: Record<string, string> = {
  tournaments: "Tournaments",
  templates: "Templates",
  fundraising: "Fundraising",
};

export default function CoachCornerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const slug = pathname.split("/").filter(Boolean).pop() ?? "";
  const currentLabel = crumbLabels[slug] ?? "Coach's Corner";

  return (
    <div className="p-6 md:p-10 space-y-6">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-xs font-display font-semibold uppercase tracking-[2px] text-gray-400"
      >
        <Link
          href="/coach"
          className="flex items-center gap-1.5 hover:text-flag-blue transition-colors"
        >
          <Home size={12} />
          Dashboard
        </Link>
        <ChevronRight size={12} className="text-gray-300" />
        <span className="text-flag-blue">Coach&apos;s Corner</span>
        <ChevronRight size={12} className="text-gray-300" />
        <span className="text-charcoal">{currentLabel}</span>
      </nav>
      {children}
    </div>
  );
}

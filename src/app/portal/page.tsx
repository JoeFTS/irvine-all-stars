import type { Metadata } from "next";
import Link from "next/link";
import { StripeDivider } from "@/components/stripe-divider";

export const metadata: Metadata = {
  title: "Parent Portal",
  description:
    "Parent Portal is coming soon. Track registration status, updates, and key All-Stars information in one place.",
};

export default function PortalPage() {
  return (
    <>
      <section className="relative bg-flag-blue pt-[98px] pb-14 md:pb-20 px-6 md:px-10 overflow-hidden">
        <div className="absolute inset-0 text-white/[0.04] text-xl leading-[2.8rem] tracking-widest overflow-hidden pointer-events-none p-4">
          {"★ ".repeat(200)}
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center pt-10 md:pt-16">
          <p className="font-display text-sm font-semibold text-star-gold-bright uppercase tracking-[3px] mb-3">
            &#9733; Parent Access
          </p>
          <h1 className="font-display text-4xl md:text-6xl font-bold text-white uppercase tracking-wide mb-4">
            Parent Portal
          </h1>
          <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            The full portal is in progress. You&apos;ll soon be able to track
            registration status, announcements, and schedules in one place.
          </p>
        </div>
      </section>

      <StripeDivider />

      <section className="bg-off-white py-16 px-6 md:px-10">
        <div className="max-w-3xl mx-auto bg-white rounded-lg border border-gray-200 p-6 md:p-8 text-center">
          <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide mb-3">
            Coming Soon
          </h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            For now, use the links below for coach applications, tryout
            registration, and league updates.
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/apply/player"
              className="bg-flag-blue hover:bg-flag-blue-mid text-white px-6 py-3 rounded font-display text-sm font-semibold uppercase tracking-widest transition-colors"
            >
              Player Registration
            </Link>
            <Link
              href="/apply/coach"
              className="bg-flag-red hover:bg-flag-red-dark text-white px-6 py-3 rounded font-display text-sm font-semibold uppercase tracking-widest transition-colors"
            >
              Coach Application
            </Link>
            <Link
              href="/updates"
              className="border-2 border-gray-200 hover:border-gray-400 text-charcoal px-6 py-3 rounded font-display text-sm font-semibold uppercase tracking-widest transition-colors"
            >
              Latest Updates
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

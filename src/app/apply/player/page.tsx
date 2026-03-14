import type { Metadata } from "next";
import { StripeDivider } from "@/components/stripe-divider";
import { PlayerRegistrationForm } from "@/components/player-registration-form";

export const metadata: Metadata = {
  title: "Register for Tryouts",
  description:
    "Register your player for Irvine Pony Baseball All-Stars tryouts. Complete the 3-step form to secure your spot.",
};

export default function ApplyPlayerPage() {
  return (
    <>
      {/* ===== HERO ===== */}
      <section className="relative bg-flag-blue pt-[98px] pb-12 md:pb-16 px-6 md:px-10 overflow-hidden">
        <div className="absolute inset-0 text-white/[0.04] text-xl leading-[2.8rem] tracking-widest overflow-hidden pointer-events-none p-4">
          {"★ ".repeat(200)}
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center pt-10 md:pt-14">
          <p className="font-display text-sm font-semibold text-star-gold-bright uppercase tracking-[3px] mb-3">
            &#9733; Step Up to the Plate
          </p>
          <h1 className="font-display text-4xl md:text-6xl font-bold text-white uppercase tracking-wide mb-4">
            Tryout Registration
          </h1>
          <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Register your player for 2026 All-Stars tryouts. Takes about 3
            minutes.
          </p>
        </div>
      </section>

      <StripeDivider />

      {/* ===== FORM ===== */}
      <section className="bg-off-white py-10 md:py-16 px-4 md:px-10">
        <div className="max-w-3xl mx-auto">
          <PlayerRegistrationForm />
        </div>
      </section>
    </>
  );
}

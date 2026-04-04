import type { Metadata } from "next";
import { StripeDivider } from "@/components/stripe-divider";
import { CoachApplicationForm } from "@/components/coach-application-form";

export const metadata: Metadata = {
  title: "Apply to Coach",
  description:
    "Submit your application to coach an Irvine Pony Baseball All-Stars team. Complete the 5-step form to be considered for the upcoming season.",
};

export default function ApplyCoachPage() {
  return (
    <>
      {/* ===== HERO ===== */}
      <section className="grain-overlay relative bg-flag-blue pt-[98px] pb-12 md:pb-16 px-6 md:px-10 overflow-hidden">
        <div className="absolute inset-0 text-white/[0.04] text-xl leading-[2.8rem] tracking-widest overflow-hidden pointer-events-none p-4">
          {"★ ".repeat(200)}
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center pt-10 md:pt-14">
          <p className="font-display text-sm font-semibold text-star-gold-bright uppercase tracking-[3px] mb-3">
            &#9733; Take the Field
          </p>
          <h1 className="font-hero text-4xl md:text-6xl font-bold text-white uppercase tracking-wide mb-4">
            Coach Application
          </h1>
          <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Complete the application below to be considered as a head coach for
            the upcoming All-Stars season.
          </p>
        </div>
      </section>

      <StripeDivider />

      {/* ===== FORM ===== */}
      <section className="bg-off-white py-10 md:py-16 px-4 md:px-10">
        <div className="max-w-3xl mx-auto">
          <CoachApplicationForm />
        </div>
      </section>
    </>
  );
}

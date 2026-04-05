"use client";

import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";
import { PlayerRegistrationForm } from "@/components/player-registration-form";
import { StripeDivider } from "@/components/stripe-divider";

export default function ApplyPlayerPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-off-white pt-16 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        {/* ===== HERO ===== */}
        <section className="grain-overlay relative bg-flag-blue pt-16 pb-12 md:pb-16 px-6 md:px-10 overflow-hidden">
          <div className="absolute inset-0 text-white/[0.04] text-xl leading-[2.8rem] tracking-widest overflow-hidden pointer-events-none p-4">
            {"★ ".repeat(200)}
          </div>
          <div className="relative z-10 max-w-4xl mx-auto text-center pt-10 md:pt-14">
            <p className="font-display text-sm font-semibold text-star-gold-bright uppercase tracking-[3px] mb-3">
              &#9733; Step Up to the Plate
            </p>
            <h1 className="font-hero text-4xl md:text-6xl font-bold text-white uppercase tracking-wide mb-4">
              Invitation Required
            </h1>
            <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Tryout registration for Irvine All-Stars is by invitation only.
            </p>
          </div>
        </section>

        <StripeDivider />

        <div className="baseball-stitch relative py-4" />

        {/* ===== CONTENT ===== */}
        <div className="bg-off-white flex items-center justify-center px-4 py-16">
          <div className="w-full max-w-md text-center">
            <div className="bg-white border border-gray-200 rounded-2xl p-8">
              <p className="text-gray-600 mb-4">
                If your child has been selected for tryouts, you will receive an email invitation with a link to create your account and register.
              </p>
              <p className="text-gray-600 mb-6">
                Already have an account?
              </p>
              <Link
                href="/auth/login"
                className="inline-block bg-flag-blue hover:bg-flag-blue-mid text-white font-display font-bold uppercase tracking-wider py-3 px-6 rounded-full transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return <PlayerRegistrationForm />;
}

"use client";

import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";
import { PlayerRegistrationForm } from "@/components/player-registration-form";
import { StripeDivider } from "@/components/stripe-divider";

export default function ApplyPlayerPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-off-white pt-[98px] flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-off-white pt-[98px]">
        <StripeDivider />
        <div className="flex items-center justify-center px-4 py-16">
          <div className="w-full max-w-md text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-star-gold-bright text-lg">&#9733;</span>
              <h1 className="font-hero text-3xl font-bold text-flag-blue uppercase tracking-wider">
                Invitation Required
              </h1>
              <span className="text-star-gold-bright text-lg">&#9733;</span>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-8">
              <p className="text-gray-600 mb-4">
                Tryout registration for Irvine All-Stars is by invitation only. If your child has been selected for tryouts, you will receive an email invitation with a link to create your account and register.
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
      </div>
    );
  }

  return <PlayerRegistrationForm />;
}

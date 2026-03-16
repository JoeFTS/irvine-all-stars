"use client";

import Link from "next/link";
import { StripeDivider } from "@/components/stripe-divider";

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-off-white pt-[98px]">
      <StripeDivider />
      <div className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-star-gold-bright text-lg">&#9733;</span>
            <h1 className="font-display text-3xl font-bold text-flag-blue uppercase tracking-wider">
              Invite Only
            </h1>
            <span className="text-star-gold-bright text-lg">&#9733;</span>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-8">
            <p className="text-gray-600 mb-4">
              Account creation for Irvine All-Stars is by invitation only.
              If you&apos;ve been selected as a coach or your player is participating
              in All-Stars, you&apos;ll receive an email invitation with a link to
              create your account.
            </p>
            <p className="text-gray-600 mb-6">
              Already have an account?
            </p>
            <Link
              href="/auth/login"
              className="inline-block bg-flag-blue hover:bg-flag-blue-mid text-white font-display font-bold uppercase tracking-wider py-3 px-6 rounded transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

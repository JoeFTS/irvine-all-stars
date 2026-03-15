"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { StripeDivider } from "@/components/stripe-divider";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus("signing-in");

    if (!supabase) {
      setError("Supabase not configured");
      setStatus("idle");
      return;
    }

    try {
      setStatus("calling signInWithPassword...");
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setStatus("idle");
        return;
      }

      setStatus("success! redirecting...");

      // Hard redirect
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect") || "/admin";
      window.location.href = redirect;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
      setStatus("idle");
    }
  }

  return (
    <div className="min-h-screen bg-off-white pt-[98px]">
      <StripeDivider />
      <div className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-star-gold-bright text-lg">&#9733;</span>
              <h1 className="font-display text-3xl font-bold text-flag-blue uppercase tracking-wider">
                Sign In
              </h1>
              <span className="text-star-gold-bright text-lg">&#9733;</span>
            </div>
            <p className="text-gray-600 text-sm">
              Access your Irvine All-Stars account
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-flag-red/10 border border-flag-red/30 text-flag-red rounded px-4 py-3 text-sm">
                  {error}
                </div>
              )}

              {/* Debug status */}
              {status !== "idle" && (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded px-4 py-3 text-sm">
                  Status: {status}
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-charcoal uppercase tracking-wide mb-1.5 font-display"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded px-4 py-3 text-charcoal focus:outline-none focus:ring-2 focus:ring-flag-blue/30 focus:border-flag-blue transition-colors"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-charcoal uppercase tracking-wide mb-1.5 font-display"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded px-4 py-3 text-charcoal focus:outline-none focus:ring-2 focus:ring-flag-blue/30 focus:border-flag-blue transition-colors"
                  placeholder="Your password"
                />
              </div>

              <button
                type="submit"
                disabled={status !== "idle"}
                className="w-full bg-flag-blue hover:bg-flag-blue-mid text-white font-display font-bold uppercase tracking-wider py-3 rounded transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {status !== "idle" ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600 text-sm">
                Don&apos;t have an account?{" "}
                <Link
                  href="/auth/signup"
                  className="text-flag-blue font-semibold hover:underline"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

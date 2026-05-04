"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { StripeDivider } from "@/components/stripe-divider";

type Status = "checking" | "ready" | "no-session" | "saving" | "saved";

export default function ResetPasswordPage() {
  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setStatus("no-session");
      return;
    }
    let resolved = false;
    const sub = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        resolved = true;
        setStatus("ready");
      }
    });
    const timer = setTimeout(async () => {
      if (resolved || !supabase) return;
      const { data } = await supabase.auth.getSession();
      setStatus(data.session ? "ready" : "no-session");
    }, 1200);
    return () => {
      clearTimeout(timer);
      sub.data.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!supabase) {
      setError("Supabase not configured");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setStatus("saving");

    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setStatus("ready");
      return;
    }

    setStatus("saved");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      const dest =
        profile?.role === "admin"
          ? "/admin"
          : profile?.role === "coach"
          ? "/coach"
          : "/portal";
      setTimeout(() => {
        window.location.href = dest;
      }, 1500);
    }
  }

  return (
    <div className="min-h-screen bg-off-white pt-16">
      <StripeDivider />
      <div className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-star-gold-bright text-lg">&#9733;</span>
              <h1 className="font-hero text-3xl font-bold text-flag-blue uppercase tracking-wider">
                Choose A New Password
              </h1>
              <span className="text-star-gold-bright text-lg">&#9733;</span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-8">
            {status === "checking" && (
              <p className="text-center text-gray-600 text-sm">Loading...</p>
            )}

            {status === "no-session" && (
              <div className="text-center space-y-4">
                <div className="bg-flag-red/10 border border-flag-red/30 text-flag-red rounded px-4 py-3 text-sm">
                  This reset link is invalid or has expired. Please request a new one.
                </div>
                <Link
                  href="/auth/forgot-password"
                  className="inline-block bg-flag-blue hover:bg-flag-blue-mid text-white font-display font-bold uppercase tracking-wider py-3 px-6 rounded-full transition-colors"
                >
                  Request new link
                </Link>
              </div>
            )}

            {status === "saved" && (
              <div className="bg-green-50 border border-green-200 text-green-800 rounded px-4 py-3 text-sm text-center">
                Password updated. Redirecting...
              </div>
            )}

            {(status === "ready" || status === "saving") && (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="bg-flag-red/10 border border-flag-red/30 text-flag-red rounded px-4 py-3 text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-charcoal uppercase tracking-wide mb-1.5 font-display"
                  >
                    New Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-charcoal focus:outline-none focus:ring-2 focus:ring-flag-blue/30 focus:border-flag-blue transition-colors"
                    placeholder="At least 8 characters"
                  />
                </div>

                <div>
                  <label
                    htmlFor="confirm"
                    className="block text-sm font-semibold text-charcoal uppercase tracking-wide mb-1.5 font-display"
                  >
                    Confirm Password
                  </label>
                  <input
                    id="confirm"
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-charcoal focus:outline-none focus:ring-2 focus:ring-flag-blue/30 focus:border-flag-blue transition-colors"
                    placeholder="Re-enter password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === "saving"}
                  className="w-full bg-flag-blue hover:bg-flag-blue-mid text-white font-display font-bold uppercase tracking-wider py-3 rounded-full transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {status === "saving" ? "Saving..." : "Save New Password"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

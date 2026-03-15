"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { StripeDivider } from "@/components/stripe-divider";

export default function LoginPage() {
  const { signIn, role } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const { error: signInError } = await signIn(email, password);
      if (signInError) {
        setError(signInError);
        setSubmitting(false);
        return;
      }

      // Use window.location for reliable redirect (avoids Next.js router issues)
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect") || "/portal";
      window.location.href = redirect;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setSubmitting(false);
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
                disabled={submitting}
                className="w-full bg-flag-blue hover:bg-flag-blue-mid text-white font-display font-bold uppercase tracking-wider py-3 rounded transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? "Signing in..." : "Sign In"}
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

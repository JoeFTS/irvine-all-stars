"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { StripeDivider } from "@/components/stripe-divider";

export default function SignUpPage() {
  const { signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);

    const { error: signUpError } = await signUp(email, password, name);
    if (signUpError) {
      setError(signUpError);
      setSubmitting(false);
      return;
    }

    setSuccess(true);
    setSubmitting(false);
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
                Create Account
              </h1>
              <span className="text-star-gold-bright text-lg">&#9733;</span>
            </div>
            <p className="text-gray-600 text-sm">
              Join the Irvine All-Stars community
            </p>
          </div>

          {/* Success State */}
          {success ? (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
              <div className="text-star-gold-bright text-4xl mb-4">&#9733;</div>
              <h2 className="font-display text-xl font-bold text-flag-blue uppercase tracking-wider mb-3">
                Check Your Email
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                We&apos;ve sent a confirmation link to{" "}
                <strong className="text-charcoal">{email}</strong>. Click the link
                in the email to activate your account.
              </p>
              <Link
                href="/auth/login"
                className="inline-block bg-flag-blue hover:bg-flag-blue-mid text-white font-display font-bold uppercase tracking-wider px-6 py-3 rounded transition-colors text-sm"
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
            /* Form Card */
            <div className="bg-white border border-gray-200 rounded-lg p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="bg-flag-red/10 border border-flag-red/30 text-flag-red rounded px-4 py-3 text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-semibold text-charcoal uppercase tracking-wide mb-1.5 font-display"
                  >
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-gray-200 rounded px-4 py-3 text-charcoal focus:outline-none focus:ring-2 focus:ring-flag-blue/30 focus:border-flag-blue transition-colors"
                    placeholder="Your full name"
                  />
                </div>

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
                    placeholder="At least 6 characters"
                  />
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-semibold text-charcoal uppercase tracking-wide mb-1.5 font-display"
                  >
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full border border-gray-200 rounded px-4 py-3 text-charcoal focus:outline-none focus:ring-2 focus:ring-flag-blue/30 focus:border-flag-blue transition-colors"
                    placeholder="Re-enter your password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-flag-red hover:bg-flag-red-dark text-white font-display font-bold uppercase tracking-wider py-3 rounded transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? "Creating account..." : "Create Account"}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-600 text-sm">
                  Already have an account?{" "}
                  <Link
                    href="/auth/login"
                    className="text-flag-blue font-semibold hover:underline"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

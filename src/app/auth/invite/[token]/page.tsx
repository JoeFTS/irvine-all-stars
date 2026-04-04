"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { StripeDivider } from "@/components/stripe-divider";

interface Invite {
  id: string;
  email: string;
  role: string;
  division: string | null;
  parent_name: string | null;
  child_first_name: string | null;
  child_last_name: string | null;
  current_team: string | null;
  token: string;
  used: boolean;
  created_at: string;
  expires_at: string;
}

type InviteState =
  | { status: "loading" }
  | { status: "invalid" }
  | { status: "used" }
  | { status: "expired" }
  | { status: "valid"; invite: Invite };

export default function InviteSignupPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [inviteState, setInviteState] = useState<InviteState>({ status: "loading" });
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [registeredChildren, setRegisteredChildren] = useState<string[]>([]);

  useEffect(() => {
    async function checkToken() {
      if (!supabase) {
        setInviteState({ status: "invalid" });
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("invites")
        .select("id, email, role, division, parent_name, child_first_name, child_last_name, current_team, token, used, created_at, expires_at")
        .eq("token", token)
        .single();

      if (fetchError || !data) {
        setInviteState({ status: "invalid" });
        return;
      }

      const invite = data as Invite;

      if (invite.used) {
        setInviteState({ status: "used" });
        return;
      }

      if (new Date(invite.expires_at) < new Date()) {
        setInviteState({ status: "expired" });
        return;
      }

      setInviteState({ status: "valid", invite });
      if (invite.parent_name) {
        setName(invite.parent_name);
      }
    }

    checkToken();
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (inviteState.status !== "valid" || !supabase) return;

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);

    try {
      // 1. Sign up with Supabase Auth
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: inviteState.invite.email,
        password,
        options: {
          data: { full_name: name },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setSubmitting(false);
        return;
      }

      const userId = signUpData.user?.id;
      if (!userId) {
        setError("Account creation failed. Please try again.");
        setSubmitting(false);
        return;
      }

      // 2. Create profile with the invite role
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: userId,
          email: inviteState.invite.email,
          full_name: name,
          role: inviteState.invite.role,
          division: inviteState.invite.division || null,
        });

      if (profileError) {
        console.error("Profile insert error:", profileError);
        // Non-blocking — profile may be created by a trigger
      }

      // 3. Mark invite as used
      await supabase
        .from("invites")
        .update({ used: true })
        .eq("token", token);

      // 4. Auto-create or link registration for the child
      const childrenNames: string[] = [];

      if (inviteState.invite.role === "parent" && inviteState.invite.child_first_name && inviteState.invite.child_last_name) {
        // Check if registration already exists (case-insensitive)
        const { data: existingReg } = await supabase
          .from("tryout_registrations")
          .select("id, secondary_parent_email")
          .ilike("player_first_name", inviteState.invite.child_first_name.trim())
          .ilike("player_last_name", inviteState.invite.child_last_name.trim())
          .maybeSingle();

        if (existingReg) {
          // Second parent — add as secondary email if not already set
          if (!existingReg.secondary_parent_email) {
            await supabase
              .from("tryout_registrations")
              .update({ secondary_parent_email: inviteState.invite.email })
              .eq("id", existingReg.id);
          }
        } else {
          // First parent — create partial registration
          const regData: Record<string, string> = {
            parent_name: name,
            parent_email: inviteState.invite.email.toLowerCase(),
            player_first_name: inviteState.invite.child_first_name.trim(),
            player_last_name: inviteState.invite.child_last_name.trim(),
            division: inviteState.invite.division || "",
            status: "registered",
          };
          if (inviteState.invite.current_team) regData.current_team = inviteState.invite.current_team;
          await supabase.from("tryout_registrations").insert(regData);
        }
        childrenNames.push(inviteState.invite.child_first_name.trim());

        // 4b. Process sibling invites for the same parent email
        const { data: siblingInvites } = await supabase
          .from("invites")
          .select("id, child_first_name, child_last_name, division, current_team, token")
          .eq("email", inviteState.invite.email)
          .eq("role", "parent")
          .eq("used", false)
          .neq("id", inviteState.invite.id);

        if (siblingInvites && siblingInvites.length > 0) {
          for (const sibling of siblingInvites) {
            if (sibling.child_first_name && sibling.child_last_name) {
              const { data: existingSiblingReg } = await supabase
                .from("tryout_registrations")
                .select("id, secondary_parent_email")
                .ilike("player_first_name", sibling.child_first_name.trim())
                .ilike("player_last_name", sibling.child_last_name.trim())
                .maybeSingle();

              if (existingSiblingReg) {
                if (!existingSiblingReg.secondary_parent_email) {
                  await supabase
                    .from("tryout_registrations")
                    .update({ secondary_parent_email: inviteState.invite.email })
                    .eq("id", existingSiblingReg.id);
                }
              } else {
                const sibRegData: Record<string, string> = {
                  parent_name: name,
                  parent_email: inviteState.invite.email.toLowerCase(),
                  player_first_name: sibling.child_first_name.trim(),
                  player_last_name: sibling.child_last_name.trim(),
                  division: sibling.division || "",
                  status: "registered",
                };
                if (sibling.current_team) sibRegData.current_team = sibling.current_team;
                await supabase.from("tryout_registrations").insert(sibRegData);
              }
              childrenNames.push(sibling.child_first_name.trim());
            }

            // Mark sibling invite as used
            await supabase
              .from("invites")
              .update({ used: true })
              .eq("id", sibling.id);
          }
        }
      }

      // 4c. If coach, also process any pending parent invites for the same email
      if (inviteState.invite.role === "coach") {
        const { data: parentInvites } = await supabase
          .from("invites")
          .select("id, child_first_name, child_last_name, division, current_team")
          .eq("email", inviteState.invite.email)
          .eq("role", "parent")
          .eq("used", false);

        if (parentInvites && parentInvites.length > 0) {
          for (const pInvite of parentInvites) {
            if (pInvite.child_first_name && pInvite.child_last_name) {
              const { data: existingReg } = await supabase
                .from("tryout_registrations")
                .select("id")
                .ilike("player_first_name", pInvite.child_first_name.trim())
                .ilike("player_last_name", pInvite.child_last_name.trim())
                .maybeSingle();

              if (!existingReg) {
                const pRegData: Record<string, string> = {
                  parent_name: name,
                  parent_email: inviteState.invite.email.toLowerCase(),
                  player_first_name: pInvite.child_first_name.trim(),
                  player_last_name: pInvite.child_last_name.trim(),
                  division: pInvite.division || "",
                  status: "registered",
                };
                if (pInvite.current_team) pRegData.current_team = pInvite.current_team;
                await supabase.from("tryout_registrations").insert(pRegData);
              }
              childrenNames.push(pInvite.child_first_name.trim());
            }
            await supabase.from("invites").update({ used: true }).eq("id", pInvite.id);
          }
        }
      }

      // 5. Success — show email confirmation message
      setRegisteredChildren(childrenNames);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      setSubmitting(false);
    }
  }

  // Loading state
  if (inviteState.status === "loading") {
    return (
      <div className="min-h-screen bg-off-white pt-[98px]">
        <StripeDivider />
        <div className="flex items-center justify-center px-4 py-16">
          <p className="text-gray-500">Verifying invite...</p>
        </div>
      </div>
    );
  }

  // Invalid token
  if (inviteState.status === "invalid") {
    return (
      <div className="min-h-screen bg-off-white pt-[98px]">
        <StripeDivider />
        <div className="flex items-center justify-center px-4 py-16">
          <div className="w-full max-w-md text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-star-gold-bright text-lg">&#9733;</span>
              <h1 className="font-hero text-3xl font-bold text-flag-blue uppercase tracking-wider">
                Invalid Link
              </h1>
              <span className="text-star-gold-bright text-lg">&#9733;</span>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-8">
              <p className="text-gray-600 mb-6">
                This invite link is not valid. Please check your email for the correct link, or contact the coordinator for a new invitation.
              </p>
              <Link
                href="/auth/login"
                className="inline-block bg-flag-blue hover:bg-flag-blue-mid text-white font-display font-bold uppercase tracking-wider py-3 px-6 rounded-full transition-colors"
              >
                Go to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Already used
  if (inviteState.status === "used") {
    return (
      <div className="min-h-screen bg-off-white pt-[98px]">
        <StripeDivider />
        <div className="flex items-center justify-center px-4 py-16">
          <div className="w-full max-w-md text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-star-gold-bright text-lg">&#9733;</span>
              <h1 className="font-hero text-3xl font-bold text-flag-blue uppercase tracking-wider">
                Already Used
              </h1>
              <span className="text-star-gold-bright text-lg">&#9733;</span>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-8">
              <p className="text-gray-600 mb-6">
                This invite has already been used. If you&apos;ve already created your account, you can sign in below.
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

  // Expired
  if (inviteState.status === "expired") {
    return (
      <div className="min-h-screen bg-off-white pt-[98px]">
        <StripeDivider />
        <div className="flex items-center justify-center px-4 py-16">
          <div className="w-full max-w-md text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-star-gold-bright text-lg">&#9733;</span>
              <h1 className="font-hero text-3xl font-bold text-flag-blue uppercase tracking-wider">
                Invite Expired
              </h1>
              <span className="text-star-gold-bright text-lg">&#9733;</span>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-8">
              <p className="text-gray-600 mb-6">
                This invite has expired. Please contact the coordinator for a new invite.
              </p>
              <Link
                href="/auth/login"
                className="inline-block bg-flag-blue hover:bg-flag-blue-mid text-white font-display font-bold uppercase tracking-wider py-3 px-6 rounded-full transition-colors"
              >
                Go to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Valid — show signup form
  return (
    <div className="min-h-screen bg-off-white pt-[98px]">
      <StripeDivider />
      <div className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-star-gold-bright text-lg">&#9733;</span>
              <h1 className="font-hero text-3xl font-bold text-flag-blue uppercase tracking-wider">
                Set Up Your Account
              </h1>
              <span className="text-star-gold-bright text-lg">&#9733;</span>
            </div>
            <p className="text-gray-600 text-sm">
              Welcome to Irvine All-Stars! Complete the form below to create your{" "}
              <span className="font-semibold capitalize">{inviteState.invite.role}</span> account.
            </p>
            {inviteState.invite.role === "coach" && inviteState.invite.division && (
              <p className="text-flag-blue text-sm font-semibold mt-2">
                You&apos;ve been invited to coach the {inviteState.invite.division} division
              </p>
            )}
            {inviteState.invite.child_first_name && (
              <p className="text-flag-blue text-sm font-semibold mt-1">
                Setting up tryout access for {inviteState.invite.child_first_name} {inviteState.invite.child_last_name}
              </p>
            )}
          </div>

          {/* Success State */}
          {success ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
              <div className="text-star-gold-bright text-4xl mb-4">&#9733;</div>
              <h2 className="font-hero text-xl font-bold text-flag-blue uppercase tracking-wider mb-3">
                Account Created!
              </h2>
              {registeredChildren.length > 0 && (
                <div className="bg-star-gold-bright/10 border border-star-gold-bright/30 rounded-2xl p-4 mb-4">
                  <p className="text-charcoal text-sm leading-relaxed">
                    {registeredChildren.length === 1 ? (
                      <>We&apos;ve set up a tryout registration for <strong>{registeredChildren[0]}</strong>.</>
                    ) : (
                      <>We&apos;ve set up tryout registrations for{" "}
                        <strong>
                          {registeredChildren.slice(0, -1).join(", ")} and {registeredChildren[registeredChildren.length - 1]}
                        </strong>.
                      </>
                    )}
                  </p>
                </div>
              )}
              <div className="bg-flag-blue/5 border border-flag-blue/20 rounded-2xl p-5 mb-4">
                <p className="text-flag-blue font-semibold text-sm mb-2">
                  Check Your Email
                </p>
                <p className="text-gray-600 text-sm leading-relaxed">
                  We&apos;ve sent a confirmation email to <strong>{inviteState.invite.email}</strong>.
                  Please click the link in that email to verify your account before signing in.
                </p>
              </div>
              <p className="text-gray-400 text-xs mb-4">
                Didn&apos;t receive it? Check your spam folder, or contact AllStars@irvinepony.com for help.
              </p>
              <Link
                href="/auth/login"
                className="inline-block bg-flag-blue hover:bg-flag-blue-mid text-white font-display font-bold uppercase tracking-wider py-3 px-6 rounded-full transition-colors text-sm"
              >
                Go to Sign In
              </Link>
            </div>
          ) : (
            /* Form Card */
            <div className="bg-white border border-gray-200 rounded-2xl p-8">
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
                    value={inviteState.invite.email}
                    disabled
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-500 bg-gray-50 cursor-not-allowed"
                  />
                </div>

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
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-charcoal focus:outline-none focus:ring-2 focus:ring-flag-blue/30 focus:border-flag-blue transition-colors"
                    placeholder="Your full name"
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
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-charcoal focus:outline-none focus:ring-2 focus:ring-flag-blue/30 focus:border-flag-blue transition-colors"
                    placeholder="At least 8 characters"
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
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-charcoal focus:outline-none focus:ring-2 focus:ring-flag-blue/30 focus:border-flag-blue transition-colors"
                    placeholder="Re-enter your password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-flag-red hover:bg-flag-red-dark text-white font-display font-bold uppercase tracking-wider py-3 rounded-full transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? "Creating account..." : "Create Account"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { StripeDivider } from "@/components/stripe-divider";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Registration {
  id: string;
  player_name: string;
  division: string;
  primary_position: string;
  status: string;
  created_at: string;
}

interface Announcement {
  id: string;
  title: string;
  body: string;
  division: string | null;
  created_at: string;
}

/* ------------------------------------------------------------------ */
/*  Status badge helper                                                */
/* ------------------------------------------------------------------ */

const statusConfig: Record<string, { label: string; classes: string }> = {
  registered: {
    label: "Registered",
    classes: "bg-flag-blue/10 text-flag-blue border-flag-blue/30",
  },
  confirmed: {
    label: "Confirmed",
    classes: "bg-green-50 text-green-700 border-green-300",
  },
  tryout_complete: {
    label: "Tryout Complete",
    classes: "bg-star-gold-bright/15 text-star-gold border-star-gold/30",
  },
  selected: {
    label: "Selected",
    classes: "bg-green-50 text-green-800 border-green-400 font-bold",
  },
  not_selected: {
    label: "Not Selected",
    classes: "bg-gray-100 text-gray-500 border-gray-300",
  },
  alternate: {
    label: "Alternate",
    classes: "bg-orange-50 text-orange-700 border-orange-300",
  },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? {
    label: status,
    classes: "bg-gray-100 text-gray-600 border-gray-200",
  };
  return (
    <span
      className={`inline-block text-xs uppercase tracking-wider px-2.5 py-1 rounded border font-display font-semibold ${cfg.classes}`}
    >
      {cfg.label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Key Dates                                                          */
/* ------------------------------------------------------------------ */

const keyDates = [
  { date: "Mar 15", label: "Coach applications open" },
  { date: "Apr 1", label: "Player registration opens" },
  { date: "May 10", label: "7U & 8U tryouts" },
  { date: "May 11", label: "9U & 10U tryouts" },
  { date: "May 12", label: "11U & 12U tryouts" },
  { date: "Mid-May", label: "Rosters finalized & families notified" },
  { date: "May 21-25", label: "Memorial Day Tournament" },
  { date: "Jun-Jul", label: "District tournaments" },
];

/* ------------------------------------------------------------------ */
/*  Quick Links                                                        */
/* ------------------------------------------------------------------ */

const quickLinks = [
  { label: "Tryout Schedule", href: "/tryouts", icon: "\u2733" },
  { label: "How Players Are Scored", href: "/tryouts#scoring", icon: "\u2605" },
  { label: "FAQ", href: "/faq", icon: "?" },
  { label: "Documents", href: "/documents", icon: "\u2193" },
  {
    label: "Contact Coordinator",
    href: "mailto:AllStars@irvinepony.com",
    icon: "\u2709",
  },
];

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function PortalPage() {
  const { user, loading: authLoading } = useAuth();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!user || !supabase) {
      setDataLoading(false);
      return;
    }

    async function fetchData() {
      setDataLoading(true);

      // Fetch registrations for this parent
      const { data: regs } = await supabase!
        .from("tryout_registrations")
        .select(
          "id, player_name, division, primary_position, status, created_at"
        )
        .eq("parent_email", user!.email ?? "")
        .order("created_at", { ascending: false });

      const regData = (regs ?? []) as Registration[];
      setRegistrations(regData);

      // Determine divisions for filtering announcements
      const playerDivisions = regData.map((r) => r.division);

      // Fetch announcements — general + player-specific divisions
      let announcementQuery = supabase!
        .from("announcements")
        .select("id, title, body, division, created_at")
        .order("created_at", { ascending: false })
        .limit(10);

      if (playerDivisions.length > 0) {
        // Show general (null division) + matching divisions
        announcementQuery = announcementQuery.or(
          `division.is.null,division.in.(${playerDivisions.join(",")})`
        );
      } else {
        // No registrations — show only general announcements
        announcementQuery = announcementQuery.is("division", null);
      }

      const { data: annData } = await announcementQuery;
      setAnnouncements((annData ?? []) as Announcement[]);

      setDataLoading(false);
    }

    fetchData();
  }, [user]);

  /* ---- Loading state ---- */
  if (authLoading) {
    return (
      <div className="min-h-screen bg-off-white pt-[98px] flex items-center justify-center">
        <p className="text-gray-400 font-display uppercase tracking-wider text-sm">
          Loading...
        </p>
      </div>
    );
  }

  /* ---- Not logged in ---- */
  if (!user) {
    return (
      <>
        <section className="relative bg-flag-blue pt-[98px] pb-14 md:pb-20 px-6 md:px-10 overflow-hidden">
          <div className="absolute inset-0 text-white/[0.04] text-xl leading-[2.8rem] tracking-widest overflow-hidden pointer-events-none p-4">
            {"★ ".repeat(200)}
          </div>
          <div className="relative z-10 max-w-4xl mx-auto text-center pt-10 md:pt-16">
            <p className="font-display text-sm font-semibold text-star-gold-bright uppercase tracking-[3px] mb-3">
              &#9733; Parent Access
            </p>
            <h1 className="font-display text-4xl md:text-6xl font-bold text-white uppercase tracking-wide mb-4">
              Parent Portal
            </h1>
            <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Sign in to track your player&apos;s tryout status, view
              announcements, and stay up to date with All-Stars.
            </p>
          </div>
        </section>

        <StripeDivider />

        <section className="bg-off-white py-16 px-6 md:px-10">
          <div className="max-w-md mx-auto bg-white rounded-lg border border-gray-200 p-6 md:p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-flag-blue/10 text-flag-blue font-display text-2xl font-bold flex items-center justify-center mx-auto mb-4">
              &#9733;
            </div>
            <h2 className="font-display text-2xl font-bold uppercase tracking-wide mb-2">
              Sign In Required
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-6">
              Log in with your parent account to view your player&apos;s
              registration status and important updates.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/auth/login"
                className="bg-flag-blue hover:bg-flag-blue-mid text-white px-6 py-3 rounded font-display text-sm font-semibold uppercase tracking-widest transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="border-2 border-gray-200 hover:border-gray-400 text-charcoal px-6 py-3 rounded font-display text-sm font-semibold uppercase tracking-widest transition-colors"
              >
                Create Account
              </Link>
            </div>
          </div>
        </section>
      </>
    );
  }

  /* ---- Logged in — dashboard ---- */
  return (
    <>
      {/* ===== HERO ===== */}
      <section className="relative bg-flag-blue pt-[98px] pb-14 md:pb-20 px-6 md:px-10 overflow-hidden">
        <div className="absolute inset-0 text-white/[0.04] text-xl leading-[2.8rem] tracking-widest overflow-hidden pointer-events-none p-4">
          {"★ ".repeat(200)}
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center pt-10 md:pt-16">
          <p className="font-display text-sm font-semibold text-star-gold-bright uppercase tracking-[3px] mb-3">
            &#9733; Parent Access
          </p>
          <h1 className="font-display text-4xl md:text-6xl font-bold text-white uppercase tracking-wide mb-4">
            Parent Portal
          </h1>
          <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Welcome back. Here&apos;s what&apos;s happening with your
            player&apos;s All-Stars journey.
          </p>
        </div>
      </section>

      <StripeDivider />

      {/* ===== MY PLAYER'S STATUS ===== */}
      <section className="bg-off-white py-12 md:py-16 px-6 md:px-10">
        <div className="max-w-4xl mx-auto">
          <p className="font-display text-sm font-semibold text-flag-red uppercase tracking-[3px] mb-2">
            &#9733; Registration
          </p>
          <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide mb-6">
            My Player&apos;s Status
          </h2>

          {dataLoading ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <p className="text-gray-400 text-sm">Loading registrations...</p>
            </div>
          ) : registrations.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <p className="text-gray-500 mb-4">
                No tryout registrations found for your account.
              </p>
              <Link
                href="/apply/player"
                className="inline-block bg-flag-red hover:bg-flag-red-dark text-white px-6 py-3 rounded font-display text-sm font-semibold uppercase tracking-widest transition-colors"
              >
                Register for Tryouts
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {registrations.map((reg) => (
                <div
                  key={reg.id}
                  className="bg-white rounded-lg border border-gray-200 p-5 md:p-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                    <h3 className="font-display text-xl font-bold uppercase tracking-wide">
                      {reg.player_name}
                    </h3>
                    <StatusBadge status={reg.status} />
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
                    <span>
                      <span className="font-semibold text-charcoal">
                        Division:
                      </span>{" "}
                      {reg.division}
                    </span>
                    <span>
                      <span className="font-semibold text-charcoal">
                        Position:
                      </span>{" "}
                      {reg.primary_position}
                    </span>
                    <span>
                      <span className="font-semibold text-charcoal">
                        Submitted:
                      </span>{" "}
                      {new Date(reg.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== ANNOUNCEMENTS ===== */}
      <section className="bg-white py-12 md:py-16 px-6 md:px-10">
        <div className="max-w-4xl mx-auto">
          <p className="font-display text-sm font-semibold text-flag-red uppercase tracking-[3px] mb-2">
            &#9733; Updates
          </p>
          <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide mb-6">
            Announcements
          </h2>

          {dataLoading ? (
            <div className="bg-off-white rounded-lg border border-gray-200 p-8 text-center">
              <p className="text-gray-400 text-sm">
                Loading announcements...
              </p>
            </div>
          ) : announcements.length === 0 ? (
            <div className="bg-off-white rounded-lg border border-gray-200 p-8 text-center">
              <p className="text-gray-500">
                No announcements yet. Check back soon.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  className="bg-off-white rounded-lg border border-gray-200 p-5 md:p-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                    <h3 className="font-display text-base font-semibold uppercase tracking-wide">
                      {ann.title}
                    </h3>
                    <div className="flex items-center gap-2 shrink-0">
                      {ann.division && (
                        <span className="text-[10px] font-display font-semibold uppercase tracking-wider bg-flag-blue/10 text-flag-blue px-2 py-0.5 rounded">
                          {ann.division}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {new Date(ann.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                    {ann.body}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== IMPORTANT LINKS ===== */}
      <section className="bg-cream py-12 md:py-16 px-6 md:px-10">
        <div className="max-w-4xl mx-auto">
          <p className="font-display text-sm font-semibold text-flag-red uppercase tracking-[3px] mb-2">
            &#9733; Resources
          </p>
          <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide mb-6">
            Important Links
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {quickLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="bg-white rounded-lg border border-gray-200 p-4 text-center hover:border-flag-blue hover:shadow-sm transition-all group"
              >
                <div className="text-2xl mb-2 text-flag-blue group-hover:text-flag-red transition-colors">
                  {link.icon}
                </div>
                <p className="font-display text-xs font-semibold uppercase tracking-wide text-charcoal leading-tight">
                  {link.label}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== KEY DATES ===== */}
      <section className="bg-off-white py-12 md:py-16 px-6 md:px-10">
        <div className="max-w-4xl mx-auto">
          <p className="font-display text-sm font-semibold text-flag-red uppercase tracking-[3px] mb-2">
            &#9733; Calendar
          </p>
          <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide mb-6">
            Key Dates
          </h2>

          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
            {keyDates.map((item, i) => (
              <div
                key={item.label}
                className="flex items-center gap-4 px-5 py-3.5"
              >
                <div
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    i % 2 === 0 ? "bg-flag-blue" : "bg-flag-red"
                  }`}
                />
                <span className="font-display text-sm font-bold uppercase tracking-wide text-flag-blue w-24 shrink-0">
                  {item.date}
                </span>
                <span className="text-sm text-gray-600">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <StripeDivider />
    </>
  );
}

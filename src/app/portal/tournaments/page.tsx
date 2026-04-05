"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trophy, Calendar, MapPin, ExternalLink, X } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { StripeDivider } from "@/components/stripe-divider";
import { HelpTooltip } from "@/components/help-tooltip";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Tournament {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  location: string;
  divisions_display: string | null;
  division_ids: string[] | null;
  registration_url: string | null;
  registration_deadline: string | null;
  host: string | null;
  description: string | null;
  flyer_url: string | null;
  status: "draft" | "published";
  created_at: string;
  updated_at: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatDateRange(start: string, end: string): string {
  const s = new Date(start + "T12:00:00");
  const e = new Date(end + "T12:00:00");
  if (s.getMonth() === e.getMonth()) {
    return `${s.toLocaleDateString("en-US", { month: "long" })} ${s.getDate()}-${e.getDate()}, ${s.getFullYear()}`;
  }
  return `${s.toLocaleDateString("en-US", { month: "long", day: "numeric" })} - ${e.toLocaleDateString("en-US", { month: "long", day: "numeric" })}, ${s.getFullYear()}`;
}

function getFlyerUrl(path: string): string {
  if (path.startsWith("/")) return path;
  if (!supabase) return "";
  const { data } = supabase.storage.from("tournament-flyers").getPublicUrl(path);
  return data.publicUrl;
}

function isRegistrationOpen(tournament: Tournament): boolean {
  if (!tournament.registration_url) return false;
  if (!tournament.registration_deadline) return true;
  return new Date(tournament.registration_deadline + "T23:59:59") >= new Date();
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ParentTournamentsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login?redirect=/portal/tournaments");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user || !supabase) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      if (!supabase || !user) return;

      // 1. Get parent's player divisions
      const { data: registrations } = await supabase
        .from("tryout_registrations")
        .select("division")
        .or(`parent_email.eq.${user.email},secondary_parent_email.eq.${user.email}`);

      if (cancelled) return;

      const playerDivisions = [
        ...new Set((registrations ?? []).map((r: { division: string }) => r.division)),
      ];

      if (playerDivisions.length === 0) {
        setLoading(false);
        return;
      }

      // 2. Fetch published tournaments overlapping any player division
      const { data: tournamentsData } = await supabase
        .from("tournaments")
        .select("*")
        .eq("status", "published")
        .overlaps("division_ids", playerDivisions)
        .order("start_date", { ascending: true });

      if (cancelled) return;
      setTournaments((tournamentsData ?? []) as Tournament[]);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Group tournaments by month
  const grouped = tournaments.reduce((acc, t) => {
    const month = new Date(t.start_date + "T12:00:00")
      .toLocaleDateString("en-US", { month: "long", year: "numeric" })
      .toUpperCase();
    if (!acc[month]) acc[month] = [];
    acc[month].push(t);
    return acc;
  }, {} as Record<string, Tournament[]>);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-off-white pt-16 flex items-center justify-center">
        <p className="text-gray-400 font-display uppercase tracking-wider text-sm">
          Loading...
        </p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      {/* Hero */}
      <section className="relative bg-flag-blue pt-16 pb-14 md:pb-20 px-6 md:px-10 overflow-hidden">
        <div className="grain-overlay" />
        <div className="relative z-10 max-w-4xl mx-auto text-center pt-10 md:pt-16">
          <p className="font-display text-sm font-semibold text-star-gold-bright uppercase tracking-[3px] mb-3">
            &#9733; Tournaments
          </p>
          <h1 className="font-display text-4xl md:text-6xl font-bold text-white uppercase tracking-wide mb-4 flex items-center justify-center">
            Tournaments
            <HelpTooltip
              text="View the tournament schedule for your player's division."
              guideUrl="/portal/help"
            />
          </h1>
          <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Upcoming tournaments for your player&apos;s division.
          </p>
        </div>
      </section>

      <StripeDivider />
      <div className="baseball-stitch" />

      {/* Content */}
      <section className="bg-off-white py-12 md:py-16 px-6 md:px-10">
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : tournaments.length === 0 ? (
            <div className="text-center py-16">
              <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-display text-lg text-charcoal">No upcoming tournaments</h3>
              <p className="text-gray-500 text-sm mt-1">
                Check back soon for tournaments in your player&apos;s division.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(grouped).map(([month, monthTournaments]) => (
                <div key={month}>
                  <h2 className="font-display text-lg tracking-wider text-charcoal uppercase mb-4">
                    {month}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {monthTournaments.map((t) => {
                      const flyerPublicUrl = t.flyer_url ? getFlyerUrl(t.flyer_url) : null;
                      const regOpen = isRegistrationOpen(t);

                      return (
                        <div
                          key={t.id}
                          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                        >
                          {/* Top: Flyer image or gradient fallback */}
                          <div
                            className="relative aspect-[16/9] cursor-pointer"
                            onClick={() => flyerPublicUrl && setLightboxUrl(flyerPublicUrl)}
                          >
                            {flyerPublicUrl ? (
                              <img
                                src={flyerPublicUrl}
                                alt={`${t.name} flyer`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-flag-blue to-flag-blue-mid flex flex-col items-center justify-center gap-2">
                                <Trophy className="w-10 h-10 text-white/40" />
                                <span className="font-display text-sm text-white/60 uppercase tracking-wide text-center px-4">
                                  {t.name}
                                </span>
                              </div>
                            )}

                            {/* Status badge */}
                            <div className="absolute top-3 right-3">
                              {regOpen ? (
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-500 text-white">
                                  Registration Open
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-400 text-amber-900">
                                  Coming Soon
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="p-5 space-y-3">
                            <h3 className="font-display text-lg text-charcoal">{t.name}</h3>

                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="w-4 h-4 text-flag-blue shrink-0" />
                              {formatDateRange(t.start_date, t.end_date)}
                            </div>

                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="w-4 h-4 text-flag-blue shrink-0" />
                              {t.location}
                            </div>

                            {t.host && (
                              <p className="text-sm text-gray-500">Hosted by {t.host}</p>
                            )}

                            {/* Division pills */}
                            {t.divisions_display && (
                              <div className="flex flex-wrap gap-1.5">
                                {t.divisions_display.split(",").map((d) => (
                                  <span
                                    key={d.trim()}
                                    className="px-2 py-0.5 rounded-full text-xs font-semibold bg-cream text-charcoal"
                                  >
                                    {d.trim()}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Register button or Coming Soon */}
                            {t.registration_url ? (
                              <a
                                href={t.registration_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full text-center bg-flag-red hover:bg-flag-red-dark text-white font-display text-sm uppercase tracking-wide py-2.5 rounded-full transition-colors"
                              >
                                Register{" "}
                                <ExternalLink className="inline w-3.5 h-3.5 -mt-0.5" />
                              </a>
                            ) : (
                              <div className="w-full text-center bg-gray-200 text-gray-500 font-display text-sm uppercase tracking-wide py-2.5 rounded-full">
                                Coming Soon
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Lightbox modal */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button className="absolute top-4 right-4 text-white">
            <X className="w-8 h-8" />
          </button>
          <img
            src={lightboxUrl}
            alt="Tournament flyer"
            className="max-w-full max-h-[90vh] rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

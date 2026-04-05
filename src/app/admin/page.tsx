"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { HelpTooltip } from "@/components/help-tooltip";

interface Stats {
  totalApplications: number;
  totalRegistrations: number;
  divisionCounts: Record<string, number>;
  recentApplications: Array<{
    id: string;
    full_name: string;
    division_preference: string;
    submitted_at: string;
  }>;
  recentRegistrations: Array<{
    id: string;
    player_first_name: string;
    player_last_name: string;
    division: string;
    created_at: string;
  }>;
  coachPickDivisions: Array<{ division: string; pickCount: number }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    async function fetchStats() {
      const [appCount, regCount, recentApps, recentRegs, allRegs, coachPicksRes] =
        await Promise.all([
          supabase!
            .from("coach_applications")
            .select("*", { count: "exact", head: true }),
          supabase!
            .from("tryout_registrations")
            .select("*", { count: "exact", head: true }),
          supabase!
            .from("coach_applications")
            .select("id, full_name, division_preference, submitted_at")
            .order("submitted_at", { ascending: false })
            .limit(5),
          supabase!
            .from("tryout_registrations")
            .select("id, player_first_name, player_last_name, division, created_at")
            .order("created_at", { ascending: false })
            .limit(5),
          supabase!
            .from("tryout_registrations")
            .select("division"),
          supabase!
            .from("coach_selections")
            .select("id, division, coach_id, registration_id"),
        ]);

      const divisionCounts: Record<string, number> = {};
      if (allRegs.data) {
        for (const row of allRegs.data) {
          const d = row.division || "Unknown";
          divisionCounts[d] = (divisionCounts[d] || 0) + 1;
        }
      }

      // Process coach picks — only show banner for divisions where selections haven't been emailed yet
      const coachPickDivisions: Array<{ division: string; pickCount: number }> = [];
      if (coachPicksRes.data && coachPicksRes.data.length > 0) {
        // Check which picked registrations have already had emails sent
        const pickedRegIds = coachPicksRes.data.map((r: { registration_id: string }) => r.registration_id);
        const { data: pickedRegs } = await supabase!
          .from("tryout_registrations")
          .select("id, division, selection_email_sent_at")
          .in("id", pickedRegIds);

        const emailedIds = new Set(
          (pickedRegs ?? [])
            .filter((r: { selection_email_sent_at: string | null }) => r.selection_email_sent_at)
            .map((r: { id: string }) => r.id)
        );

        // Only count picks where the player hasn't been emailed yet
        const unreviewedPicks = coachPicksRes.data.filter(
          (p: { registration_id: string }) => !emailedIds.has(p.registration_id)
        );

        const picksByDivision: Record<string, number> = {};
        for (const row of unreviewedPicks) {
          const d = row.division || "Unknown";
          picksByDivision[d] = (picksByDivision[d] || 0) + 1;
        }
        for (const [division, pickCount] of Object.entries(picksByDivision)) {
          coachPickDivisions.push({ division, pickCount });
        }
        coachPickDivisions.sort((a, b) => a.division.localeCompare(b.division));
      }

      setStats({
        totalApplications: appCount.count ?? 0,
        totalRegistrations: regCount.count ?? 0,
        divisionCounts,
        recentApplications: recentApps.data ?? [],
        recentRegistrations: recentRegs.data ?? [],
        coachPickDivisions,
      });
      setLoading(false);
    }

    fetchStats();
  }, []);

  if (!supabase) {
    return (
      <div className="p-6 md:p-10">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
          <p className="font-display text-xl font-bold uppercase tracking-wide text-flag-blue mb-2">
            Connect Supabase to View Data
          </p>
          <p className="text-gray-600 text-sm">
            Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in
            your environment to enable the admin dashboard.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 md:p-10">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-28 bg-gray-200 rounded-2xl" />
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  const divisionOrder = [
    "5U-Shetland",
    "6U-Shetland",
    "7U MP-Pinto",
    "7U KP-Pinto",
    "8U MP-Pinto",
    "8U KP-Pinto",
    "9U-Mustang",
    "10U-Mustang",
    "11U-Bronco",
    "12U-Bronco",
    "13U-Pony",
    "14U-Pony",
  ];

  const maxDivCount = Math.max(
    ...Object.values(stats?.divisionCounts ?? { x: 1 }),
    1
  );

  return (
    <div className="p-6 md:p-10">
      {/* Header */}
      <div className="mb-8">
        <p className="font-display text-sm font-semibold text-flag-red uppercase tracking-[3px] mb-1">
          Admin
        </p>
        <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide flex items-center">
          Dashboard
          <HelpTooltip
            text="Overview stats — coach applications, player registrations, and division breakdown."
            guideUrl="/admin/help"
          />
        </h1>
      </div>

      {/* Coach Recommendations Banner */}
      {stats?.coachPickDivisions && stats.coachPickDivisions.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-display text-sm font-bold uppercase tracking-wide text-amber-800 mb-1">
                Coach Recommendations Pending Review
              </h3>
              <p className="text-amber-700 text-sm mb-3">
                Coaches have submitted their player recommendations for the following divisions:
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                {stats.coachPickDivisions.map((d) => (
                  <span key={d.division} className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-semibold">
                    {d.division}
                    <span className="bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded-full text-xs">
                      {d.pickCount} pick{d.pickCount !== 1 ? "s" : ""}
                    </span>
                  </span>
                ))}
              </div>
              <Link
                href="/admin/tryouts"
                className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors"
              >
                Review Selections
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Link
          href="/admin/applications"
          className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow"
        >
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">
            Coach Applications
          </p>
          <p className="font-display text-4xl font-bold text-flag-blue">
            {stats?.totalApplications ?? 0}
          </p>
        </Link>

        <Link
          href="/admin/tryouts"
          className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow"
        >
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">
            Player Registrations
          </p>
          <p className="font-display text-4xl font-bold text-flag-red">
            {stats?.totalRegistrations ?? 0}
          </p>
        </Link>
      </div>

      {/* Division Breakdown */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8">
        <h2 className="font-display text-lg font-bold uppercase tracking-wide mb-5">
          Registrations by Division
        </h2>
        <div className="space-y-3">
          {divisionOrder.map((div) => {
            const count = stats?.divisionCounts[div] ?? 0;
            const pct = maxDivCount > 0 ? (count / maxDivCount) * 100 : 0;
            return (
              <div key={div}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-semibold text-charcoal">
                    {div}
                  </span>
                  <span className="text-sm text-gray-400 font-semibold">
                    {count}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div
                    className="bg-flag-blue h-2.5 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Applications */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-display text-lg font-bold uppercase tracking-wide">
              Recent Applications
            </h2>
            <Link
              href="/admin/applications"
              className="text-flag-blue text-sm font-semibold hover:underline"
            >
              View All
            </Link>
          </div>
          {stats?.recentApplications.length === 0 ? (
            <p className="text-gray-400 text-sm">No applications yet.</p>
          ) : (
            <div className="space-y-3">
              {stats?.recentApplications.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-semibold text-charcoal">
                      {app.full_name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {app.division_preference}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400">
                    {new Date(app.submitted_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Registrations */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-display text-lg font-bold uppercase tracking-wide">
              Recent Registrations
            </h2>
            <Link
              href="/admin/tryouts"
              className="text-flag-blue text-sm font-semibold hover:underline"
            >
              View All
            </Link>
          </div>
          {stats?.recentRegistrations.length === 0 ? (
            <p className="text-gray-400 text-sm">No registrations yet.</p>
          ) : (
            <div className="space-y-3">
              {stats?.recentRegistrations.map((reg) => (
                <div
                  key={reg.id}
                  className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-semibold text-charcoal">
                      {reg.player_first_name} {reg.player_last_name}
                    </p>
                    <p className="text-xs text-gray-400">{reg.division}</p>
                  </div>
                  <p className="text-xs text-gray-400">
                    {new Date(reg.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

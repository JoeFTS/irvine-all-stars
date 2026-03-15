"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { StripeDivider } from "@/components/stripe-divider";
import Link from "next/link";

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
      const [appCount, regCount, recentApps, recentRegs, allRegs] =
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
        ]);

      const divisionCounts: Record<string, number> = {};
      if (allRegs.data) {
        for (const row of allRegs.data) {
          const d = row.division || "Unknown";
          divisionCounts[d] = (divisionCounts[d] || 0) + 1;
        }
      }

      setStats({
        totalApplications: appCount.count ?? 0,
        totalRegistrations: regCount.count ?? 0,
        divisionCounts,
        recentApplications: recentApps.data ?? [],
        recentRegistrations: recentRegs.data ?? [],
      });
      setLoading(false);
    }

    fetchStats();
  }, []);

  if (!supabase) {
    return (
      <div className="p-6 md:p-10">
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
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
              <div key={i} className="h-28 bg-gray-200 rounded-lg" />
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-lg" />
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
        <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide">
          Dashboard
        </h1>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Link
          href="/admin/applications"
          className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
        >
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">
            Coach Applications
          </p>
          <p className="font-display text-4xl font-bold text-flag-blue">
            {stats?.totalApplications ?? 0}
          </p>
        </Link>

        <Link
          href="/admin/registrations"
          className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
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
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
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

      <StripeDivider />

      {/* Recent Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Recent Applications */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
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
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-display text-lg font-bold uppercase tracking-wide">
              Recent Registrations
            </h2>
            <Link
              href="/admin/registrations"
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

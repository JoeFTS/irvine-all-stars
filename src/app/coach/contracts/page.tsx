"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { HelpTooltip } from "@/components/help-tooltip";
import {
  FileText,
  ExternalLink,
  Calendar,
  Palmtree,
  Search,
} from "lucide-react";

interface Contract {
  id: string;
  registration_id: string;
  player_name: string;
  division: string;
  parent_name: string;
  parent_email: string;
  planned_vacations: string | null;
  signed_at: string;
}

interface Profile {
  division: string | null;
  role: string;
}

const DIVISIONS = [
  "All",
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
] as const;

const DIVISION_LABELS: Record<string, string> = {
  All: "All",
  "5U-Shetland": "5U",
  "6U-Shetland": "6U",
  "7U MP-Pinto": "7U MP",
  "7U KP-Pinto": "7U KP",
  "8U MP-Pinto": "8U MP",
  "8U KP-Pinto": "8U KP",
  "9U-Mustang": "9U",
  "10U-Mustang": "10U",
  "11U-Bronco": "11U",
  "12U-Bronco": "12U",
  "13U-Pony": "13U",
  "14U-Pony": "14U",
};

export default function CoachContractsPage() {
  const { user, role, loading: authLoading } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [divisionFilter, setDivisionFilter] = useState<string>("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (authLoading || !user || !supabase) return;

    async function fetchData() {
      // Get coach profile for division
      const { data: profileData } = await supabase!
        .from("profiles")
        .select("division, role")
        .eq("id", user!.id)
        .single();

      const prof = profileData as Profile | null;
      setProfile(prof);

      // Check URL for division override (admin linking from teams page)
      const params = new URLSearchParams(window.location.search);
      const divParam = params.get("division");

      // Admins can see all; coaches see their division only
      let query = supabase!
        .from("player_contracts")
        .select("id, registration_id, player_name, division, parent_name, parent_email, planned_vacations, signed_at")
        .order("signed_at", { ascending: false });

      if (divParam && prof?.role === "admin") {
        // Admin linked from teams page with specific division
        query = query.eq("division", divParam);
        setDivisionFilter(divParam);
      } else if (prof?.role !== "admin" && prof?.division) {
        // Coach: filter to their division
        query = query.eq("division", prof.division);
      }

      const { data } = await query;
      setContracts((data as Contract[]) || []);
      setLoading(false);
    }

    fetchData();
  }, [user, authLoading]);

  const isAdmin = role === "admin";

  const filtered = contracts.filter((c) => {
    const matchesDivision = divisionFilter === "All" || c.division === divisionFilter;
    const matchesSearch =
      !search ||
      c.player_name.toLowerCase().includes(search.toLowerCase()) ||
      c.parent_name.toLowerCase().includes(search.toLowerCase());
    return matchesDivision && matchesSearch;
  });

  if (loading || authLoading) {
    return (
      <div className="p-6 md:p-8">
        <p className="text-gray-400 text-sm">Loading contracts...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-charcoal flex items-center">
          Player Contracts
          <HelpTooltip
            text="Track which players have signed their participation contracts."
            guideUrl="/coach/help"
          />
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isAdmin
            ? "All signed player contracts across divisions"
            : `Signed contracts for ${profile?.division || "your division"}`}
        </p>
      </div>

      {/* Filters */}
      {isAdmin && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {DIVISIONS.map((div) => (
            <button
              key={div}
              onClick={() => setDivisionFilter(div)}
              className={`px-3 py-2 min-h-[44px] rounded-full text-xs font-semibold uppercase tracking-wide transition-colors ${
                divisionFilter === div
                  ? "bg-flag-blue text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {DIVISION_LABELS[div] || div}
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="mb-6 relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by player or parent name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-flag-blue/20 focus:border-flag-blue"
        />
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <FileText size={40} className="mx-auto text-gray-200 mb-3" />
          <p className="font-display text-sm font-semibold uppercase tracking-wider text-gray-400">
            No contracts found
          </p>
          <p className="text-xs text-gray-300 mt-1">
            {contracts.length === 0
              ? "No players have signed contracts yet."
              : "Try adjusting your search or filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
            {filtered.length} contract{filtered.length !== 1 ? "s" : ""} signed
          </p>

          {filtered.map((contract) => {
            const signedDate = new Date(contract.signed_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <div
                key={contract.id}
                className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-wrap items-center gap-3 sm:gap-4"
              >
                {/* Player Info */}
                <div className="flex-1 min-w-[200px]">
                  <h3 className="font-display text-sm font-bold uppercase tracking-wide text-charcoal">
                    {contract.player_name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-flag-blue/10 text-flag-blue">
                      {contract.division}
                    </span>
                    <span className="text-xs text-gray-400">
                      Parent: {contract.parent_name}
                    </span>
                  </div>
                </div>

                {/* Vacations indicator */}
                {contract.planned_vacations && (
                  <div className="flex items-center gap-1 text-xs text-star-gold" title={contract.planned_vacations}>
                    <Palmtree size={14} />
                    <span className="hidden sm:inline">Vacations noted</span>
                  </div>
                )}

                {/* Signed date */}
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Calendar size={14} />
                  <span>{signedDate}</span>
                </div>

                {/* View button */}
                <a
                  href={`/contract-view?id=${contract.registration_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] bg-flag-blue text-white rounded-full text-xs font-semibold uppercase tracking-wide hover:bg-flag-blue/90 transition-colors"
                >
                  <ExternalLink size={14} />
                  View
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

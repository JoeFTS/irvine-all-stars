"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { Printer, Heart, Shield, Stethoscope, FileText } from "lucide-react";

interface Player {
  id: string;
  player_first_name: string;
  player_last_name: string;
  division: string;
}

export default function CoachMedicalFormPage() {
  const { user, role, loading: authLoading } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [division, setDivision] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user || !supabase) return;

    async function fetchData() {
      // Get coach's division
      const { data: profileData } = await supabase!
        .from("profiles")
        .select("division, role")
        .eq("id", user!.id)
        .single();

      const prof = profileData as { division: string | null; role: string } | null;
      const coachDiv = prof?.division ?? null;
      setDivision(coachDiv);

      if (!coachDiv && prof?.role !== "admin") {
        setLoading(false);
        return;
      }

      // Fetch selected/alternate players and contracts in parallel
      const [regsRes, contractsRes] = await Promise.all([
        supabase!
          .from("tryout_registrations")
          .select("id, player_first_name, player_last_name, division, status")
          .in("status", ["selected", "alternate"])
          .order("player_last_name"),
        supabase!.from("player_contracts").select("registration_id"),
      ]);

      const allRegs = (regsRes.data ?? []) as (Player & { status: string })[];
      const allContracts = (contractsRes.data ?? []) as { registration_id: string }[];
      const signedIds = new Set(allContracts.map((c) => c.registration_id));

      // Filter to players in coach's division who have signed contracts
      let filtered = allRegs.filter(
        (r) => signedIds.has(r.id)
      );

      // Non-admin coaches only see their division
      if (prof?.role !== "admin") {
        filtered = filtered.filter((r) => r.division === coachDiv);
      }

      setPlayers(filtered);
      setLoading(false);
    }

    fetchData();
  }, [user, authLoading]);

  if (loading || authLoading) {
    return (
      <div className="p-6 md:p-8">
        <p className="text-gray-400 text-sm">Loading medical forms...</p>
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <div className="p-6 md:p-8 max-w-5xl">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-charcoal">
            Printable Medical Forms
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {division ? `Blank forms for ${division}` : "No division assigned"}
          </p>
        </div>
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <FileText size={40} className="mx-auto text-gray-200 mb-3" />
          <p className="font-display text-sm font-semibold uppercase tracking-wider text-gray-400">
            No players found
          </p>
          <p className="text-xs text-gray-300 mt-1">
            Players appear here after they are selected and their parent signs the contract.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      {/* Print Controls */}
      <div className="no-print p-6 md:p-8 max-w-5xl">
        <div className="mb-4">
          <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-charcoal">
            Printable Medical Forms
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Blank medical release forms for {division ?? "all divisions"} &mdash;{" "}
            {players.length} player{players.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-2.5 bg-flag-blue text-white rounded-lg text-sm font-semibold hover:bg-flag-blue/90 transition-colors"
          >
            <Printer size={16} />
            Print All Forms
          </button>
          <p className="text-xs text-gray-400">
            Each player&apos;s form will print on a separate page.
          </p>
        </div>
      </div>

      {/* Forms */}
      {players.map((player, idx) => (
        <div
          key={player.id}
          className={`max-w-[800px] mx-auto my-6 print:my-0 bg-white shadow-lg print:shadow-none ${
            idx < players.length - 1 ? "print-page-break" : ""
          }`}
        >
          {/* Header */}
          <div className="bg-flag-blue text-white px-8 py-6 print:py-5">
            <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-center">
              Irvine Pony Baseball
            </h1>
            <p className="text-center text-white/80 text-sm mt-1 tracking-wide">
              2026 All-Stars Medical Release Form
            </p>
          </div>
          <div className="h-1.5 bg-star-gold" />

          <div className="px-8 py-6 print:px-6 print:py-4">
            {/* Player Info (pre-filled) */}
            <div className="mb-6 pb-4 border-b-2 border-gray-100">
              <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    Player
                  </span>
                  <p className="font-display text-xl font-bold uppercase tracking-wide text-charcoal">
                    {player.player_first_name} {player.player_last_name}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    Division
                  </span>
                  <p className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-flag-blue/10 text-flag-blue">
                    {player.division}
                  </p>
                </div>
              </div>
            </div>

            {/* Medical Information */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Heart size={16} className="text-flag-red" />
                <h2 className="font-display text-sm font-bold uppercase tracking-wider text-flag-blue">
                  Medical Information
                </h2>
              </div>
              <div className="space-y-4">
                <BlankField label="Known Allergies" />
                <BlankField label="Current Medications" />
                <BlankField label="Medical Conditions or Physical Limitations" />
              </div>
            </div>

            {/* Insurance Information */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Shield size={16} className="text-flag-blue" />
                <h2 className="font-display text-sm font-bold uppercase tracking-wider text-flag-blue">
                  Insurance Information
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:grid-cols-2">
                <BlankField label="Insurance Provider" />
                <BlankField label="Policy Number" />
              </div>
            </div>

            {/* Physician */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Stethoscope size={16} className="text-green-600" />
                <h2 className="font-display text-sm font-bold uppercase tracking-wider text-flag-blue">
                  Physician
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:grid-cols-2">
                <BlankField label="Physician Name" />
                <BlankField label="Physician Phone" />
              </div>
            </div>

            {/* Authorization */}
            <div className="mb-6 p-4 border border-gray-300 rounded-lg">
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-charcoal mb-2">
                Emergency Treatment Authorization
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                In the event of an emergency, I authorize the coaching staff and/or
                tournament officials to seek emergency medical treatment for my child,{" "}
                <strong>
                  {player.player_first_name} {player.player_last_name}
                </strong>
                , including but not limited to first aid, CPR, ambulance transport, and
                hospital care. I understand that every effort will be made to contact me
                immediately.
              </p>
              <div className="mt-3 flex items-start gap-2">
                <span className="inline-block w-4 h-4 border-2 border-gray-400 rounded-sm shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700">
                  I authorize emergency medical treatment for my child as described above.
                </p>
              </div>
            </div>

            {/* Signature Block */}
            <div className="border-t-2 border-flag-blue pt-5">
              <div className="space-y-5">
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block mb-1">
                      Parent/Guardian Signature
                    </span>
                    <div className="border-b-2 border-gray-400 h-8" />
                  </div>
                  <div className="w-36">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block mb-1">
                      Date
                    </span>
                    <div className="border-b-2 border-gray-400 h-8" />
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block mb-1">
                    Print Name
                  </span>
                  <div className="border-b-2 border-gray-400 h-8 max-w-md" />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-4 border-t border-gray-100 text-center">
              <p className="text-[10px] text-gray-300 uppercase tracking-wider">
                Irvine Pony Baseball &middot; irvineallstars.com
              </p>
            </div>
          </div>
        </div>
      ))}

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          nav,
          aside,
          footer,
          header {
            display: none !important;
          }
          body {
            background: white !important;
            margin: 0;
            padding: 0;
          }
          * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @page {
            margin: 0.5in;
            size: letter portrait;
          }
          .print-page-break {
            page-break-after: always;
          }
        }
      `}</style>
    </div>
  );
}

function BlankField({ label }: { label: string }) {
  return (
    <div>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block mb-1">
        {label}
      </span>
      <div className="border-b-2 border-gray-400 h-6" />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { contractSections, acknowledgments } from "@/lib/contract-data";
import { CheckCircle2, Printer, Calendar, Palmtree } from "lucide-react";

interface Contract {
  id: string;
  registration_id: string;
  player_name: string;
  division: string;
  parent_name: string;
  parent_email: string;
  parent_signature: string;
  planned_vacations: string | null;
  acknowledge_eligibility: boolean;
  acknowledge_no_travel_ball: boolean;
  acknowledge_tournament_schedule: boolean;
  acknowledge_fees: boolean;
  acknowledge_practices: boolean;
  acknowledge_conduct: boolean;
  acknowledge_no_playing_guarantee: boolean;
  signed_at: string;
}

export default function ContractViewPage() {
  const { user, role, loading: authLoading } = useAuth();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setError("Please log in to view contracts.");
      setLoading(false);
      return;
    }

    async function fetchContract() {
      if (!supabase) return;

      const params = new URLSearchParams(window.location.search);
      const regId = params.get("id");

      if (!regId) {
        setError("No contract specified.");
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("player_contracts")
        .select("*")
        .eq("registration_id", regId)
        .single();

      if (fetchError || !data) {
        setError("Contract not found.");
        setLoading(false);
        return;
      }

      setContract(data as Contract);
      setLoading(false);
    }

    fetchContract();
  }, [user, authLoading]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-400 font-display uppercase tracking-wider text-sm">Loading contract...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-flag-red font-display uppercase tracking-wider text-sm">{error}</p>
      </div>
    );
  }

  if (!contract) return null;

  const signedDate = new Date(contract.signed_at).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const signedTime = new Date(contract.signed_at).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const ackBooleans = [
    contract.acknowledge_eligibility,
    contract.acknowledge_no_travel_ball,
    contract.acknowledge_tournament_schedule,
    contract.acknowledge_fees,
    contract.acknowledge_practices,
    contract.acknowledge_conduct,
    contract.acknowledge_no_playing_guarantee,
  ];

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      {/* Print Button */}
      <div className="no-print sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h1 className="font-display text-sm font-bold uppercase tracking-wider text-flag-blue">
          Player Contract
        </h1>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-flag-blue text-white rounded-lg text-sm font-semibold hover:bg-flag-blue/90 transition-colors"
        >
          <Printer size={16} />
          Print / Save as PDF
        </button>
      </div>

      {/* Contract Document */}
      <div className="max-w-[800px] mx-auto my-6 print:my-0 bg-white shadow-lg print:shadow-none">
        {/* Header */}
        <div className="bg-flag-blue text-white px-8 py-6 print:py-5">
          <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-center">
            Irvine Pony Baseball
          </h1>
          <p className="text-center text-white/80 text-sm mt-1 tracking-wide">
            2026 All-Stars Player Contract
          </p>
        </div>

        {/* Gold stripe */}
        <div className="h-1.5 bg-star-gold" />

        <div className="px-8 py-6 print:px-6 print:py-4">
          {/* Player Info */}
          <div className="mb-6 pb-4 border-b-2 border-gray-100">
            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Player</span>
                <p className="font-display text-xl font-bold uppercase tracking-wide text-charcoal">
                  {contract.player_name}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Division</span>
                <p className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-flag-blue/10 text-flag-blue">
                  {contract.division}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Parent/Guardian</span>
                <p className="text-sm font-semibold text-charcoal">{contract.parent_name}</p>
              </div>
            </div>
          </div>

          {/* Contract Sections */}
          <div className="space-y-4 mb-6">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-flag-blue">
              Terms & Conditions
            </h2>
            {contractSections.map((section, i) => (
              <div key={i}>
                <h3 className="font-display text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                  {i + 1}. {section.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">{section.body}</p>
              </div>
            ))}
          </div>

          {/* Acknowledgments */}
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg print:bg-white print:border-green-300">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-green-800 mb-3">
              Acknowledgments
            </h2>
            <div className="space-y-2">
              {acknowledgments.map((ack, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <CheckCircle2
                    size={18}
                    className={`shrink-0 mt-0.5 ${ackBooleans[i] ? "text-green-600" : "text-gray-300"}`}
                  />
                  <span className="text-sm text-gray-700">{ack}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Planned Vacations */}
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg print:bg-white">
            <div className="flex items-center gap-2 mb-2">
              <Palmtree size={16} className="text-star-gold" />
              <h2 className="font-display text-sm font-bold uppercase tracking-wider text-charcoal">
                Planned Vacations
              </h2>
            </div>
            <p className="text-sm text-gray-600">
              {contract.planned_vacations || "None specified"}
            </p>
          </div>

          {/* Signature Block */}
          <div className="border-t-2 border-flag-blue pt-5">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-flag-blue mb-4">
              Electronic Signature
            </h2>
            <div className="flex flex-wrap gap-x-12 gap-y-4">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block mb-1">
                  Parent/Guardian Signature
                </span>
                <p className="text-2xl italic text-charcoal" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                  {contract.parent_signature}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block mb-1">
                  Date Signed
                </span>
                <div className="flex items-center gap-1.5 text-sm text-charcoal">
                  <Calendar size={14} className="text-gray-400" />
                  {signedDate} at {signedTime}
                </div>
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block mb-1">
                  Email
                </span>
                <p className="text-sm text-gray-600">{contract.parent_email}</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-gray-100 text-center">
            <p className="text-[10px] text-gray-300 uppercase tracking-wider">
              Irvine Pony Baseball &middot; irvineallstars.com &middot; Contract ID: {contract.id.slice(0, 8)}
            </p>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          nav, aside, footer, header { display: none !important; }
          body { background: white !important; margin: 0; padding: 0; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { margin: 0.5in; }
        }
      `}</style>
    </div>
  );
}

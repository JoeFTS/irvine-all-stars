"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { Printer, Calendar, Heart, Shield, Stethoscope, CheckCircle2 } from "lucide-react";

interface MedicalData {
  allergies: string;
  medications: string;
  medical_conditions: string;
  insurance_provider: string;
  insurance_policy_number: string;
  physician_name: string;
  physician_phone: string;
  authorize_treatment: boolean;
  parent_signature: string;
  signed_at: string;
}

interface MedicalDoc {
  id: string;
  registration_id: string;
  player_name: string;
  division: string;
  file_name: string;
  created_at: string;
}

export default function MedicalViewPage() {
  const { user, loading: authLoading } = useAuth();
  const [doc, setDoc] = useState<MedicalDoc | null>(null);
  const [medData, setMedData] = useState<MedicalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setError("Please log in to view medical releases.");
      setLoading(false);
      return;
    }

    async function fetchData() {
      if (!supabase) return;

      const params = new URLSearchParams(window.location.search);
      const regId = params.get("id");

      if (!regId) {
        setError("No medical release specified.");
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("player_documents")
        .select("id, registration_id, player_name, division, file_name, created_at")
        .eq("registration_id", regId)
        .eq("document_type", "medical_release")
        .limit(1)
        .single();

      if (fetchError || !data) {
        setError("Medical release not found.");
        setLoading(false);
        return;
      }

      setDoc(data as MedicalDoc);

      try {
        const parsed = JSON.parse(data.file_name) as MedicalData;
        setMedData(parsed);
      } catch {
        setError("Could not parse medical release data.");
      }

      setLoading(false);
    }

    fetchData();
  }, [user, authLoading]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-400 font-display uppercase tracking-wider text-sm">Loading...</p>
      </div>
    );
  }

  if (error || !doc || !medData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-flag-red font-display uppercase tracking-wider text-sm">{error || "Not found"}</p>
      </div>
    );
  }

  const signedDate = new Date(medData.signed_at).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const signedTime = new Date(medData.signed_at).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      {/* Print Button */}
      <div className="no-print sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h1 className="font-display text-sm font-bold uppercase tracking-wider text-flag-blue">
          Medical Release
        </h1>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-flag-blue text-white rounded-lg text-sm font-semibold hover:bg-flag-blue/90 transition-colors"
        >
          <Printer size={16} />
          Print / Save as PDF
        </button>
      </div>

      {/* Document */}
      <div className="max-w-[800px] mx-auto my-6 print:my-0 bg-white shadow-lg print:shadow-none">
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
          {/* Player Info */}
          <div className="mb-6 pb-4 border-b-2 border-gray-100">
            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Player</span>
                <p className="font-display text-xl font-bold uppercase tracking-wide text-charcoal">
                  {doc.player_name}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Division</span>
                <p className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-flag-blue/10 text-flag-blue">
                  {doc.division}
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
            <div className="grid grid-cols-1 gap-3">
              <InfoRow label="Known Allergies" value={medData.allergies} />
              <InfoRow label="Current Medications" value={medData.medications} />
              <InfoRow label="Medical Conditions or Physical Limitations" value={medData.medical_conditions} />
            </div>
          </div>

          {/* Insurance */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={16} className="text-flag-blue" />
              <h2 className="font-display text-sm font-bold uppercase tracking-wider text-flag-blue">
                Insurance Information
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoRow label="Insurance Provider" value={medData.insurance_provider} />
              <InfoRow label="Policy Number" value={medData.insurance_policy_number} />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoRow label="Physician Name" value={medData.physician_name} />
              <InfoRow label="Physician Phone" value={medData.physician_phone} />
            </div>
          </div>

          {/* Authorization */}
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg print:bg-white print:border-green-300">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 size={18} className="text-green-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-green-800 mb-1">
                  Emergency Treatment Authorization
                </h3>
                <p className="text-sm text-gray-600">
                  Parent/guardian has authorized coaching staff to seek emergency medical treatment
                  for {doc.player_name} in the event that they cannot be reached.
                </p>
              </div>
            </div>
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
                  {medData.parent_signature}
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
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-gray-100 text-center">
            <p className="text-[10px] text-gray-300 uppercase tracking-wider">
              Irvine Pony Baseball &middot; irvineallstars.com &middot; Document ID: {doc.id.slice(0, 8)}
            </p>
          </div>
        </div>
      </div>

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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-gray-50 rounded-lg print:bg-white print:border print:border-gray-200">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block mb-0.5">
        {label}
      </span>
      <p className="text-sm text-charcoal">{value || "None specified"}</p>
    </div>
  );
}

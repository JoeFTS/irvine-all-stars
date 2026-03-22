"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Phone,
  Mail,
  Shield,
  ExternalLink,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Registration {
  id: string;
  player_first_name: string;
  player_last_name: string;
  division: string;
  jersey_number: string | null;
  primary_position: string;
  secondary_position: string | null;
  bats: string;
  throws: string;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
}

interface PlayerDocument {
  registration_id: string;
  document_type: string;
  file_path: string | null;
}

interface PlayerContract {
  registration_id: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function divisionShortName(division: string): string {
  return DIVISION_LABELS[division] ?? division.split("-")[0];
}

function getPlayerCompliance(
  regId: string,
  docs: PlayerDocument[],
  contracts: PlayerContract[]
) {
  const regDocs = docs.filter((d) => d.registration_id === regId);
  const hasBirthCert = regDocs.some(
    (d) => d.document_type === "birth_certificate"
  );
  const hasPhoto = regDocs.some((d) => d.document_type === "player_photo");
  const hasContract = contracts.some((c) => c.registration_id === regId);

  return {
    birthCert: hasBirthCert,
    photo: hasPhoto,
    contract: hasContract,
    ready: hasBirthCert && hasPhoto && hasContract,
  };
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "blue" | "green" | "red";
}) {
  const colors = {
    blue: "border-flag-blue/20 bg-flag-blue/5",
    green: "border-green-200 bg-green-50",
    red: "border-red-200 bg-red-50",
  };
  const valueColors = {
    blue: "text-flag-blue",
    green: "text-green-600",
    red: "text-flag-red",
  };

  return (
    <div
      className={`bg-white border rounded-lg p-4 md:p-5 ${colors[accent]}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
        {label}
      </p>
      <p className={`text-2xl md:text-3xl font-bold ${valueColors[accent]}`}>
        {value}
      </p>
    </div>
  );
}

function DivisionBadge({ division }: { division: string }) {
  return (
    <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-flag-blue/10 text-flag-blue">
      {divisionShortName(division)}
    </span>
  );
}

function DocBadge({
  label,
  ok,
  okText,
  missingText,
  onClick,
}: {
  label: string;
  ok: boolean;
  okText: string;
  missingText: string;
  onClick?: () => void;
}) {
  const badge = ok ? (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 ${
        onClick ? "cursor-pointer hover:bg-green-200 transition-colors" : ""
      }`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
    >
      <CheckCircle2 size={12} />
      {okText}
      {onClick && <ExternalLink size={10} className="ml-0.5" />}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-flag-red">
      <XCircle size={12} />
      {missingText}
    </span>
  );

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-gray-500">{label}:</span>
      {badge}
    </div>
  );
}

function MedicalBadge() {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-gray-500">Medical:</span>
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
        Pending
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Player Card                                                        */
/* ------------------------------------------------------------------ */

function PlayerCard({
  reg,
  compliance,
  docs,
}: {
  reg: Registration;
  compliance: ReturnType<typeof getPlayerCompliance>;
  docs: PlayerDocument[];
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Player Info Header */}
      <div className="p-4 md:p-5 border-b border-gray-100">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-3 min-w-0">
            <h3 className="text-base font-semibold text-charcoal truncate">
              {reg.player_first_name} {reg.player_last_name}
            </h3>
            <DivisionBadge division={reg.division} />
          </div>
          {compliance.ready ? (
            <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-green-100 text-green-700">
              <CheckCircle2 size={14} />
              Ready
            </span>
          ) : (
            <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-red-100 text-flag-red">
              <AlertTriangle size={14} />
              Incomplete
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
          {reg.jersey_number && (
            <span className="font-semibold text-charcoal">
              #{reg.jersey_number}
            </span>
          )}
          <span>{reg.primary_position}</span>
          {reg.secondary_position && reg.secondary_position !== "None" && (
            <span className="text-gray-400">/ {reg.secondary_position}</span>
          )}
          <span>
            B: {reg.bats?.charAt(0).toUpperCase()}
            {reg.bats?.slice(1)} / T:{" "}
            {reg.throws?.charAt(0).toUpperCase()}
            {reg.throws?.slice(1)}
          </span>
        </div>
      </div>

      {/* Contact Info */}
      <div className="p-4 md:p-5 grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-gray-100">
        {/* Parent Contact */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
            Parent Contact
          </p>
          <p className="text-sm font-medium text-charcoal mb-1">
            {reg.parent_name}
          </p>
          <div className="space-y-1">
            <a
              href={`mailto:${reg.parent_email}`}
              className="flex items-center gap-1.5 text-sm text-flag-blue hover:underline"
            >
              <Mail size={14} className="shrink-0" />
              <span className="truncate">{reg.parent_email}</span>
            </a>
            <a
              href={`tel:${reg.parent_phone}`}
              className="flex items-center gap-1.5 text-sm text-flag-blue hover:underline"
            >
              <Phone size={14} className="shrink-0" />
              {reg.parent_phone}
            </a>
          </div>
        </div>

        {/* Emergency Contact */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
            Emergency Contact
          </p>
          <p className="text-sm font-medium text-charcoal mb-1">
            {reg.emergency_contact_name}
          </p>
          <a
            href={`tel:${reg.emergency_contact_phone}`}
            className="flex items-center gap-1.5 text-sm text-flag-blue hover:underline"
          >
            <Phone size={14} className="shrink-0" />
            {reg.emergency_contact_phone}
          </a>
        </div>
      </div>

      {/* Document Status Row */}
      <div className="p-4 md:p-5 flex flex-wrap gap-3">
        <DocBadge
          label="Birth Cert"
          ok={compliance.birthCert}
          okText="Uploaded"
          missingText="Missing"
          onClick={compliance.birthCert ? async () => {
            const doc = docs.find(d => d.registration_id === reg.id && d.document_type === "birth_certificate");
            if (doc?.file_path && supabase) {
              const { data } = await supabase.storage.from("player-documents").createSignedUrl(doc.file_path, 300);
              if (data?.signedUrl) window.open(data.signedUrl, "_blank");
            }
          } : undefined}
        />
        <DocBadge
          label="Photo"
          ok={compliance.photo}
          okText="Uploaded"
          missingText="Missing"
          onClick={compliance.photo ? async () => {
            const doc = docs.find(d => d.registration_id === reg.id && d.document_type === "player_photo");
            if (doc?.file_path && supabase) {
              const { data } = await supabase.storage.from("player-documents").createSignedUrl(doc.file_path, 300);
              if (data?.signedUrl) window.open(data.signedUrl, "_blank");
            }
          } : undefined}
        />
        <DocBadge
          label="Contract"
          ok={compliance.contract}
          okText="Signed"
          missingText="Not Signed"
          onClick={compliance.contract ? () => {
            window.open(`/contract-view?id=${reg.id}`, "_blank");
          } : undefined}
        />
        <MedicalBadge />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function CoachRosterPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [documents, setDocuments] = useState<PlayerDocument[]>([]);
  const [contracts, setContracts] = useState<PlayerContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDivision, setSelectedDivision] = useState<string>("All");

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    fetchAll();
  }, []);

  async function fetchAll() {
    if (!supabase) return;
    setLoading(true);

    const [regsRes, docsRes, contractsRes] = await Promise.all([
      supabase
        .from("tryout_registrations")
        .select(
          "id, player_first_name, player_last_name, division, jersey_number, primary_position, secondary_position, bats, throws, parent_name, parent_email, parent_phone, emergency_contact_name, emergency_contact_phone"
        )
        .in("status", ["selected", "alternate"])
        .order("division")
        .order("player_last_name"),
      supabase
        .from("player_documents")
        .select("registration_id, document_type, file_path"),
      supabase.from("player_contracts").select("registration_id"),
    ]);

    // Only show players who have signed their contracts
    const signedRegIds = new Set(
      (contractsRes.data ?? []).map((c: any) => c.registration_id)
    );
    const allRegs = regsRes.data ?? [];
    const signedRegs = allRegs.filter((r: any) => signedRegIds.has(r.id));

    setRegistrations(signedRegs);
    if (docsRes.data) setDocuments(docsRes.data);
    if (contractsRes.data) setContracts(contractsRes.data);

    setLoading(false);
  }

  /* ---- Filtered data ---- */

  const filtered =
    selectedDivision === "All"
      ? registrations
      : registrations.filter((r) => r.division === selectedDivision);

  const complianceMap = new Map(
    registrations.map((r) => [
      r.id,
      getPlayerCompliance(r.id, documents, contracts),
    ])
  );

  const totalPlayers = registrations.length;
  const readyCount = registrations.filter(
    (r) => complianceMap.get(r.id)?.ready
  ).length;
  const needsAttentionCount = totalPlayers - readyCount;

  /* ---- Supabase not configured ---- */

  if (!supabase) {
    return (
      <div className="p-6 md:p-10">
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="font-display text-xl font-bold uppercase tracking-wide text-flag-blue mb-2">
            Connect Supabase to View Data
          </p>
          <p className="text-gray-600 text-sm">
            Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in
            your environment.
          </p>
        </div>
      </div>
    );
  }

  /* ---- Loading state ---- */

  if (loading) {
    return (
      <div className="p-6 md:p-10">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-56" />
          <div className="h-6 bg-gray-200 rounded w-80" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg" />
            ))}
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-6">
      {/* ---- Header ---- */}
      <div>
        <p className="font-display text-sm font-semibold text-flag-red uppercase tracking-[3px] mb-1">
          Coach
        </p>
        <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide">
          Team Roster
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {totalPlayers} player{totalPlayers !== 1 ? "s" : ""} on roster
        </p>
      </div>

      {/* ---- Summary Stats ---- */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <StatCard label="Total Players" value={totalPlayers} accent="blue" />
        <StatCard label="Tournament Ready" value={readyCount} accent="green" />
        <StatCard
          label="Needs Attention"
          value={needsAttentionCount}
          accent="red"
        />
      </div>

      {/* ---- Division Filter ---- */}
      <div className="flex flex-wrap gap-2">
        {DIVISIONS.map((div) => {
          const label = DIVISION_LABELS[div] ?? div;
          const active = selectedDivision === div;
          return (
            <button
              key={div}
              type="button"
              onClick={() => setSelectedDivision(div)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide border transition-colors ${
                active
                  ? "bg-flag-blue text-white border-flag-blue"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-charcoal"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* ---- Roster Cards ---- */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <Shield size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            {registrations.length === 0
              ? "No players on your roster yet. Players appear here after they are selected for a team and their parent signs the player contract."
              : `No players on roster in the ${divisionShortName(selectedDivision)} division.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((reg) => (
            <PlayerCard
              key={reg.id}
              reg={reg}
              compliance={
                complianceMap.get(reg.id) ?? {
                  birthCert: false,
                  photo: false,
                  contract: false,
                  ready: false,
                }
              }
              docs={documents}
            />
          ))}
        </div>
      )}

      {/* ---- Footer count ---- */}
      {filtered.length > 0 && (
        <p className="text-xs text-gray-400 text-center">
          Showing {filtered.length} of {totalPlayers} player
          {totalPlayers !== 1 ? "s" : ""}
          {selectedDivision !== "All" &&
            ` in ${divisionShortName(selectedDivision)}`}
        </p>
      )}
    </div>
  );
}

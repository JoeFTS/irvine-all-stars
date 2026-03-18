"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Minus,
  AlertTriangle,
  ShieldCheck,
  FileText,
  Info,
  Eye,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Registration {
  id: string;
  player_first_name: string;
  player_last_name: string;
  division: string;
  status: string;
}

interface PlayerDocument {
  id: string;
  registration_id: string;
  document_type: string;
  file_path: string | null;
}

interface PlayerContract {
  id: string;
  registration_id: string;
  parent_signature: string | null;
  signed_at: string | null;
}

type ItemStatus = "complete" | "pending" | "not_required";

interface ChecklistItem {
  label: string;
  status: ItemStatus;
  note?: string;
  viewUrl?: string | null;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Shetland & Pinto MP divisions don't require pitching logs */
function isPitchingLogRequired(division: string): boolean {
  const lower = division.toLowerCase();
  return !(
    lower.includes("shetland") ||
    (lower.includes("pinto") && lower.includes("mp"))
  );
}

function divisionShortName(division: string): string {
  return division.split("-")[0];
}

function buildPlayerChecklist(
  reg: Registration,
  docs: PlayerDocument[],
  contracts: PlayerContract[]
): ChecklistItem[] {
  const regDocs = docs.filter((d) => d.registration_id === reg.id);
  const hasAccepted = regDocs.some((d) => d.document_type === "selection_acceptance");
  const birthCertDoc = regDocs.find(
    (d) => d.document_type === "birth_certificate"
  );
  const photoDoc = regDocs.find((d) => d.document_type === "player_photo");
  const medicalDoc = regDocs.find((d) => d.document_type === "medical_release");
  const contract = contracts.find((c) => c.registration_id === reg.id);
  const pitchingRequired = isPitchingLogRequired(reg.division);

  return [
    {
      label: "Selection Accepted",
      status: hasAccepted ? "complete" : "pending",
      note: hasAccepted ? "Accepted" : "Awaiting parent acceptance",
    },
    {
      label: "Player Contract",
      status: contract ? "complete" : "pending",
      note: contract
        ? `Signed${contract.signed_at ? ` ${new Date(contract.signed_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""}`
        : "Pending",
    },
    {
      label: "Birth Certificate",
      status: birthCertDoc ? "complete" : "pending",
      note: birthCertDoc ? "Uploaded" : "Pending",
      viewUrl: birthCertDoc?.file_path ?? null,
    },
    {
      label: "Player Photo",
      status: photoDoc ? "complete" : "pending",
      note: photoDoc ? "Uploaded" : "Pending",
      viewUrl: photoDoc?.file_path ?? null,
    },
    {
      label: "Medical Release",
      status: medicalDoc ? "complete" : "pending",
      note: medicalDoc ? "Completed" : "Pending — parent completes in portal",
    },
    {
      label: "Pitching Log",
      status: pitchingRequired ? "pending" : "not_required",
      note: pitchingRequired ? "Pending" : "Not Required",
    },
  ];
}

/* ------------------------------------------------------------------ */
/*  Status Icon                                                        */
/* ------------------------------------------------------------------ */

function StatusIcon({ status }: { status: ItemStatus }) {
  switch (status) {
    case "complete":
      return <CheckCircle2 size={18} className="text-green-600 shrink-0" />;
    case "pending":
      return <XCircle size={18} className="text-flag-red shrink-0" />;
    case "not_required":
      return <Minus size={18} className="text-gray-400 shrink-0" />;
  }
}

function statusBg(status: ItemStatus): string {
  switch (status) {
    case "complete":
      return "bg-green-50";
    case "pending":
      return "bg-red-50";
    case "not_required":
      return "bg-gray-50";
  }
}

function statusBadgeClasses(status: ItemStatus): string {
  switch (status) {
    case "complete":
      return "bg-green-100 text-green-700";
    case "pending":
      return "bg-red-100 text-flag-red";
    case "not_required":
      return "bg-gray-100 text-gray-500";
  }
}

/* ------------------------------------------------------------------ */
/*  Division Badge                                                     */
/* ------------------------------------------------------------------ */

function DivisionBadge({ division }: { division: string }) {
  return (
    <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-flag-blue/10 text-flag-blue">
      {divisionShortName(division)}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function BinderChecklistPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [documents, setDocuments] = useState<PlayerDocument[]>([]);
  const [contracts, setContracts] = useState<PlayerContract[]>([]);
  const [loading, setLoading] = useState(true);

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
        .select("id, player_first_name, player_last_name, division, status")
        .in("status", ["selected", "alternate"])
        .order("division")
        .order("player_last_name"),
      supabase
        .from("player_documents")
        .select("id, registration_id, document_type, file_path"),
      supabase
        .from("player_contracts")
        .select("id, registration_id, parent_signature, signed_at"),
    ]);

    if (regsRes.data) setRegistrations(regsRes.data);
    if (docsRes.data) setDocuments(docsRes.data);
    if (contractsRes.data) setContracts(contractsRes.data);

    setLoading(false);
  }

  async function handleViewDocument(filePath: string) {
    if (!supabase || !filePath) return;
    const { data } = await supabase.storage
      .from("player-documents")
      .createSignedUrl(filePath, 300);
    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Compute overall progress                                         */
  /* ---------------------------------------------------------------- */

  const allChecklists = registrations.map((reg) =>
    buildPlayerChecklist(reg, documents, contracts)
  );
  const totalItems = allChecklists.reduce(
    (sum, items) => sum + items.filter((i) => i.status !== "not_required").length,
    0
  );
  const completedItems = allChecklists.reduce(
    (sum, items) => sum + items.filter((i) => i.status === "complete").length,
    0
  );
  const progressPct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  /* ---------------------------------------------------------------- */
  /*  Empty / loading states                                           */
  /* ---------------------------------------------------------------- */

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

  if (loading) {
    return (
      <div className="p-6 md:p-10">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-56" />
          <div className="h-6 bg-gray-200 rounded w-80" />
          <div className="h-4 bg-gray-200 rounded w-full max-w-md" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-8">
      {/* ---- Header ---- */}
      <div>
        <p className="font-display text-sm font-semibold text-flag-red uppercase tracking-[3px] mb-1">
          Coach
        </p>
        <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide">
          Binder Checklist
        </h1>
        <p className="text-gray-500 text-sm mt-1 max-w-xl">
          Everything needed for your tournament binder. Green means ready, red
          means action needed. Only selected and alternate players are shown.
        </p>
      </div>

      {/* ---- Overall Progress ---- */}
      {registrations.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-charcoal">
              Overall Progress
            </p>
            <p className="text-sm font-semibold text-charcoal">
              {completedItems} of {totalItems} items complete
            </p>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progressPct}%`,
                backgroundColor:
                  progressPct === 100
                    ? "#16a34a"
                    : progressPct >= 50
                    ? "#ca8a04"
                    : "#dc2626",
              }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">{progressPct}% complete</p>
        </div>
      )}

      {/* ---- Team-Level Requirements ---- */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck size={20} className="text-flag-blue" />
          <h2 className="font-display text-lg font-bold uppercase tracking-wider">
            Team Requirements
          </h2>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
            <Clock size={18} className="text-amber-500 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-charcoal">
                League Insurance Certificate
              </p>
              <p className="text-xs text-gray-400">
                Provided by the league — informational
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-amber-100 text-amber-700">
              Pending
            </span>
          </div>

          <Link
            href="/coach/certifications"
            className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <Clock size={18} className="text-amber-500 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-charcoal">
                Concussion Protocol Certificate
              </p>
              <p className="text-xs text-gray-400">
                View in Certifications &rarr;
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-amber-100 text-amber-700">
              Check
            </span>
          </Link>

          <Link
            href="/coach/certifications"
            className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <Clock size={18} className="text-amber-500 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-charcoal">
                Sudden Cardiac Arrest Prevention Certificate
              </p>
              <p className="text-xs text-gray-400">
                View in Certifications &rarr;
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-amber-100 text-amber-700">
              Check
            </span>
          </Link>
        </div>

        <p className="text-xs text-gray-400 italic">
          At least ONE coaching staff member must have BOTH certificates before
          the binder can be signed off.
        </p>
      </div>

      {/* ---- Affidavit Instructions ---- */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="border-l-4 border-flag-blue p-5 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-flag-blue shrink-0" />
            <h2 className="font-display text-lg font-bold uppercase tracking-wider">
              Affidavit Instructions
            </h2>
          </div>
          <div className="space-y-2 text-sm text-charcoal">
            <p className="font-semibold text-flag-red">
              COMPLETE NAME ON BIRTH CERTIFICATE MUST BE THE SAME AS AFFIDAVIT.
              Do NOT leave out any middle names, Jr, III, etc.
            </p>
            <p>
              <span className="font-semibold">Medical Release</span> &mdash; All
              Parents MUST complete the medical release form in their Parent
              Portal.
            </p>
            <p>
              You will receive an email with how to complete your Affidavit
              online.
            </p>
          </div>
        </div>
      </div>

      {/* ---- Per-Player Checklists ---- */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <FileText size={20} className="text-flag-blue" />
          <h2 className="font-display text-lg font-bold uppercase tracking-wider">
            Player Documents
          </h2>
          <span className="text-xs text-gray-400 ml-1">
            ({registrations.length} player
            {registrations.length !== 1 ? "s" : ""})
          </span>
        </div>

        {registrations.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-400 text-sm">
              No selected or alternate players found. Players appear here after
              being selected for the team.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {registrations.map((reg) => {
              const items = buildPlayerChecklist(reg, documents, contracts);
              const playerComplete = items.filter(
                (i) => i.status === "complete"
              ).length;
              const playerRequired = items.filter(
                (i) => i.status !== "not_required"
              ).length;
              const allDone = playerComplete === playerRequired;

              return (
                <div
                  key={reg.id}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden"
                >
                  {/* Player header */}
                  <div className="p-4 md:p-5 flex items-center justify-between gap-3 border-b border-gray-100">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          allDone
                            ? "bg-green-100 text-green-600"
                            : "bg-red-100 text-flag-red"
                        }`}
                      >
                        {allDone ? (
                          <CheckCircle2 size={18} />
                        ) : (
                          <XCircle size={18} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-charcoal truncate">
                          {reg.player_first_name} {reg.player_last_name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {playerComplete} of {playerRequired} complete
                        </p>
                      </div>
                    </div>
                    <DivisionBadge division={reg.division} />
                  </div>

                  {/* Checklist items */}
                  <div className="divide-y divide-gray-100">
                    {items.map((item) => (
                      <div
                        key={item.label}
                        className={`flex items-center gap-3 px-4 py-3 md:px-5 ${statusBg(
                          item.status
                        )}`}
                      >
                        <StatusIcon status={item.status} />
                        <span className="flex-1 text-sm text-charcoal">
                          {item.label}
                        </span>
                        <div className="flex items-center gap-2">
                          {item.viewUrl && item.status === "complete" && (
                            <button
                              onClick={() => handleViewDocument(item.viewUrl!)}
                              className="flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold text-flag-blue hover:bg-flag-blue/10 transition-colors"
                            >
                              <Eye size={14} />
                              View
                            </button>
                          )}
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${statusBadgeClasses(
                              item.status
                            )}`}
                          >
                            {item.note}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ---- Footer Note ---- */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 border border-gray-200">
        <Info size={18} className="text-gray-400 shrink-0 mt-0.5" />
        <p className="text-xs text-gray-500">
          Parents upload documents through their{" "}
          <Link href="/portal" className="text-flag-blue underline">
            Parent Portal
          </Link>
          . Contact them directly if items are missing.
        </p>
      </div>
    </div>
  );
}

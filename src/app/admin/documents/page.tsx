"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import {
  FileText,
  Image as ImageIcon,
  Download,
  Eye,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  ShieldCheck,
} from "lucide-react";
import FileUpload from "@/components/file-upload";

/* ---------- Types ---------- */

interface Registration {
  id: string;
  player_first_name: string;
  player_last_name: string;
  division: string;
  parent_name: string;
  parent_email: string;
  status: string;
}

interface PlayerDocument {
  id: string;
  registration_id: string;
  player_name: string;
  division: string;
  document_type: string;
  file_path: string;
  file_name: string;
  status: string;
  uploaded_by: string;
  created_at: string;
}

interface PlayerContract {
  registration_id: string;
}

interface TeamDocument {
  id: string;
  document_type: string;
  file_path: string;
  file_name: string;
  created_at: string;
}

const DIVISIONS = [
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

function docTypeLabel(type: string): string {
  switch (type) {
    case "birth_certificate":
      return "Birth Certificate";
    case "player_photo":
      return "Player Photo";
    default:
      return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

function statusBadge(status: string) {
  switch (status) {
    case "approved":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-green-100 text-green-700">
          <CheckCircle2 size={10} />
          Approved
        </span>
      );
    case "rejected":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-red-100 text-flag-red">
          <AlertCircle size={10} />
          Rejected
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-amber-100 text-amber-700">
          <Clock size={10} />
          Pending
        </span>
      );
  }
}

export default function AdminDocumentsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [documents, setDocuments] = useState<PlayerDocument[]>([]);
  const [contracts, setContracts] = useState<PlayerContract[]>([]);
  const [teamDocs, setTeamDocs] = useState<TeamDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [divisionFilter, setDivisionFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedPlayers, setExpandedPlayers] = useState<Set<string>>(
    new Set()
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string>("");

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    fetchData();
  }, []);

  async function fetchData() {
    if (!supabase) return;
    setLoading(true);

    const [regsRes, docsRes, contractsRes, teamDocsRes] = await Promise.all([
      supabase
        .from("tryout_registrations")
        .select(
          "id, player_first_name, player_last_name, division, parent_name, parent_email, status"
        )
        .in("status", ["selected", "confirmed", "tryout_complete", "alternate"])
        .order("division")
        .order("player_last_name"),
      supabase
        .from("player_documents")
        .select(
          "id, registration_id, player_name, division, document_type, file_path, file_name, status, uploaded_by, created_at"
        )
        .order("created_at", { ascending: false }),
      supabase.from("player_contracts").select("registration_id"),
      supabase
        .from("team_documents")
        .select("id, document_type, file_path, file_name, created_at"),
    ]);

    if (regsRes.data) setRegistrations(regsRes.data);
    if (docsRes.data) setDocuments(docsRes.data);
    if (contractsRes.data) setContracts(contractsRes.data);
    if (teamDocsRes.data) setTeamDocs(teamDocsRes.data);
    setLoading(false);
  }

  async function updateDocStatus(docId: string, newStatus: string) {
    if (!supabase) return;
    const { error } = await supabase
      .from("player_documents")
      .update({ status: newStatus })
      .eq("id", docId);

    if (error) {
      alert(`Failed to update document status: ${error.message}`);
    } else {
      setDocuments((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, status: newStatus } : d))
      );
    }
  }

  async function handleView(filePath: string, fileName: string) {
    if (!supabase) return;
    const { data } = await supabase.storage
      .from("player-documents")
      .createSignedUrl(filePath, 300);

    if (data?.signedUrl) {
      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
      if (isImage) {
        setPreviewUrl(data.signedUrl);
        setPreviewName(fileName);
      } else {
        window.open(data.signedUrl, "_blank");
      }
    }
  }

  async function handleDownload(filePath: string, fileName: string) {
    if (!supabase) return;
    const { data } = await supabase.storage
      .from("player-documents")
      .createSignedUrl(filePath, 300);

    if (data?.signedUrl) {
      const a = document.createElement("a");
      a.href = data.signedUrl;
      a.download = fileName;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }

  async function handleTeamDocUpload(
    documentType: string,
    filePath: string,
    fileName: string
  ) {
    if (!supabase) return;

    const userId = (await supabase.auth.getUser()).data.user?.id;

    // Delete existing document of this type (upsert pattern)
    const existing = teamDocs.find((d) => d.document_type === documentType);
    if (existing) {
      await supabase.from("team_documents").delete().eq("id", existing.id);
      // Also remove old file from storage
      await supabase.storage
        .from("player-documents")
        .remove([existing.file_path]);
    }

    const { data, error } = await supabase
      .from("team_documents")
      .insert({
        document_type: documentType,
        file_path: filePath,
        file_name: fileName,
        uploaded_by: userId,
      })
      .select("id, document_type, file_path, file_name, created_at")
      .single();

    if (!error && data) {
      setTeamDocs((prev) => [
        ...prev.filter((d) => d.document_type !== documentType),
        data,
      ]);
    }
  }

  async function handleViewTeamDoc(filePath: string, fileName: string) {
    if (!supabase) return;
    const { data } = await supabase.storage
      .from("player-documents")
      .createSignedUrl(filePath, 300);

    if (data?.signedUrl) {
      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
      if (isImage) {
        setPreviewUrl(data.signedUrl);
        setPreviewName(fileName);
      } else {
        window.open(data.signedUrl, "_blank");
      }
    }
  }

  function togglePlayer(regId: string) {
    setExpandedPlayers((prev) => {
      const next = new Set(prev);
      if (next.has(regId)) next.delete(regId);
      else next.add(regId);
      return next;
    });
  }

  const contractSet = useMemo(
    () => new Set(contracts.map((c) => c.registration_id)),
    [contracts]
  );

  const filtered = useMemo(() => {
    return registrations.filter((r) => {
      if (divisionFilter !== "all" && r.division !== divisionFilter)
        return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const fullName =
          `${r.player_first_name} ${r.player_last_name}`.toLowerCase();
        if (!fullName.includes(q) && !r.parent_name.toLowerCase().includes(q))
          return false;
      }
      return true;
    });
  }, [registrations, divisionFilter, searchQuery]);

  // Stats
  const totalPlayers = registrations.length;
  const playersWithBirthCert = new Set(
    documents
      .filter((d) => d.document_type === "birth_certificate")
      .map((d) => d.registration_id)
  ).size;
  const playersWithPhoto = new Set(
    documents
      .filter((d) => d.document_type === "player_photo")
      .map((d) => d.registration_id)
  ).size;
  const playersWithContract = contractSet.size;

  if (!supabase) {
    return (
      <div className="p-6 md:p-10">
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="font-display text-xl font-bold uppercase tracking-wide text-flag-blue mb-2">
            Connect Supabase to View Data
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg" />
            ))}
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10">
      {/* Header */}
      <div className="mb-6">
        <p className="font-display text-sm font-semibold text-flag-red uppercase tracking-[3px] mb-1">
          Admin
        </p>
        <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide">
          Player Documents
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          View and manage uploaded documents for all selected players.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-flag-blue font-display">
            {totalPlayers}
          </p>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
            Selected Players
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-charcoal font-display">
            {playersWithContract}
            <span className="text-sm text-gray-400 font-normal">
              /{totalPlayers}
            </span>
          </p>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
            Contracts
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-charcoal font-display">
            {playersWithBirthCert}
            <span className="text-sm text-gray-400 font-normal">
              /{totalPlayers}
            </span>
          </p>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
            Birth Certs
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-charcoal font-display">
            {playersWithPhoto}
            <span className="text-sm text-gray-400 font-normal">
              /{totalPlayers}
            </span>
          </p>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
            Photos
          </p>
        </div>
      </div>

      {/* Shared Team Documents */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck size={20} className="text-flag-blue" />
          <h2 className="font-display text-lg font-bold uppercase tracking-wide text-charcoal">
            Shared Team Documents
          </h2>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          Upload documents shared with all coaching staff
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(
            [
              {
                type: "insurance_certificate",
                label: "Certificate of Liability Insurance",
              },
              {
                type: "tournament_rules",
                label: "Pre-Tournament Rules / Coach's Agreement",
              },
            ] as const
          ).map(({ type, label }) => {
            const doc = teamDocs.find((d) => d.document_type === type);

            return (
              <div
                key={type}
                className="border border-gray-200 rounded-lg p-4"
              >
                <p className="text-sm font-semibold text-charcoal mb-2">
                  {label}
                </p>
                {doc ? (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 truncate">
                        {doc.file_name}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        Uploaded{" "}
                        {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        handleViewTeamDoc(doc.file_path, doc.file_name)
                      }
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-flag-blue bg-flag-blue/5 hover:bg-flag-blue/10 transition-colors"
                    >
                      View
                    </button>
                    <FileUpload
                      bucket="player-documents"
                      folder={`team-docs/${type}`}
                      accept="image/*,.pdf"
                      maxSizeMB={10}
                      label="Replace"
                      onUploadComplete={(filePath, fileName) =>
                        handleTeamDocUpload(type, filePath, fileName)
                      }
                    />
                  </div>
                ) : (
                  <FileUpload
                    bucket="player-documents"
                    folder={`team-docs/${type}`}
                    accept="image/*,.pdf"
                    maxSizeMB={10}
                    label="Upload"
                    description="PDF or image, max 10 MB"
                    onUploadComplete={(filePath, fileName) =>
                      handleTeamDocUpload(type, filePath, fileName)
                    }
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search players..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm text-charcoal placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-flag-blue/30"
          />
        </div>

        {/* Division filter */}
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-1">
            Division:
          </span>
          <button
            onClick={() => setDivisionFilter("all")}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide transition-colors ${
              divisionFilter === "all"
                ? "bg-flag-blue text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          {DIVISIONS.map((div) => (
            <button
              key={div}
              onClick={() => setDivisionFilter(div)}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide transition-colors ${
                divisionFilter === div
                  ? "bg-flag-blue text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {div.split("-")[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <p className="text-xs text-gray-400 mb-3">
        Showing {filtered.length} of {registrations.length} players
      </p>

      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-400 text-sm">
            {registrations.length === 0
              ? "No selected players yet. Select players from the Tryouts page first."
              : "No players match your filters."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((reg) => {
            const playerDocs = documents.filter(
              (d) => d.registration_id === reg.id
            );
            const birthCert = playerDocs.find(
              (d) => d.document_type === "birth_certificate"
            );
            const photo = playerDocs.find(
              (d) => d.document_type === "player_photo"
            );
            const hasContract = contractSet.has(reg.id);
            const isExpanded = expandedPlayers.has(reg.id);
            const isComplete = !!birthCert && !!photo && hasContract;

            return (
              <div
                key={reg.id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden"
              >
                {/* Player row */}
                <button
                  onClick={() => togglePlayer(reg.id)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  {/* Status indicator */}
                  <div
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      isComplete ? "bg-green-500" : "bg-amber-400"
                    }`}
                  />

                  {/* Player info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-sm font-bold uppercase tracking-wide text-charcoal">
                        {reg.player_first_name} {reg.player_last_name}
                      </span>
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-flag-blue/10 text-flag-blue">
                        {reg.division}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Parent: {reg.parent_name} ({reg.parent_email})
                    </p>
                  </div>

                  {/* Document badges */}
                  <div className="hidden sm:flex items-center gap-2 shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${
                        hasContract
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      Contract
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${
                        birthCert
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      Birth Cert
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${
                        photo
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      Photo
                    </span>
                  </div>

                  {isExpanded ? (
                    <ChevronUp size={16} className="text-gray-400 shrink-0" />
                  ) : (
                    <ChevronDown size={16} className="text-gray-400 shrink-0" />
                  )}
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50/50">
                    {/* Mobile badges */}
                    <div className="flex sm:hidden flex-wrap gap-2 mb-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${
                          hasContract
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        Contract {hasContract ? "Signed" : "Missing"}
                      </span>
                    </div>

                    {playerDocs.length === 0 ? (
                      <p className="text-sm text-gray-400">
                        No documents uploaded yet.
                        {!hasContract &&
                          " Parent needs to sign the contract first."}
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {playerDocs.map((doc) => {
                          const isImage =
                            /\.(jpg|jpeg|png|gif|webp)$/i.test(
                              doc.file_name
                            ) || doc.document_type === "player_photo";

                          return (
                            <div
                              key={doc.id}
                              className="bg-white rounded-lg border border-gray-200 p-3 flex items-center gap-3"
                            >
                              {/* Icon */}
                              <div
                                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                  isImage
                                    ? "bg-purple-50 text-purple-500"
                                    : "bg-blue-50 text-flag-blue"
                                }`}
                              >
                                {isImage ? (
                                  <ImageIcon size={18} />
                                ) : (
                                  <FileText size={18} />
                                )}
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-charcoal truncate">
                                  {docTypeLabel(doc.document_type)}
                                </p>
                                <p className="text-xs text-gray-400 truncate">
                                  {doc.file_name} &middot;{" "}
                                  {new Date(doc.created_at).toLocaleDateString()}
                                </p>
                              </div>

                              {/* Status */}
                              <div className="shrink-0">
                                {statusBadge(doc.status)}
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() =>
                                    handleView(doc.file_path, doc.file_name)
                                  }
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-flag-blue hover:bg-flag-blue/5 transition-colors"
                                  title="View"
                                >
                                  <Eye size={16} />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDownload(doc.file_path, doc.file_name)
                                  }
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-flag-blue hover:bg-flag-blue/5 transition-colors"
                                  title="Download"
                                >
                                  <Download size={16} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Approve/Reject actions for pending docs */}
                    {playerDocs.some((d) => d.status === "pending") && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                          Quick Actions
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {playerDocs
                            .filter((d) => d.status === "pending")
                            .map((doc) => (
                              <div
                                key={doc.id}
                                className="flex items-center gap-1.5"
                              >
                                <span className="text-xs text-gray-500">
                                  {docTypeLabel(doc.document_type)}:
                                </span>
                                <button
                                  onClick={() =>
                                    updateDocStatus(doc.id, "approved")
                                  }
                                  className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() =>
                                    updateDocStatus(doc.id, "rejected")
                                  }
                                  className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-red-100 text-flag-red hover:bg-red-200 transition-colors"
                                >
                                  Reject
                                </button>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Image Preview Modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => {
            setPreviewUrl(null);
            setPreviewName("");
          }}
        >
          <div
            className="bg-white rounded-lg overflow-hidden max-w-3xl max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <p className="text-sm font-semibold text-charcoal truncate">
                {previewName}
              </p>
              <button
                onClick={() => {
                  setPreviewUrl(null);
                  setPreviewName("");
                }}
                className="text-gray-400 hover:text-charcoal transition-colors text-lg font-bold px-2"
              >
                &times;
              </button>
            </div>
            <div className="overflow-auto p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt={previewName}
                className="max-w-full h-auto rounded"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

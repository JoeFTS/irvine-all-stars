"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ShieldCheck } from "lucide-react";
import FileUpload from "@/components/file-upload";

/* ---------- Types ---------- */

interface TeamDocument {
  id: string;
  document_type: string;
  file_path: string;
  file_name: string;
  division: string | null;
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

export default function AdminDocumentsPage() {
  const [teamDocs, setTeamDocs] = useState<TeamDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRulesDivision, setSelectedRulesDivision] = useState<string>("");

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

    const { data } = await supabase
      .from("team_documents")
      .select("id, document_type, file_path, file_name, division, created_at");

    if (data) setTeamDocs(data);
    setLoading(false);
  }

  async function handleTeamDocUpload(
    documentType: string,
    filePath: string,
    fileName: string,
    division: string | null = null
  ) {
    if (!supabase) return;

    const userId = (await supabase.auth.getUser()).data.user?.id;

    // Delete existing document of this type + division (upsert pattern)
    const existing = teamDocs.find(
      (d) => d.document_type === documentType && d.division === division
    );
    if (existing) {
      await supabase.from("team_documents").delete().eq("id", existing.id);
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
        division,
        uploaded_by: userId,
      })
      .select("id, document_type, file_path, file_name, division, created_at")
      .single();

    if (!error && data) {
      setTeamDocs((prev) => [
        ...prev.filter(
          (d) => !(d.document_type === documentType && d.division === division)
        ),
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
      window.open(data.signedUrl, "_blank");
    }
  }

  if (!supabase) {
    return (
      <div className="p-6 md:p-10">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
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
          <div className="h-40 bg-gray-200 rounded-2xl" />
          <div className="h-40 bg-gray-200 rounded-2xl" />
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
          Team Documents
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Upload and manage shared documents for coaching staff.
        </p>
      </div>

      {/* Shared Team Documents */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck size={20} className="text-flag-blue" />
          <h2 className="font-display text-lg font-bold uppercase tracking-wide text-charcoal">
            Shared Team Documents
          </h2>
        </div>
        <p className="text-xs text-gray-400 mb-5">
          Upload documents shared with coaching staff. Insurance is shared
          across all divisions. Tournament rules can be uploaded per division.
        </p>

        {/* Insurance Certificate — global */}
        <div className="border border-gray-200 rounded-2xl p-4 mb-5">
          <p className="text-sm font-semibold text-charcoal mb-2">
            Certificate of Liability Insurance
          </p>
          <p className="text-xs text-gray-400 mb-3">
            Shared with all coaches across all divisions
          </p>
          {(() => {
            const doc = teamDocs.find(
              (d) => d.document_type === "insurance_certificate"
            );
            return doc ? (
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-0 w-full sm:w-auto">
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
                  className="px-3 py-2 min-h-[44px] rounded-full text-xs font-semibold text-flag-blue bg-flag-blue/5 hover:bg-flag-blue/10 transition-colors"
                >
                  View
                </button>
                <FileUpload
                  bucket="player-documents"
                  folder="team-docs/insurance_certificate"
                  accept="image/*,.pdf"
                  maxSizeMB={10}
                  label="Replace"
                  onUploadComplete={(filePath, fileName) =>
                    handleTeamDocUpload(
                      "insurance_certificate",
                      filePath,
                      fileName,
                      null
                    )
                  }
                />
              </div>
            ) : (
              <FileUpload
                bucket="player-documents"
                folder="team-docs/insurance_certificate"
                accept="image/*,.pdf"
                maxSizeMB={10}
                label="Upload"
                description="PDF or image, max 10 MB"
                onUploadComplete={(filePath, fileName) =>
                  handleTeamDocUpload(
                    "insurance_certificate",
                    filePath,
                    fileName,
                    null
                  )
                }
              />
            );
          })()}
        </div>

        {/* Tournament Rules — per division */}
        <div className="border border-gray-200 rounded-2xl p-4">
          <p className="text-sm font-semibold text-charcoal mb-1">
            Pre-Tournament Rules / Coach&apos;s Agreement
          </p>
          <p className="text-xs text-gray-400 mb-4">
            Select a division to upload or view its tournament rules
          </p>

          {/* Division buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            {DIVISIONS.map((div) => {
              const hasDoc = teamDocs.some(
                (d) => d.document_type === "tournament_rules" && d.division === div
              );
              const isSelected = selectedRulesDivision === div;
              return (
                <button
                  key={div}
                  onClick={() => setSelectedRulesDivision(isSelected ? "" : div)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide border transition-colors flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-flag-blue text-white border-flag-blue"
                      : hasDoc
                      ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                      : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {hasDoc && !isSelected && (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {div.split("-")[0]}
                </button>
              );
            })}
          </div>

          {/* Selected division detail */}
          {selectedRulesDivision && (() => {
            const doc = teamDocs.find(
              (d) => d.document_type === "tournament_rules" && d.division === selectedRulesDivision
            );
            return (
              <div className="border border-flag-blue/20 bg-flag-blue/5 rounded-2xl p-4">
                <p className="text-sm font-semibold text-charcoal mb-3">
                  {selectedRulesDivision}
                </p>
                {doc ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex-1 min-w-0 w-full sm:w-auto">
                      <p className="text-xs text-gray-600 truncate">{doc.file_name}</p>
                      <p className="text-[10px] text-gray-400">
                        Uploaded {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleViewTeamDoc(doc.file_path, doc.file_name)}
                      className="px-3 py-2 min-h-[44px] rounded-full text-xs font-semibold text-flag-blue bg-white border border-flag-blue/20 hover:bg-flag-blue/10 transition-colors shrink-0"
                    >
                      View
                    </button>
                    <FileUpload
                      key={`replace-${selectedRulesDivision}`}
                      bucket="player-documents"
                      folder={`team-docs/tournament_rules/${selectedRulesDivision.replace(/\s+/g, "-")}`}
                      accept="image/*,.pdf"
                      maxSizeMB={10}
                      label="Replace"
                      onUploadComplete={(filePath, fileName) =>
                        handleTeamDocUpload("tournament_rules", filePath, fileName, selectedRulesDivision)
                      }
                    />
                  </div>
                ) : (
                  <FileUpload
                    key={`upload-${selectedRulesDivision}`}
                    bucket="player-documents"
                    folder={`team-docs/tournament_rules/${selectedRulesDivision.replace(/\s+/g, "-")}`}
                    accept="image/*,.pdf"
                    maxSizeMB={10}
                    label="Upload"
                    description="PDF or image, max 10 MB"
                    onUploadComplete={(filePath, fileName) =>
                      handleTeamDocUpload("tournament_rules", filePath, fileName, selectedRulesDivision)
                    }
                  />
                )}
              </div>
            );
          })()}

          {!selectedRulesDivision && (
            <p className="text-xs text-gray-400">
              Select a division above to upload or manage its tournament rules.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

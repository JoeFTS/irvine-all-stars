"use client";

import { useEffect, useState, useMemo } from "react";
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
  const [selectedRulesDivision, setSelectedRulesDivision] = useState<string>(
    DIVISIONS[0]
  );

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

  const uploadedRules = useMemo(
    () =>
      teamDocs
        .filter((d) => d.document_type === "tournament_rules" && d.division)
        .sort((a, b) => {
          const aIdx = DIVISIONS.indexOf(a.division!);
          const bIdx = DIVISIONS.indexOf(b.division!);
          return aIdx - bIdx;
        }),
    [teamDocs]
  );

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
          <div className="h-40 bg-gray-200 rounded-lg" />
          <div className="h-40 bg-gray-200 rounded-lg" />
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
      <div className="bg-white border border-gray-200 rounded-lg p-5">
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
        <div className="border border-gray-200 rounded-lg p-4 mb-5">
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
        <div className="border border-gray-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-charcoal mb-1">
            Pre-Tournament Rules / Coach&apos;s Agreement
          </p>
          <p className="text-xs text-gray-400 mb-4">
            Upload rules per division — each division may have different
            tournament rules
          </p>

          {/* Upload controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5">
            <select
              value={selectedRulesDivision}
              onChange={(e) => setSelectedRulesDivision(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-flag-blue/30"
            >
              {DIVISIONS.map((div) => (
                <option key={div} value={div}>
                  {div}
                </option>
              ))}
            </select>
            <FileUpload
              bucket="player-documents"
              folder={`team-docs/tournament_rules/${selectedRulesDivision.replace(/\s+/g, "-")}`}
              accept="image/*,.pdf"
              maxSizeMB={10}
              label="Upload PDF"
              onUploadComplete={(filePath, fileName) =>
                handleTeamDocUpload(
                  "tournament_rules",
                  filePath,
                  fileName,
                  selectedRulesDivision
                )
              }
            />
          </div>

          {/* Uploaded rules list */}
          {uploadedRules.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Uploaded Rules
              </p>
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                {uploadedRules.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <p className="text-sm font-semibold text-charcoal w-28 shrink-0">
                      {doc.division}
                    </p>
                    <p className="text-xs text-gray-500 truncate flex-1 min-w-0">
                      {doc.file_name}
                    </p>
                    <p className="text-xs text-gray-400 shrink-0">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                    <button
                      onClick={() =>
                        handleViewTeamDoc(doc.file_path, doc.file_name)
                      }
                      className="px-3 py-1 rounded-lg text-xs font-semibold text-flag-blue bg-flag-blue/5 hover:bg-flag-blue/10 transition-colors shrink-0"
                    >
                      View
                    </button>
                    <FileUpload
                      bucket="player-documents"
                      folder={`team-docs/tournament_rules/${doc.division!.replace(/\s+/g, "-")}`}
                      accept="image/*,.pdf"
                      maxSizeMB={10}
                      label="Replace"
                      onUploadComplete={(filePath, fileName) =>
                        handleTeamDocUpload(
                          "tournament_rules",
                          filePath,
                          fileName,
                          doc.division
                        )
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {uploadedRules.length === 0 && (
            <p className="text-xs text-gray-400">
              No tournament rules uploaded yet. Select a division above and
              upload a PDF.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

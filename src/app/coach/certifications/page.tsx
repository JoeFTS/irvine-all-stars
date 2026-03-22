"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import FileUpload from "@/components/file-upload";
import { ExternalLink, CheckCircle2, Clock, UserPlus, Plus, Trash2 } from "lucide-react";

interface AssistantCoach {
  id: string;
  name: string;
  concussion_cert_path: string | null;
  concussion_cert_name: string | null;
  cardiac_cert_path: string | null;
  cardiac_cert_name: string | null;
}

interface CertRecord {
  id: string;
  cert_type: string;
  completed: boolean;
  completed_at: string | null;
  cert_file_path: string | null;
  cert_file_name: string | null;
}

const CERT_CONFIGS = [
  {
    type: "concussion",
    title: "Youth Sports Concussion Protocol",
    description:
      'California law (AB-379) requires certification in youth sports concussion protocols.',
    links: [
      {
        label: "CIF Sports Medicine",
        url: "https://cifstate.org/sports-medicine/concussions/index",
      },
      {
        label: "CDC Heads Up",
        url: "https://www.cdc.gov/headsup/youthsports/coach.html",
      },
    ],
    folder: "concussion",
    uploadLabel: "Concussion Certificate",
  },
  {
    type: "cardiac_arrest",
    title: "Sudden Cardiac Arrest Prevention",
    description:
      'California law (AB-379) also requires certification in sudden cardiac arrest prevention.',
    links: [
      {
        label: "CIF SCA",
        url: "https://cifstate.org/sports-medicine/sca/index",
      },
      {
        label: "NFHS Learn",
        url: "https://nfhslearn.com/courses/sudden-cardiac-arrest",
      },
      {
        label: "NAYS Resources",
        url: "https://www.nays.org/resources/more/sudden-cardiac-arrest/",
      },
    ],
    folder: "cardiac_arrest",
    uploadLabel: "Cardiac Arrest Certificate",
  },
] as const;

export default function CertificationsPage() {
  const { user } = useAuth();
  const [certs, setCerts] = useState<CertRecord[]>([]);
  const [assistantCoaches, setAssistantCoaches] = useState<AssistantCoach[]>([]);
  const [showAddAssistant, setShowAddAssistant] = useState(false);
  const [newAssistantName, setNewAssistantName] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchCerts = useCallback(async () => {
    if (!supabase || !user) return;
    try {
      const { data, error } = await supabase
        .from("coach_certifications")
        .select("*")
        .eq("coach_id", user.id);
      if (!error && data) {
        setCerts(data as CertRecord[]);
      }

      // Fetch assistant coaches
      const { data: assistants } = await supabase
        .from("assistant_coaches")
        .select("*")
        .eq("head_coach_id", user.id);
      if (assistants) {
        setAssistantCoaches(assistants as AssistantCoach[]);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCerts();
  }, [fetchCerts]);

  const getCert = (certType: string) =>
    certs.find((c) => c.cert_type === certType && c.completed);

  const completedCount = CERT_CONFIGS.filter((cfg) =>
    getCert(cfg.type)
  ).length;

  const handleUploadComplete = async (
    certType: string,
    filePath: string,
    fileName: string
  ) => {
    if (!supabase || !user) return;

    const now = new Date().toISOString();

    // Check if record exists
    const existing = certs.find((c) => c.cert_type === certType);

    if (existing) {
      await supabase
        .from("coach_certifications")
        .update({
          completed: true,
          completed_at: now,
          cert_file_path: filePath,
          cert_file_name: fileName,
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("coach_certifications").insert({
        coach_id: user.id,
        cert_type: certType,
        completed: true,
        completed_at: now,
        cert_file_path: filePath,
        cert_file_name: fileName,
      });
    }

    // Refresh
    await fetchCerts();
  };

  const addAssistant = async () => {
    if (!supabase || !user || !newAssistantName.trim()) return;
    await supabase.from("assistant_coaches").insert({
      head_coach_id: user.id,
      name: newAssistantName.trim(),
    });
    setNewAssistantName("");
    setShowAddAssistant(false);
    await fetchCerts();
  };

  const removeAssistant = async (id: string) => {
    if (!supabase) return;
    await supabase.from("assistant_coaches").delete().eq("id", id);
    await fetchCerts();
  };

  const uploadAssistantCert = async (
    assistantId: string,
    certType: "concussion" | "cardiac",
    filePath: string,
    fileName: string
  ) => {
    if (!supabase) return;
    const updateData =
      certType === "concussion"
        ? { concussion_cert_path: filePath, concussion_cert_name: fileName }
        : { cardiac_cert_path: filePath, cardiac_cert_name: fileName };
    await supabase
      .from("assistant_coaches")
      .update(updateData)
      .eq("id", assistantId);
    await fetchCerts();
  };

  return (
    <div className="p-6 md:p-10 max-w-3xl">
      {/* Header */}
      <p className="font-display text-sm font-semibold text-flag-red uppercase tracking-[3px] mb-1">
        Coach
      </p>
      <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide mb-4">
        Certifications
      </h1>

      {/* Requirement note */}
      <div className="bg-blue-50 border-l-4 border-flag-blue rounded-r-lg p-4 mb-6">
        <p className="text-sm text-charcoal leading-relaxed">
          At least <strong>ONE</strong> coaching staff member must have{" "}
          <strong>BOTH</strong> certificates. No cost to complete. Must be done{" "}
          <strong>BEFORE</strong> your binder can be signed off.
        </p>
      </div>

      {/* Overall Status */}
      <div
        className={`rounded-lg px-5 py-4 mb-8 border ${
          completedCount === 2
            ? "bg-green-50 border-green-300"
            : "bg-amber-50 border-amber-300"
        }`}
      >
        {completedCount === 2 ? (
          <div className="flex items-center gap-3">
            <CheckCircle2 className="text-green-600 shrink-0" size={24} />
            <p className="text-green-800 font-semibold">
              2 of 2 certifications complete — You&apos;re all set!
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Clock className="text-amber-600 shrink-0" size={24} />
            <p className="text-amber-800 font-semibold">
              {completedCount} of 2 certifications complete
            </p>
          </div>
        )}
      </div>

      {/* Certification Cards */}
      {loading ? (
        <p className="text-gray-500">Loading certifications...</p>
      ) : (
        <div className="space-y-6">
          {CERT_CONFIGS.map((cfg) => {
            const cert = getCert(cfg.type);
            return (
              <div
                key={cfg.type}
                className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
              >
                {/* Card Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="font-display text-lg font-bold uppercase tracking-wide text-charcoal">
                    {cfg.title}
                  </h2>
                  {cert ? (
                    <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
                      <CheckCircle2 size={14} />
                      Completed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full">
                      <Clock size={14} />
                      Not Yet Completed
                    </span>
                  )}
                </div>

                {/* Card Body */}
                <div className="px-6 py-5 space-y-4">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {cfg.description}
                  </p>

                  {/* Resource Links */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Free Training Resources
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {cfg.links.map((link) => (
                        <a
                          key={link.url}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 bg-flag-blue/10 text-flag-blue text-sm font-semibold px-4 py-2 rounded-lg hover:bg-flag-blue/20 transition-colors"
                        >
                          {link.label}
                          <ExternalLink size={14} />
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* Upload Area */}
                  {cert ? (
                    <div className="text-sm text-green-700 bg-green-50 rounded-lg p-3">
                      Certificate uploaded
                      {cert.completed_at && (
                        <> on {new Date(cert.completed_at).toLocaleDateString()}</>
                      )}
                      {cert.cert_file_name && <> ({cert.cert_file_name})</>}
                    </div>
                  ) : (
                    <FileUpload
                      bucket="player-documents"
                      folder={`coach-certs/${user?.id}/${cfg.folder}`}
                      label={cfg.uploadLabel}
                      description="Upload your certificate (image or PDF)"
                      onUploadComplete={(filePath, fileName) =>
                        handleUploadComplete(cfg.type, filePath, fileName)
                      }
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ---- Assistant Coaches ---- */}
      {!loading && (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-bold uppercase tracking-wide">
              Assistant Coaches
            </h2>
            {!showAddAssistant && (
              <button
                onClick={() => setShowAddAssistant(true)}
                className="inline-flex items-center gap-1.5 bg-flag-blue text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-flag-blue/90 transition-colors"
              >
                <Plus size={16} />
                Add Assistant Coach
              </button>
            )}
          </div>

          {showAddAssistant && (
            <div className="flex items-center gap-3 mb-4">
              <input
                type="text"
                value={newAssistantName}
                onChange={(e) => setNewAssistantName(e.target.value)}
                placeholder="Assistant coach name"
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-flag-blue/50 focus:border-flag-blue"
                onKeyDown={(e) => {
                  if (e.key === "Enter") addAssistant();
                }}
              />
              <button
                onClick={addAssistant}
                disabled={!newAssistantName.trim()}
                className="inline-flex items-center gap-1.5 bg-flag-blue text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-flag-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UserPlus size={16} />
                Add
              </button>
              <button
                onClick={() => {
                  setShowAddAssistant(false);
                  setNewAssistantName("");
                }}
                className="text-sm font-semibold text-gray-500 hover:text-gray-700 px-3 py-2"
              >
                Cancel
              </button>
            </div>
          )}

          {assistantCoaches.length === 0 && !showAddAssistant && (
            <p className="text-sm text-gray-400">
              No assistant coaches added yet.
            </p>
          )}

          <div className="space-y-4">
            {assistantCoaches.map((ac) => (
              <div
                key={ac.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
              >
                {/* Card Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-display text-lg font-bold uppercase tracking-wide text-charcoal">
                    {ac.name}
                  </h3>
                  <button
                    onClick={() => removeAssistant(ac.id)}
                    className="inline-flex items-center gap-1.5 text-flag-red text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={14} />
                    Remove
                  </button>
                </div>

                {/* Card Body */}
                <div className="px-6 py-5 space-y-4">
                  {/* Concussion Cert */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Concussion Certificate
                    </p>
                    {ac.concussion_cert_path ? (
                      <div className="text-sm text-green-700 bg-green-50 rounded-lg p-3 flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-green-600 shrink-0" />
                        Uploaded{ac.concussion_cert_name && <> ({ac.concussion_cert_name})</>}
                      </div>
                    ) : (
                      <FileUpload
                        bucket="player-documents"
                        folder={`coach-certs/assistants/${ac.id}/concussion`}
                        label="Concussion Certificate"
                        description="Upload certificate (image or PDF)"
                        onUploadComplete={(filePath, fileName) =>
                          uploadAssistantCert(ac.id, "concussion", filePath, fileName)
                        }
                      />
                    )}
                  </div>

                  {/* Cardiac Cert */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Cardiac Arrest Certificate
                    </p>
                    {ac.cardiac_cert_path ? (
                      <div className="text-sm text-green-700 bg-green-50 rounded-lg p-3 flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-green-600 shrink-0" />
                        Uploaded{ac.cardiac_cert_name && <> ({ac.cardiac_cert_name})</>}
                      </div>
                    ) : (
                      <FileUpload
                        bucket="player-documents"
                        folder={`coach-certs/assistants/${ac.id}/cardiac`}
                        label="Cardiac Arrest Certificate"
                        description="Upload certificate (image or PDF)"
                        onUploadComplete={(filePath, fileName) =>
                          uploadAssistantCert(ac.id, "cardiac", filePath, fileName)
                        }
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

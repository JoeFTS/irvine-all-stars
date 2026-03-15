"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { StripeDivider } from "@/components/stripe-divider";
import FileUpload from "@/components/file-upload";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Registration {
  id: string;
  player_name: string;
  division: string;
}

interface PlayerDocument {
  id: string;
  registration_id: string;
  document_type: string;
  file_path: string;
  file_name: string;
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function DocumentsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [documents, setDocuments] = useState<PlayerDocument[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login?redirect=/portal/documents");
    }
  }, [authLoading, user, router]);

  // Fetch registrations and existing documents
  useEffect(() => {
    if (!user || !supabase) {
      setDataLoading(false);
      return;
    }

    async function fetchData() {
      setDataLoading(true);

      const { data: regs } = await supabase!
        .from("tryout_registrations")
        .select("id, player_name, division")
        .eq("parent_email", user!.email ?? "")
        .order("created_at", { ascending: false });

      const regData = (regs ?? []) as Registration[];
      setRegistrations(regData);

      if (regData.length > 0) {
        const regIds = regData.map((r) => r.id);
        const { data: docs } = await supabase!
          .from("player_documents")
          .select("id, registration_id, document_type, file_path, file_name")
          .in("registration_id", regIds);

        setDocuments((docs ?? []) as PlayerDocument[]);
      }

      setDataLoading(false);
    }

    fetchData();
  }, [user]);

  const getExistingDoc = useCallback(
    (registrationId: string, docType: string) => {
      return documents.find(
        (d) =>
          d.registration_id === registrationId && d.document_type === docType
      );
    },
    [documents]
  );

  const handleUploadComplete = useCallback(
    async (
      registrationId: string,
      playerName: string,
      division: string,
      documentType: string,
      filePath: string,
      fileName: string
    ) => {
      if (!supabase || !user) return;

      const { data, error } = await supabase
        .from("player_documents")
        .insert({
          registration_id: registrationId,
          player_name: playerName,
          division: division,
          document_type: documentType,
          file_path: filePath,
          file_name: fileName,
          uploaded_by: user.id,
          status: "pending",
        })
        .select("id, registration_id, document_type, file_path, file_name")
        .single();

      if (!error && data) {
        setDocuments((prev) => [
          ...prev.filter(
            (d) =>
              !(
                d.registration_id === registrationId &&
                d.document_type === documentType
              )
          ),
          data as PlayerDocument,
        ]);
      }
    },
    [user]
  );

  /* ---- Loading state ---- */
  if (authLoading) {
    return (
      <div className="min-h-screen bg-off-white pt-[98px] flex items-center justify-center">
        <p className="text-gray-400 font-display uppercase tracking-wider text-sm">
          Loading...
        </p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      {/* ===== HERO ===== */}
      <section className="relative bg-flag-blue pt-[98px] pb-14 md:pb-20 px-6 md:px-10 overflow-hidden">
        <div className="absolute inset-0 text-white/[0.04] text-xl leading-[2.8rem] tracking-widest overflow-hidden pointer-events-none p-4">
          {"★ ".repeat(200)}
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center pt-10 md:pt-16">
          <p className="font-display text-sm font-semibold text-star-gold-bright uppercase tracking-[3px] mb-3">
            &#9733; Documents
          </p>
          <h1 className="font-display text-4xl md:text-6xl font-bold text-white uppercase tracking-wide mb-4">
            Required Documents
          </h1>
          <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Upload a birth certificate and player photo for each registered
            player. These are required for tournament eligibility.
          </p>
        </div>
      </section>

      <StripeDivider />

      {/* ===== DOCUMENT UPLOADS ===== */}
      <section className="bg-off-white py-12 md:py-16 px-6 md:px-10">
        <div className="max-w-3xl mx-auto">
          {dataLoading ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <p className="text-gray-400 text-sm">Loading your players...</p>
            </div>
          ) : registrations.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <p className="text-gray-500 mb-4">
                No registered players found. You must register for tryouts
                first.
              </p>
              <Link
                href="/apply/player"
                className="inline-block bg-flag-red hover:bg-flag-red-dark text-white px-6 py-3 rounded font-display text-sm font-semibold uppercase tracking-widest transition-colors"
              >
                Register for Tryouts
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {registrations.map((reg) => {
                const birthCert = getExistingDoc(reg.id, "birth_certificate");
                const playerPhoto = getExistingDoc(reg.id, "player_photo");

                return (
                  <div
                    key={reg.id}
                    className="bg-white rounded-lg border border-gray-200 p-6 md:p-8"
                  >
                    {/* Player header */}
                    <div className="flex items-center gap-3 mb-6">
                      <h2 className="font-display text-xl font-bold uppercase tracking-wide">
                        {reg.player_name}
                      </h2>
                      <span className="inline-block text-xs uppercase tracking-wider px-2.5 py-1 rounded border font-display font-semibold bg-flag-blue/10 text-flag-blue border-flag-blue/30">
                        {reg.division}
                      </span>
                    </div>

                    <div className="space-y-6">
                      {/* Birth Certificate */}
                      <FileUpload
                        bucket="player-documents"
                        folder={`birth-certs/${reg.id}`}
                        label="Birth Certificate"
                        description="Upload a scan or photo of the player's birth certificate (image or PDF)"
                        accept="image/*,.pdf"
                        maxSizeMB={10}
                        existingFile={
                          birthCert
                            ? {
                                path: birthCert.file_path,
                                name: birthCert.file_name,
                              }
                            : null
                        }
                        onUploadComplete={(filePath, fileName) =>
                          handleUploadComplete(
                            reg.id,
                            reg.player_name,
                            reg.division,
                            "birth_certificate",
                            filePath,
                            fileName
                          )
                        }
                      />

                      {/* Player Photo */}
                      <FileUpload
                        bucket="player-documents"
                        folder={`player-photos/${reg.id}`}
                        label="Player Photo"
                        description="Upload a recent headshot-style photo of the player (image only)"
                        accept="image/*"
                        maxSizeMB={10}
                        existingFile={
                          playerPhoto
                            ? {
                                path: playerPhoto.file_path,
                                name: playerPhoto.file_name,
                              }
                            : null
                        }
                        onUploadComplete={(filePath, fileName) =>
                          handleUploadComplete(
                            reg.id,
                            reg.player_name,
                            reg.division,
                            "player_photo",
                            filePath,
                            fileName
                          )
                        }
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Back to portal */}
          <div className="mt-8 text-center">
            <Link
              href="/portal"
              className="inline-flex items-center gap-2 text-flag-blue hover:text-flag-blue-mid font-display text-sm font-semibold uppercase tracking-widest transition-colors"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                />
              </svg>
              Back to Portal
            </Link>
          </div>
        </div>
      </section>

      <StripeDivider />
    </>
  );
}

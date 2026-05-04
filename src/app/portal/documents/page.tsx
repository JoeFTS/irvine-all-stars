"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { StripeDivider } from "@/components/stripe-divider";
import { HelpTooltip } from "@/components/help-tooltip";
import FileUpload from "@/components/file-upload";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Registration {
  id: string;
  player_first_name: string;
  player_last_name: string;
  division: string;
}

function playerFullName(reg: Registration): string {
  return `${reg.player_first_name || ""} ${reg.player_last_name || ""}`.trim() || "Unknown Player";
}

interface PlayerContract {
  id: string;
  registration_id: string;
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

export default function DocumentsPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-off-white pt-16 flex items-center justify-center">
        <p className="text-gray-400 font-display uppercase tracking-wider text-sm">Loading...</p>
      </div>
    }>
      <DocumentsPage />
    </Suspense>
  );
}

function DocumentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const playerParam = searchParams.get("player");
  const { user, loading: authLoading } = useAuth();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [contracts, setContracts] = useState<PlayerContract[]>([]);
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
        .select("id, player_first_name, player_last_name, division")
        .or(`parent_email.eq.${user!.email},secondary_parent_email.eq.${user!.email}`)
        .order("submitted_at", { ascending: false });

      const allRegs = (regs ?? []) as Registration[];

      if (allRegs.length > 0) {
        const regIds = allRegs.map((r) => r.id);

        // Fetch contracts and documents in parallel
        const [contractsResult, docsResult] = await Promise.all([
          supabase!
            .from("player_contracts")
            .select("id, registration_id")
            .in("registration_id", regIds),
          supabase!
            .from("player_documents")
            .select("id, registration_id, document_type, file_path, file_name")
            .in("registration_id", regIds),
        ]);

        const contractData = (contractsResult.data ?? []) as PlayerContract[];
        const allDocs = (docsResult.data ?? []) as PlayerDocument[];
        setContracts(contractData);
        setDocuments(allDocs);

        // Player is unlocked if contract is e-signed OR coach has uploaded one
        const signedRegIds = new Set(contractData.map((c) => c.registration_id));
        const uploadedContractIds = new Set(
          allDocs
            .filter((d) => d.document_type === "signed_contract")
            .map((d) => d.registration_id)
        );
        const eligibleRegs = allRegs.filter(
          (r) => signedRegIds.has(r.id) || uploadedContractIds.has(r.id)
        );
        setRegistrations(eligibleRegs);
      } else {
        setRegistrations([]);
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
      <div className="min-h-screen bg-off-white pt-16 flex items-center justify-center">
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
      <section className="relative bg-flag-blue pt-16 pb-14 md:pb-20 px-6 md:px-10 overflow-hidden">
        <div className="absolute inset-0 text-white/[0.04] text-xl leading-[2.8rem] tracking-widest overflow-hidden pointer-events-none p-4">
          {"★ ".repeat(200)}
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center pt-10 md:pt-16">
          <p className="font-display text-sm font-semibold text-star-gold-bright uppercase tracking-[3px] mb-3">
            &#9733; Documents
          </p>
          <h1 className="font-display text-4xl md:text-6xl font-bold text-white uppercase tracking-wide mb-4 flex items-center justify-center">
            Required Documents
            <HelpTooltip
              text="Download and review required documents and policies."
              guideUrl="/portal/help"
            />
          </h1>
          <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Upload a birth certificate for each registered player. Required for
            tournament eligibility.
          </p>
        </div>
      </section>

      <StripeDivider />

      {/* ===== DOCUMENT UPLOADS ===== */}
      <section className="bg-off-white py-12 md:py-16 px-6 md:px-10">
        <div className="max-w-3xl mx-auto">
          {dataLoading ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
              <p className="text-gray-400 text-sm">Loading your players...</p>
            </div>
          ) : registrations.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <svg className="h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
              <h2 className="font-display text-xl font-bold uppercase tracking-wide mb-2">
                Not Yet Available
              </h2>
              <p className="text-gray-500 text-sm mb-4">
                Document uploads unlock after you sign the player contract.
                Please complete the contract signing step first.
              </p>
              <Link
                href="/portal"
                className="inline-block bg-flag-blue hover:bg-flag-blue-mid text-white px-6 py-3 rounded-full font-display text-sm font-semibold uppercase tracking-widest transition-colors"
              >
                Back to Portal
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {registrations.map((reg) => {
                const birthCert = getExistingDoc(reg.id, "birth_certificate");

                return (
                  <div
                    key={reg.id}
                    className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8"
                  >
                    {/* Player header */}
                    <div className="flex items-center gap-3 mb-6">
                      <h2 className="font-display text-xl font-bold uppercase tracking-wide">
                        {playerFullName(reg)}
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
                            playerFullName(reg),
                            reg.division,
                            "birth_certificate",
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

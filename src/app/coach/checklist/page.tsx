"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { getPitchingRuleForDivision } from "@/content/pitching-rules";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Printer,
  FileText,
  ShieldCheck,
  Info,
  AlertTriangle,
  Camera,
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

interface TeamDocument {
  id: string;
  document_type: string;
  file_path: string | null;
  division: string | null;
}

interface CoachCertification {
  id: string;
  cert_type: string;
  file_path: string | null;
}

type SectionItemStatus = "complete" | "pending" | "not_required";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Map division strings like "11U-Bronco" → "Bronco", "7U KP-Pinto" → "Pinto Kid Pitch", etc. */
function divisionToPonyName(division: string): string {
  const lower = division.toLowerCase();

  if (lower.includes("shetland")) return "Shetland";
  if (lower.includes("mp") && lower.includes("pinto")) return "Pinto Machine Pitch";
  if (lower.includes("kp") && lower.includes("pinto")) return "Pinto Kid Pitch";
  if (lower.includes("pinto")) return "Pinto Kid Pitch"; // fallback for generic pinto

  // For "11U-Bronco", "9U-Mustang", "12U-Pony" — extract after hyphen
  const parts = division.split("-");
  if (parts.length >= 2) {
    const name = parts[parts.length - 1].trim();
    // Capitalize first letter
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  return division;
}

function divisionShortName(division: string): string {
  return division.split("-")[0];
}

/* ------------------------------------------------------------------ */
/*  Status helpers & icons                                             */
/* ------------------------------------------------------------------ */

function StatusIcon({ status }: { status: SectionItemStatus }) {
  switch (status) {
    case "complete":
      return <CheckCircle2 size={18} className="text-green-600 shrink-0" />;
    case "pending":
      return <XCircle size={18} className="text-flag-red shrink-0" />;
    case "not_required":
      return <CheckCircle2 size={18} className="text-green-600 shrink-0" />;
  }
}

function statusBg(status: SectionItemStatus): string {
  switch (status) {
    case "complete":
      return "bg-green-50";
    case "pending":
      return "bg-red-50";
    case "not_required":
      return "bg-green-50";
  }
}

function statusBadgeClasses(status: SectionItemStatus): string {
  switch (status) {
    case "complete":
      return "bg-green-100 text-green-700";
    case "pending":
      return "bg-red-100 text-flag-red";
    case "not_required":
      return "bg-green-100 text-green-700";
  }
}

function amberBadge() {
  return "bg-amber-100 text-amber-700";
}

/* ------------------------------------------------------------------ */
/*  Section Number Badge                                               */
/* ------------------------------------------------------------------ */

function SectionNumber({ n }: { n: number }) {
  return (
    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-flag-blue text-white text-sm font-bold shrink-0">
      {n}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function BinderChecklistPage() {
  const { user } = useAuth();

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [playerDocs, setPlayerDocs] = useState<PlayerDocument[]>([]);
  const [teamDocs, setTeamDocs] = useState<TeamDocument[]>([]);
  const [coachCerts, setCoachCerts] = useState<CoachCertification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function fetchAll() {
    if (!supabase) return;
    setLoading(true);

    const [regsRes, docsRes, teamDocsRes, certsRes] = await Promise.all([
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
        .from("team_documents")
        .select("id, document_type, file_path, division")
        .in("document_type", ["tournament_rules", "insurance_certificate"]),
      user
        ? supabase
            .from("coach_certifications")
            .select("id, cert_type, file_path")
            .eq("coach_id", user.id)
            .in("cert_type", ["concussion", "cardiac_arrest"])
        : Promise.resolve({ data: [] }),
    ]);

    if (regsRes.data) setRegistrations(regsRes.data);
    if (docsRes.data) setPlayerDocs(docsRes.data);
    if (teamDocsRes.data) setTeamDocs(teamDocsRes.data);
    if (certsRes.data) setCoachCerts(certsRes.data as CoachCertification[]);

    setLoading(false);
  }

  /* ---------------------------------------------------------------- */
  /*  Document viewing                                                 */
  /* ---------------------------------------------------------------- */

  async function handleViewDocument(filePath: string, bucket = "player-documents") {
    if (!supabase || !filePath) return;
    const { data } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, 300);
    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Derived data                                                     */
  /* ---------------------------------------------------------------- */

  // Determine division for pitching rules
  const divisions = [...new Set(registrations.map((r) => r.division))];
  const primaryDivision = divisions.length === 1 ? divisions[0] : divisions[0] ?? "";
  const ponyName = primaryDivision ? divisionToPonyName(primaryDivision) : "";
  const pitchingRule = ponyName ? getPitchingRuleForDivision(ponyName) : null;
  const noPitchingRequired = pitchingRule ? !pitchingRule.hasPitching : false;

  // Team documents — tournament rules filtered by coach's division, insurance is global
  const tournamentRulesDoc = teamDocs.find(
    (d) => d.document_type === "tournament_rules" && d.division === primaryDivision
  ) ?? teamDocs.find(
    (d) => d.document_type === "tournament_rules" && d.division === null
  );
  const insuranceDoc = teamDocs.find((d) => d.document_type === "insurance_certificate");

  // Coach certifications
  const concussionCert = coachCerts.find((c) => c.cert_type === "concussion");
  const cardiacCert = coachCerts.find((c) => c.cert_type === "cardiac_arrest");

  // Per-player document status
  function playerHasDoc(regId: string, docType: string): PlayerDocument | undefined {
    return playerDocs.find(
      (d) => d.registration_id === regId && d.document_type === docType
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Progress calculation                                             */
  /* ---------------------------------------------------------------- */

  const playerCount = registrations.length;

  // Section 1: always 1 ready item (printable pitching log)
  const s1Complete = 1;
  const s1Total = 1;

  // Section 2: tournament rules uploaded?
  const s2Complete = tournamentRulesDoc ? 1 : 0;
  const s2Total = 1;

  // Section 3: insurance certificate uploaded?
  const s3Complete = insuranceDoc ? 1 : 0;
  const s3Total = 1;

  // Section 4: medical release per player
  const s4Complete = registrations.filter((r) => playerHasDoc(r.id, "medical_release")).length;
  const s4Total = playerCount;

  // Section 5: birth certificate per player
  const s5Complete = registrations.filter((r) => playerHasDoc(r.id, "birth_certificate")).length;
  const s5Total = playerCount;

  // Section 6: concussion cert
  const s6Complete = concussionCert ? 1 : 0;
  const s6Total = 1;

  // Section 7: cardiac arrest cert
  const s7Complete = cardiacCert ? 1 : 0;
  const s7Total = 1;

  const totalItems = s1Total + s2Total + s3Total + s4Total + s5Total + s6Total + s7Total;
  const completedItems = s1Complete + s2Complete + s3Complete + s4Complete + s5Complete + s6Complete + s7Complete;
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
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="h-28 bg-gray-200 rounded-lg" />
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
          7 sections matching your physical tournament binder. Green means ready,
          red means action needed.
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

      {/* ================================================================ */}
      {/*  SECTION 1: Tournament Pitching Log                              */}
      {/* ================================================================ */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-5 flex items-center gap-3 border-b border-gray-100">
          <SectionNumber n={1} />
          <div className="flex-1">
            <h2 className="font-display text-lg font-bold uppercase tracking-wider">
              Tournament Pitching Log
            </h2>
          </div>
          <CheckCircle2 size={20} className="text-green-600" />
        </div>
        <div className="p-5 space-y-3">
          {noPitchingRequired ? (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50">
              <CheckCircle2 size={18} className="text-green-600 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-charcoal">
                  No pitching log required
                </p>
                <p className="text-xs text-gray-400">
                  {ponyName} division does not have live pitching
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-green-100 text-green-700">
                N/A
              </span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <FileText size={18} className="text-flag-blue shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-charcoal">
                    Pitching Log
                  </p>
                  {pitchingRule && (
                    <p className="text-xs text-gray-400">
                      Max pitch count: <span className="font-semibold text-charcoal">{pitchingRule.maxPitches}</span> ({ponyName})
                    </p>
                  )}
                </div>
                <Link
                  href="/coach/pitching-log"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-flag-blue text-white hover:bg-flag-blue/90 transition-colors"
                >
                  <Printer size={14} />
                  View &amp; Print Pitching Log
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ================================================================ */}
      {/*  SECTION 2: Pre-Tournament Rules / Coach's Agreement             */}
      {/* ================================================================ */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-5 flex items-center gap-3 border-b border-gray-100">
          <SectionNumber n={2} />
          <div className="flex-1">
            <h2 className="font-display text-lg font-bold uppercase tracking-wider">
              Pre-Tournament Rules / Coach&apos;s Agreement
            </h2>
          </div>
          {tournamentRulesDoc ? (
            <CheckCircle2 size={20} className="text-green-600" />
          ) : (
            <Clock size={20} className="text-amber-500" />
          )}
        </div>
        <div className="p-5">
          <div className={`flex items-center gap-3 p-3 rounded-lg ${tournamentRulesDoc ? "bg-green-50" : "bg-amber-50"}`}>
            {tournamentRulesDoc ? (
              <CheckCircle2 size={18} className="text-green-600 shrink-0" />
            ) : (
              <Clock size={18} className="text-amber-500 shrink-0" />
            )}
            <div className="flex-1">
              <p className="text-sm font-semibold text-charcoal">
                Tournament Rules Document
              </p>
              <p className="text-xs text-gray-400">
                {tournamentRulesDoc ? "Uploaded by admin" : "Admin will upload when available"}
              </p>
            </div>
            {tournamentRulesDoc ? (
              <button
                onClick={() => handleViewDocument(tournamentRulesDoc.file_path!)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-flag-blue text-white hover:bg-flag-blue/90 transition-colors"
              >
                <Eye size={14} />
                View / Print
              </button>
            ) : (
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${amberBadge()}`}>
                Pending
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/*  SECTION 3: Certificate of Liability Insurance                   */}
      {/* ================================================================ */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-5 flex items-center gap-3 border-b border-gray-100">
          <SectionNumber n={3} />
          <div className="flex-1">
            <h2 className="font-display text-lg font-bold uppercase tracking-wider">
              Certificate of Liability Insurance
            </h2>
          </div>
          {insuranceDoc ? (
            <CheckCircle2 size={20} className="text-green-600" />
          ) : (
            <Clock size={20} className="text-amber-500" />
          )}
        </div>
        <div className="p-5">
          <div className={`flex items-center gap-3 p-3 rounded-lg ${insuranceDoc ? "bg-green-50" : "bg-amber-50"}`}>
            {insuranceDoc ? (
              <CheckCircle2 size={18} className="text-green-600 shrink-0" />
            ) : (
              <Clock size={18} className="text-amber-500 shrink-0" />
            )}
            <div className="flex-1">
              <p className="text-sm font-semibold text-charcoal">
                Insurance Certificate
              </p>
              <p className="text-xs text-gray-400">
                {insuranceDoc ? "Uploaded by admin" : "Admin will upload when available"}
              </p>
            </div>
            {insuranceDoc ? (
              <button
                onClick={() => handleViewDocument(insuranceDoc.file_path!)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-flag-blue text-white hover:bg-flag-blue/90 transition-colors"
              >
                <Eye size={14} />
                View / Print
              </button>
            ) : (
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${amberBadge()}`}>
                Pending
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/*  SECTION 4: Medical Releases (per player)                        */}
      {/* ================================================================ */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-5 flex items-center gap-3 border-b border-gray-100">
          <SectionNumber n={4} />
          <div className="flex-1">
            <h2 className="font-display text-lg font-bold uppercase tracking-wider">
              Medical Releases
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {s4Complete} of {s4Total} players complete
            </p>
          </div>
          {s4Complete === s4Total && s4Total > 0 ? (
            <CheckCircle2 size={20} className="text-green-600" />
          ) : (
            <XCircle size={20} className="text-flag-red" />
          )}
        </div>
        <div className="divide-y divide-gray-100">
          {registrations.length === 0 ? (
            <div className="p-5 text-center">
              <p className="text-gray-400 text-sm">
                No selected or alternate players found.
              </p>
            </div>
          ) : (
            registrations.map((reg) => {
              const doc = playerHasDoc(reg.id, "medical_release");
              const status: SectionItemStatus = doc ? "complete" : "pending";
              return (
                <div
                  key={reg.id}
                  className={`flex items-center gap-3 px-5 py-3 ${statusBg(status)}`}
                >
                  <StatusIcon status={status} />
                  <span className="flex-1 text-sm text-charcoal">
                    {reg.player_first_name} {reg.player_last_name}
                  </span>
                  <span className="text-xs text-gray-400 mr-2">
                    {divisionShortName(reg.division)}
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${statusBadgeClasses(status)}`}
                  >
                    {doc ? "Complete" : "Pending"}
                  </span>
                  {doc && (
                    <a
                      href={`/medical-view?id=${reg.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-1 px-2 py-1 rounded text-xs font-semibold text-flag-blue hover:bg-flag-blue/10 transition-colors"
                    >
                      View
                    </a>
                  )}
                </div>
              );
            })
          )}
        </div>
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
          <p className="text-xs text-gray-400 italic">
            Parent completes in portal
          </p>
        </div>
      </div>

      {/* ================================================================ */}
      {/*  SECTION 5: Birth Certificates & Player Photos (per player)      */}
      {/* ================================================================ */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-5 flex items-center gap-3 border-b border-gray-100">
          <SectionNumber n={5} />
          <div className="flex-1">
            <h2 className="font-display text-lg font-bold uppercase tracking-wider">
              Birth Certificates &amp; Player Photos
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {s5Complete} of {s5Total} birth certs uploaded
            </p>
          </div>
          {s5Complete === s5Total && s5Total > 0 ? (
            <CheckCircle2 size={20} className="text-green-600" />
          ) : (
            <XCircle size={20} className="text-flag-red" />
          )}
        </div>
        <div className="divide-y divide-gray-100">
          {registrations.length === 0 ? (
            <div className="p-5 text-center">
              <p className="text-gray-400 text-sm">
                No selected or alternate players found.
              </p>
            </div>
          ) : (
            registrations.map((reg) => {
              const birthCert = playerHasDoc(reg.id, "birth_certificate");
              const photo = playerHasDoc(reg.id, "player_photo");
              const status: SectionItemStatus = birthCert ? "complete" : "pending";
              return (
                <div
                  key={reg.id}
                  className={`flex items-center gap-3 px-5 py-3 ${statusBg(status)}`}
                >
                  <StatusIcon status={status} />
                  <span className="flex-1 text-sm text-charcoal">
                    {reg.player_first_name} {reg.player_last_name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                      {divisionShortName(reg.division)}
                    </span>
                    {birthCert?.file_path && (
                      <button
                        onClick={() => handleViewDocument(birthCert.file_path!)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-flag-blue text-white hover:bg-flag-blue/90 transition-colors"
                        title="View birth certificate"
                      >
                        <Eye size={14} />
                        Birth Cert
                      </button>
                    )}
                    {photo?.file_path && (
                      <button
                        onClick={() => handleViewDocument(photo.file_path!)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-flag-blue text-white hover:bg-flag-blue/90 transition-colors"
                        title="View player photo"
                      >
                        <Camera size={14} />
                        Photo
                      </button>
                    )}
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${statusBadgeClasses(status)}`}
                    >
                      {birthCert ? "Uploaded" : "Pending"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
          <div className="flex items-start gap-2">
            <AlertTriangle size={14} className="text-flag-red shrink-0 mt-0.5" />
            <p className="text-xs text-flag-red font-semibold">
              Name on birth certificate MUST match the affidavit exactly. Do NOT
              leave out middle names, Jr, III, etc.
            </p>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/*  SECTION 6: Concussion Training Certificate                      */}
      {/* ================================================================ */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-5 flex items-center gap-3 border-b border-gray-100">
          <SectionNumber n={6} />
          <div className="flex-1">
            <h2 className="font-display text-lg font-bold uppercase tracking-wider">
              Concussion Training Certificate
            </h2>
          </div>
          {concussionCert ? (
            <CheckCircle2 size={20} className="text-green-600" />
          ) : (
            <XCircle size={20} className="text-flag-red" />
          )}
        </div>
        <div className="p-5">
          <div className={`flex items-center gap-3 p-3 rounded-lg ${concussionCert ? "bg-green-50" : "bg-red-50"}`}>
            {concussionCert ? (
              <CheckCircle2 size={18} className="text-green-600 shrink-0" />
            ) : (
              <XCircle size={18} className="text-flag-red shrink-0" />
            )}
            <div className="flex-1">
              <p className="text-sm font-semibold text-charcoal">
                Concussion Protocol Certificate
              </p>
              <p className="text-xs text-gray-400">
                {concussionCert ? "Uploaded" : "Required — upload in Certifications"}
              </p>
            </div>
            {concussionCert ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-green-100 text-green-700">
                Complete
              </span>
            ) : (
              <Link
                href="/coach/certifications"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-flag-red text-white hover:bg-flag-red/90 transition-colors"
              >
                <ShieldCheck size={14} />
                Upload
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/*  SECTION 7: Sudden Cardiac Arrest Certificate                    */}
      {/* ================================================================ */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-5 flex items-center gap-3 border-b border-gray-100">
          <SectionNumber n={7} />
          <div className="flex-1">
            <h2 className="font-display text-lg font-bold uppercase tracking-wider">
              Sudden Cardiac Arrest Certificate
            </h2>
          </div>
          {cardiacCert ? (
            <CheckCircle2 size={20} className="text-green-600" />
          ) : (
            <XCircle size={20} className="text-flag-red" />
          )}
        </div>
        <div className="p-5">
          <div className={`flex items-center gap-3 p-3 rounded-lg ${cardiacCert ? "bg-green-50" : "bg-red-50"}`}>
            {cardiacCert ? (
              <CheckCircle2 size={18} className="text-green-600 shrink-0" />
            ) : (
              <XCircle size={18} className="text-flag-red shrink-0" />
            )}
            <div className="flex-1">
              <p className="text-sm font-semibold text-charcoal">
                Sudden Cardiac Arrest Prevention Certificate
              </p>
              <p className="text-xs text-gray-400">
                {cardiacCert ? "Uploaded" : "Required — upload in Certifications"}
              </p>
            </div>
            {cardiacCert ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-green-100 text-green-700">
                Complete
              </span>
            ) : (
              <Link
                href="/coach/certifications"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-flag-red text-white hover:bg-flag-red/90 transition-colors"
              >
                <ShieldCheck size={14} />
                Upload
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ---- Footer Note ---- */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 border border-gray-200">
        <Info size={18} className="text-gray-400 shrink-0 mt-0.5" />
        <p className="text-xs text-gray-500">
          Parents upload medical releases and birth certificates through their{" "}
          <Link href="/portal" className="text-flag-blue underline">
            Parent Portal
          </Link>
          . Contact them directly if items are missing.
        </p>
      </div>
    </div>
  );
}

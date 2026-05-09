"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Printer,
  FileText,
  ExternalLink,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { viewAndDownloadDoc } from "@/lib/storage-helpers";
import { getPitchingRuleForDivision } from "@/content/pitching-rules";

interface Team {
  id: string;
  team_name: string;
  division: string;
  coach_email: string | null;
}

interface Coach {
  coach_id: string;
  role: string;
  full_name: string | null;
  email: string;
}

interface Registration {
  id: string;
  player_first_name: string;
  player_last_name: string;
}

interface PlayerDoc {
  registration_id: string;
  document_type: string;
  file_path: string | null;
  file_name: string | null;
}

interface TeamDoc {
  document_type: string;
  file_path: string | null;
  file_name: string | null;
  division: string | null;
  team_id: string | null;
  created_at: string | null;
}

interface CoachCert {
  coach_id: string;
  cert_type: string;
  cert_file_path: string | null;
  cert_file_name: string | null;
}

interface AssistantCoach {
  id: string;
  name: string;
  concussion_cert_path: string | null;
  concussion_cert_name: string | null;
  cardiac_cert_path: string | null;
  cardiac_cert_name: string | null;
}

interface Agreement {
  team_id: string | null;
  coach_id: string;
  agreement_type: string;
  acknowledged: boolean;
  acknowledged_at: string | null;
  coach_name: string | null;
}

function divisionToPonyName(division: string): string {
  const lower = division.toLowerCase();
  if (lower.includes("shetland")) return "Shetland";
  if (lower.includes("pinto")) return lower.includes("kp") ? "Pinto Kid Pitch" : "Pinto Machine Pitch";
  if (lower.includes("mustang")) return "Mustang";
  if (lower.includes("bronco")) return "Bronco";
  if (lower.includes("pony")) return "Pony";
  return division;
}

function StatusBadge({ ok, label }: { ok: boolean; label?: string }) {
  if (label === "N/A") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-gray-100 text-gray-500">
        N/A
      </span>
    );
  }
  return ok ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-green-100 text-green-700">
      <CheckCircle2 size={11} />
      Ready
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-amber-100 text-amber-700">
      <XCircle size={11} />
      Pending
    </span>
  );
}

function DocLink({
  filePath,
  fileName,
  bucket = "player-documents",
  label = "View",
}: {
  filePath: string;
  fileName: string | null;
  bucket?: string;
  label?: string;
}) {
  return (
    <button
      onClick={() => viewAndDownloadDoc(filePath, fileName ?? "doc.pdf", bucket)}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-flag-blue text-white hover:bg-flag-blue/90 transition-colors no-print-button"
    >
      <FileText size={11} />
      {label}
    </button>
  );
}

export default function TeamBinderPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = use(params);

  const [team, setTeam] = useState<Team | null>(null);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [playerDocs, setPlayerDocs] = useState<PlayerDoc[]>([]);
  const [teamDocs, setTeamDocs] = useState<TeamDoc[]>([]);
  const [certs, setCerts] = useState<CoachCert[]>([]);
  const [assistants, setAssistants] = useState<AssistantCoach[]>([]);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase || !teamId) return;
    (async () => {
      setLoading(true);
      const teamRes = await supabase
        .from("teams")
        .select("id, team_name, division, coach_email")
        .eq("id", teamId)
        .maybeSingle();
      if (teamRes.error || !teamRes.data) {
        setError(teamRes.error?.message ?? "Team not found");
        setLoading(false);
        return;
      }
      setTeam(teamRes.data as Team);
      const division = teamRes.data.division as string;

      const [
        coachesRes,
        regsRes,
        teamDocsRes,
        agreementsRes,
      ] = await Promise.all([
        supabase
          .from("team_coaches")
          .select("coach_id, role, profiles!team_coaches_coach_id_fkey ( full_name, email )")
          .eq("team_id", teamId),
        supabase
          .from("tryout_registrations")
          .select("id, player_first_name, player_last_name")
          .eq("team_id", teamId)
          .in("status", ["selected", "confirmed", "tryout_complete", "alternate"])
          .order("player_last_name"),
        supabase
          .from("team_documents")
          .select("document_type, file_path, file_name, division, team_id, created_at")
          .or(
            `team_id.eq.${teamId},and(team_id.is.null,division.eq.${division}),and(team_id.is.null,division.is.null)`
          ),
        supabase
          .from("tournament_agreements")
          .select("team_id, coach_id, agreement_type, acknowledged, acknowledged_at, coach_name")
          .eq("team_id", teamId),
      ]);

      type CoachRow = {
        coach_id: string;
        role: string;
        profiles: { full_name: string | null; email: string } | Array<{ full_name: string | null; email: string }> | null;
      };
      const coachRows: Coach[] = ((coachesRes.data ?? []) as unknown as CoachRow[]).map((row) => {
        const p = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
        return {
          coach_id: row.coach_id,
          role: row.role,
          full_name: p?.full_name ?? null,
          email: p?.email ?? "",
        };
      });
      setCoaches(coachRows);
      setRegistrations((regsRes.data as Registration[]) ?? []);
      setTeamDocs((teamDocsRes.data as TeamDoc[]) ?? []);
      setAgreements((agreementsRes.data as Agreement[]) ?? []);

      const headCoach = coachRows.find((c) => c.role === "head");
      const headCoachId = headCoach?.coach_id ?? null;

      if (headCoachId) {
        const [certsRes, asstRes, regDocsRes] = await Promise.all([
          supabase
            .from("coach_certifications")
            .select("coach_id, cert_type, cert_file_path, cert_file_name")
            .eq("coach_id", headCoachId),
          supabase
            .from("assistant_coaches")
            .select("id, name, concussion_cert_path, concussion_cert_name, cardiac_cert_path, cardiac_cert_name")
            .eq("head_coach_id", headCoachId),
          (regsRes.data ?? []).length > 0
            ? supabase
                .from("player_documents")
                .select("registration_id, document_type, file_path, file_name")
                .in(
                  "registration_id",
                  ((regsRes.data ?? []) as Registration[]).map((r) => r.id)
                )
            : Promise.resolve({ data: [], error: null }),
        ]);
        setCerts((certsRes.data as CoachCert[]) ?? []);
        setAssistants((asstRes.data as AssistantCoach[]) ?? []);
        setPlayerDocs((regDocsRes.data as PlayerDoc[]) ?? []);
      } else if ((regsRes.data ?? []).length > 0) {
        const docsRes = await supabase
          .from("player_documents")
          .select("registration_id, document_type, file_path, file_name")
          .in("registration_id", ((regsRes.data ?? []) as Registration[]).map((r) => r.id));
        setPlayerDocs((docsRes.data as PlayerDoc[]) ?? []);
      }
      setLoading(false);
    })();
  }, [teamId]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading binder...</div>;
  }
  if (error) {
    return <div className="p-8 text-center text-flag-red">{error}</div>;
  }
  if (!team) return null;

  const headCoach = coaches.find((c) => c.role === "head") ?? null;
  const assistantCoachAccts = coaches.filter((c) => c.role !== "head");
  const ponyName = divisionToPonyName(team.division);
  const pitchingRule = getPitchingRuleForDivision(ponyName);
  const noPitchingRequired = pitchingRule ? !pitchingRule.hasPitching : false;

  // Section lookups
  const tournamentRulesDoc =
    teamDocs.find((d) => d.document_type === "tournament_rules" && d.division === team.division) ??
    teamDocs.find((d) => d.document_type === "tournament_rules" && d.division === null);
  const insuranceDoc = teamDocs.find((d) => d.document_type === "insurance_certificate");
  const affidavitDoc = teamDocs.find(
    (d) => d.document_type === "affidavit_final" && d.team_id === team.id
  );
  const affidavitPages = [1, 2, 3]
    .map((n) => ({
      n,
      doc: teamDocs.find(
        (d) => d.document_type === `affidavit_page_${n}` && d.team_id === team.id
      ),
    }))
    .filter((p) => p.doc);

  const playerHasDoc = (regId: string, type: string) =>
    playerDocs.find((d) => d.registration_id === regId && d.document_type === type);

  const concussionCert = certs.find((c) => c.cert_type === "concussion");
  const cardiacCert = certs.find((c) => c.cert_type === "cardiac_arrest");
  const headRulesAck = agreements.find(
    (a) => a.coach_id === headCoach?.coach_id && a.agreement_type === "tournament_rules"
  );

  const medicalCount = registrations.filter((r) => playerHasDoc(r.id, "medical_release")).length;
  const birthCertCount = registrations.filter((r) => playerHasDoc(r.id, "birth_certificate")).length;

  return (
    <div className="max-w-5xl mx-auto p-6 print:p-0 print:max-w-full">
      <style jsx global>{`
        @media print {
          body { background: white !important; }
          .no-print, .no-print-button, nav, footer { display: none !important; }
          .print-card { border: 1px solid #d4d4d4 !important; box-shadow: none !important; page-break-inside: avoid; }
          .print-page-break { page-break-before: always; }
        }
      `}</style>

      <div className="no-print mb-4 flex items-center justify-between">
        <Link
          href="/admin/compliance"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-charcoal"
        >
          <ArrowLeft size={14} />
          Back to Compliance
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold bg-flag-blue text-white hover:bg-flag-blue/90 transition-colors"
        >
          <Printer size={14} />
          Print Binder Index
        </button>
      </div>

      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-charcoal">
          Binder Index . {team.team_name}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Division: <span className="font-semibold text-charcoal">{team.division}</span>
          {headCoach && (
            <>
              {" "}. Head Coach: <span className="font-semibold text-charcoal">{headCoach.full_name ?? headCoach.email}</span>
            </>
          )}
          {assistantCoachAccts.length > 0 && (
            <>
              {" "}. Assistants: {assistantCoachAccts.map((a) => a.full_name ?? a.email).join(", ")}
            </>
          )}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Sections in tournament-binder order. Click View on any uploaded document to open + download.
        </p>
      </div>

      <div className="space-y-2">
        {/* 1. Pitching Log */}
        <BinderRow
          n={1}
          title="Tournament Pitching Log"
          status={
            noPitchingRequired ? (
              <StatusBadge ok={true} label="N/A" />
            ) : (
              <StatusBadge ok={true} />
            )
          }
          detail={
            noPitchingRequired
              ? `${ponyName} division has no live pitching`
              : pitchingRule
                ? `Max pitch count: ${pitchingRule.maxPitches}`
                : null
          }
          action={
            !noPitchingRequired && (
              <Link
                href="/coach/pitching-log"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-flag-blue text-white hover:bg-flag-blue/90 transition-colors no-print-button"
              >
                <Printer size={11} />
                View
              </Link>
            )
          }
        />

        {/* 2. Tournament Rules + Coach Acknowledgment */}
        <BinderRow
          n={2}
          title="Pre-Tournament Rules / Coach's Agreement"
          status={
            <StatusBadge ok={!!headRulesAck?.acknowledged && !!tournamentRulesDoc} />
          }
          detail={
            headRulesAck?.acknowledged
              ? `Acknowledged ${
                  headRulesAck.acknowledged_at
                    ? new Date(headRulesAck.acknowledged_at).toLocaleDateString()
                    : ""
                }${headRulesAck.coach_name ? ` by ${headRulesAck.coach_name}` : ""}`
              : "Head coach has not acknowledged tournament rules yet"
          }
          action={
            tournamentRulesDoc?.file_path && (
              <DocLink
                filePath={tournamentRulesDoc.file_path}
                fileName={tournamentRulesDoc.file_name}
                label="Rules PDF"
              />
            )
          }
        />

        {/* 3. Insurance */}
        <BinderRow
          n={3}
          title="Certificate of Liability Insurance"
          status={<StatusBadge ok={!!insuranceDoc?.file_path} />}
          detail={
            insuranceDoc
              ? `Uploaded ${
                  insuranceDoc.created_at
                    ? new Date(insuranceDoc.created_at).toLocaleDateString()
                    : ""
                }`
              : "Admin has not uploaded the league insurance certificate yet"
          }
          action={
            insuranceDoc?.file_path && (
              <DocLink filePath={insuranceDoc.file_path} fileName={insuranceDoc.file_name} />
            )
          }
        />

        {/* 4. Tournament Affidavit */}
        <div className="bg-white border border-gray-200 rounded-xl print-card">
          <BinderRow
            n={4}
            title="Tournament Affidavit"
            status={<StatusBadge ok={!!affidavitDoc?.file_path} />}
            detail={
              affidavitDoc
                ? `Signed bundle uploaded ${
                    affidavitDoc.created_at
                      ? new Date(affidavitDoc.created_at).toLocaleDateString()
                      : ""
                  }`
                : "Coach has not uploaded the signed final affidavit yet"
            }
            action={
              affidavitDoc?.file_path && (
                <DocLink
                  filePath={affidavitDoc.file_path}
                  fileName={affidavitDoc.file_name}
                  label="Bundle"
                />
              )
            }
            inline
          />
          {affidavitPages.length > 0 && (
            <div className="px-4 pb-3 pt-1 flex flex-wrap gap-1.5 border-t border-gray-100">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide self-center mr-1">
                Per page:
              </span>
              {affidavitPages.map(({ n, doc }) => (
                <button
                  key={n}
                  onClick={() =>
                    doc?.file_path &&
                    viewAndDownloadDoc(
                      doc.file_path,
                      doc.file_name ?? `affidavit-page-${n}.pdf`,
                      "player-documents"
                    )
                  }
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-flag-blue/10 text-flag-blue hover:bg-flag-blue/20 transition-colors no-print-button"
                >
                  <Printer size={10} />
                  Page {n}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 5. Medical Releases per player */}
        <PlayerDocsSection
          n={5}
          title="Medical Releases"
          docType="medical_release"
          completeCount={medicalCount}
          registrations={registrations}
          playerHasDoc={playerHasDoc}
        />

        {/* 6. Birth Certificates per player */}
        <PlayerDocsSection
          n={6}
          title="Birth Certificates"
          docType="birth_certificate"
          completeCount={birthCertCount}
          registrations={registrations}
          playerHasDoc={playerHasDoc}
        />

        {/* 7. Concussion Cert (head coach) */}
        <BinderRow
          n={7}
          title="Concussion Training Certificate (Head Coach)"
          status={<StatusBadge ok={!!concussionCert?.cert_file_path} />}
          detail={
            headCoach
              ? `${headCoach.full_name ?? headCoach.email}`
              : "No head coach assigned"
          }
          action={
            concussionCert?.cert_file_path && (
              <DocLink
                filePath={concussionCert.cert_file_path}
                fileName={concussionCert.cert_file_name}
              />
            )
          }
        />

        {/* 8. Cardiac Cert (head coach) */}
        <BinderRow
          n={8}
          title="Sudden Cardiac Arrest Certificate (Head Coach)"
          status={<StatusBadge ok={!!cardiacCert?.cert_file_path} />}
          detail={
            headCoach
              ? `${headCoach.full_name ?? headCoach.email}`
              : "No head coach assigned"
          }
          action={
            cardiacCert?.cert_file_path && (
              <DocLink
                filePath={cardiacCert.cert_file_path}
                fileName={cardiacCert.cert_file_name}
              />
            )
          }
        />

        {/* 9. Assistant Coach Certs */}
        <div className="bg-white border border-gray-200 rounded-xl print-card">
          <div className="p-4 flex items-start gap-3 border-b border-gray-100">
            <SectionNumber n={9} />
            <div className="flex-1 min-w-0">
              <h2 className="font-display text-base font-bold uppercase tracking-wider">
                Assistant Coach Certifications
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {assistants.length === 0
                  ? "No assistant coaches added by head coach"
                  : `${assistants.length} assistant${assistants.length === 1 ? "" : "s"}`}
              </p>
            </div>
          </div>
          {assistants.length > 0 && (
            <div className="divide-y divide-gray-100">
              {assistants.map((a) => (
                <div
                  key={a.id}
                  className="px-4 py-2.5 flex flex-wrap items-center gap-3"
                >
                  <span className="text-sm font-semibold text-charcoal flex-1 min-w-0">
                    {a.name}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wide">
                      Concussion
                    </span>
                    {a.concussion_cert_path ? (
                      <DocLink filePath={a.concussion_cert_path} fileName={a.concussion_cert_name} label="View" />
                    ) : (
                      <XCircle size={14} className="text-gray-300" />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wide">
                      Cardiac
                    </span>
                    {a.cardiac_cert_path ? (
                      <DocLink filePath={a.cardiac_cert_path} fileName={a.cardiac_cert_name} label="View" />
                    ) : (
                      <XCircle size={14} className="text-gray-300" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionNumber({ n }: { n: number }) {
  return (
    <div className="shrink-0 w-7 h-7 rounded-full bg-flag-blue text-white flex items-center justify-center text-xs font-bold">
      {n}
    </div>
  );
}

function BinderRow({
  n,
  title,
  status,
  detail,
  action,
  inline,
}: {
  n: number;
  title: string;
  status: React.ReactNode;
  detail?: React.ReactNode;
  action?: React.ReactNode;
  inline?: boolean;
}) {
  const wrapClass = inline
    ? "p-4 flex flex-wrap items-center gap-3"
    : "bg-white border border-gray-200 rounded-xl print-card p-4 flex flex-wrap items-center gap-3";
  return (
    <div className={wrapClass}>
      <SectionNumber n={n} />
      <div className="flex-1 min-w-0">
        <h2 className="font-display text-base font-bold uppercase tracking-wider text-charcoal">
          {title}
        </h2>
        {detail && <p className="text-xs text-gray-500 mt-0.5">{detail}</p>}
      </div>
      {status}
      {action}
    </div>
  );
}

function PlayerDocsSection({
  n,
  title,
  docType,
  completeCount,
  registrations,
  playerHasDoc,
}: {
  n: number;
  title: string;
  docType: string;
  completeCount: number;
  registrations: Registration[];
  playerHasDoc: (id: string, t: string) => PlayerDoc | undefined;
}) {
  const total = registrations.length;
  return (
    <div className="bg-white border border-gray-200 rounded-xl print-card">
      <div className="p-4 flex items-start gap-3 border-b border-gray-100">
        <SectionNumber n={n} />
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-base font-bold uppercase tracking-wider">{title}</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {completeCount} of {total} players complete
          </p>
        </div>
        {completeCount === total && total > 0 ? (
          <StatusBadge ok={true} />
        ) : (
          <StatusBadge ok={false} />
        )}
      </div>
      {total === 0 ? (
        <div className="p-4 text-xs text-gray-400">No players on this team yet.</div>
      ) : (
        <div className="divide-y divide-gray-100">
          {registrations.map((r) => {
            const doc = playerHasDoc(r.id, docType);
            return (
              <div
                key={r.id}
                className="px-4 py-2 flex items-center gap-3"
              >
                {doc ? (
                  <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                ) : (
                  <XCircle size={14} className="text-gray-300 shrink-0" />
                )}
                <span className="text-sm text-charcoal flex-1 min-w-0">
                  {r.player_first_name} {r.player_last_name}
                </span>
                {doc?.file_path ? (
                  <DocLink filePath={doc.file_path} fileName={doc.file_name} />
                ) : (
                  <span className="text-[10px] text-gray-400 uppercase tracking-wide">
                    Pending
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

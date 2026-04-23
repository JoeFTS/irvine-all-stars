"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { HelpTooltip } from "@/components/help-tooltip";
import FileUpload from "@/components/file-upload";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Phone,
  Mail,
  Shield,
  ExternalLink,
  Clock,
  UserCheck,
  FileUp,
  Users,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Registration {
  id: string;
  player_first_name: string;
  player_last_name: string;
  division: string;
  team_id: string | null;
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
  secondary_parent_name: string | null;
  secondary_parent_email: string | null;
  secondary_parent_phone: string | null;
  status: string;
}

interface PlayerDocument {
  registration_id: string;
  document_type: string;
  file_path: string | null;
}

interface PlayerContract {
  registration_id: string;
}

interface MyTeam {
  id: string;
  division: string;
  team_name: string;
  role: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const POOL_TAB = "__pool__";

const SELECT_COLS =
  "id, player_first_name, player_last_name, division, team_id, jersey_number, primary_position, secondary_position, bats, throws, parent_name, parent_email, parent_phone, emergency_contact_name, emergency_contact_phone, secondary_parent_name, secondary_parent_email, secondary_parent_phone, status";

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
  const hasSignedContract = contracts.some((c) => c.registration_id === regId);
  const hasUploadedContract = regDocs.some(
    (d) => d.document_type === "signed_contract"
  );
  const hasContract = hasSignedContract || hasUploadedContract;
  const hasMedical = regDocs.some((d) => d.document_type === "medical_release");

  return {
    birthCert: hasBirthCert,
    photo: hasPhoto,
    contract: hasContract,
    contractSigned: hasSignedContract,
    contractUploaded: hasUploadedContract,
    medical: hasMedical,
    ready: hasBirthCert && hasPhoto && hasContract && hasMedical,
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
      className={`bg-white border rounded-2xl p-4 md:p-5 ${colors[accent]}`}
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
  onClickMissing,
}: {
  label: string;
  ok: boolean;
  okText: string;
  missingText: string;
  onClick?: () => void;
  onClickMissing?: () => void;
}) {
  const badge = ok ? (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 min-h-[44px] rounded-full text-xs font-semibold bg-green-100 text-green-700 ${
        onClick ? "cursor-pointer hover:bg-green-200 transition-colors" : ""
      }`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
    >
      <CheckCircle2 size={12} />
      {okText}
      {onClick && <ExternalLink size={10} className="ml-0.5" />}
    </span>
  ) : onClickMissing ? (
    <span
      className="inline-flex items-center gap-1 px-2 py-1 min-h-[44px] rounded-full text-xs font-semibold bg-red-100 text-flag-red cursor-pointer hover:bg-red-200 transition-colors"
      onClick={onClickMissing}
      role="button"
    >
      <XCircle size={12} />
      {missingText}
      <FileUp size={10} className="ml-0.5" />
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

/* ------------------------------------------------------------------ */
/*  Player Card                                                        */
/* ------------------------------------------------------------------ */

function PlayerCard({
  reg,
  compliance,
  docs,
  docUploadOpen,
  onOpenUpload,
  onCloseUpload,
  onDocUpload,
}: {
  reg: Registration;
  compliance: ReturnType<typeof getPlayerCompliance>;
  docs: PlayerDocument[];
  docUploadOpen: { regId: string; docType: string } | null;
  onOpenUpload: (regId: string, docType: string) => void;
  onCloseUpload: () => void;
  onDocUpload: (
    regId: string,
    playerName: string,
    division: string,
    docType: string,
    filePath: string,
    fileName: string
  ) => void;
}) {
  const uploadingDocType =
    docUploadOpen?.regId === reg.id ? docUploadOpen.docType : null;
  const playerName = `${reg.player_first_name} ${reg.player_last_name}`;
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
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

        {/* Second Parent/Guardian */}
        {(reg.secondary_parent_name || reg.secondary_parent_email || reg.secondary_parent_phone) && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
              Second Parent / Guardian
            </p>
            {reg.secondary_parent_name && (
              <p className="text-sm font-medium text-charcoal mb-1">
                {reg.secondary_parent_name}
              </p>
            )}
            <div className="space-y-1">
              {reg.secondary_parent_email && (
                <a
                  href={`mailto:${reg.secondary_parent_email}`}
                  className="flex items-center gap-1.5 text-sm text-flag-blue hover:underline"
                >
                  <Mail size={14} className="shrink-0" />
                  <span className="truncate">{reg.secondary_parent_email}</span>
                </a>
              )}
              {reg.secondary_parent_phone && (
                <a
                  href={`tel:${reg.secondary_parent_phone}`}
                  className="flex items-center gap-1.5 text-sm text-flag-blue hover:underline"
                >
                  <Phone size={14} className="shrink-0" />
                  {reg.secondary_parent_phone}
                </a>
              )}
            </div>
          </div>
        )}
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
          onClickMissing={!compliance.birthCert ? () => onOpenUpload(reg.id, "birth_certificate") : undefined}
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
          onClickMissing={!compliance.photo ? () => onOpenUpload(reg.id, "player_photo") : undefined}
        />
        <DocBadge
          label="Contract"
          ok={compliance.contract}
          okText={compliance.contractUploaded && !compliance.contractSigned ? "Uploaded" : "Signed"}
          missingText="Not Signed"
          onClick={compliance.contract ? async () => {
            if (compliance.contractSigned) {
              window.open(`/contract-view?id=${reg.id}`, "_blank");
              return;
            }
            const doc = docs.find(d => d.registration_id === reg.id && d.document_type === "signed_contract");
            if (doc?.file_path && supabase) {
              const { data } = await supabase.storage.from("player-documents").createSignedUrl(doc.file_path, 300);
              if (data?.signedUrl) window.open(data.signedUrl, "_blank");
            }
          } : undefined}
        />
        <DocBadge
          label="Medical"
          ok={compliance.medical}
          okText="Complete"
          missingText="Pending"
          onClick={compliance.medical ? () => {
            window.open(`/medical-view?id=${reg.id}`, "_blank");
          } : undefined}
        />
      </div>

      {/* Inline upload section (coach uploading on behalf of parent) */}
      {uploadingDocType && (
        <div className="p-4 md:p-5 border-t border-gray-100 bg-blue-50/30">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-flag-blue">
              Upload{" "}
              {uploadingDocType === "birth_certificate"
                ? "Birth Certificate"
                : "Player Photo"}{" "}
              for {playerName}
            </p>
            <button
              type="button"
              onClick={onCloseUpload}
              className="text-xs text-gray-500 hover:text-charcoal font-semibold uppercase tracking-wide"
            >
              Cancel
            </button>
          </div>
          <FileUpload
            bucket="player-documents"
            folder={
              uploadingDocType === "birth_certificate"
                ? `birth-certs/${reg.id}`
                : `player-photos/${reg.id}`
            }
            label={
              uploadingDocType === "birth_certificate"
                ? "Birth Certificate"
                : "Player Photo"
            }
            description={
              uploadingDocType === "birth_certificate"
                ? "Upload a scan or photo of the player's birth certificate (image or PDF)."
                : "Upload a recent headshot-style photo of the player (image only)."
            }
            accept={
              uploadingDocType === "birth_certificate"
                ? "image/*,.pdf"
                : "image/*"
            }
            maxSizeMB={10}
            onUploadComplete={(filePath, fileName) => {
              onDocUpload(
                reg.id,
                playerName,
                reg.division,
                uploadingDocType,
                filePath,
                fileName
              );
              onCloseUpload();
            }}
          />
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

interface AwaitingPlayer {
  id: string;
  player_first_name: string;
  player_last_name: string;
  division: string;
  team_id: string | null;
  primary_position: string;
  parent_name: string;
  parent_email: string;
  status: string;
  accepted: boolean;
}

export default function CoachRosterPage() {
  const { user } = useAuth();
  const [drafted, setDrafted] = useState<Registration[]>([]);
  const [undrafted, setUndrafted] = useState<Registration[]>([]);
  const [documents, setDocuments] = useState<PlayerDocument[]>([]);
  const [contracts, setContracts] = useState<PlayerContract[]>([]);
  const [awaitingPlayers, setAwaitingPlayers] = useState<AwaitingPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpenFor, setUploadOpenFor] = useState<string | null>(null);
  const [docUploadOpen, setDocUploadOpen] = useState<{
    regId: string;
    docType: string;
  } | null>(null);
  const [myTeams, setMyTeams] = useState<MyTeam[]>([]);
  const [teamsLoaded, setTeamsLoaded] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch coach's team assignments
  useEffect(() => {
    if (!supabase || !user) return;
    (async () => {
      const { data, error: err } = await supabase
        .from("team_coaches")
        .select(
          "role, teams!team_coaches_team_id_fkey ( id, division, team_name )"
        )
        .eq("coach_id", user.id);
      if (err) {
        setError(err.message);
        setTeamsLoaded(true);
        return;
      }
      const teams: MyTeam[] = (data ?? []).flatMap((r: unknown) => {
        const row = r as { role: string; teams: unknown };
        const t = Array.isArray(row.teams) ? row.teams[0] : row.teams;
        const team = t as
          | { id: string; division: string; team_name: string }
          | null
          | undefined;
        return team
          ? [
              {
                id: team.id,
                division: team.division,
                team_name: team.team_name,
                role: row.role,
              },
            ]
          : [];
      });
      // Sort: head coach assignments first, then by team name
      teams.sort((a, b) => {
        if (a.role !== b.role) return a.role === "head" ? -1 : 1;
        return a.team_name.localeCompare(b.team_name);
      });
      setMyTeams(teams);
      setSelectedTeamId(teams[0]?.id ?? POOL_TAB);
      setTeamsLoaded(true);
    })();
  }, [user]);

  useEffect(() => {
    if (!teamsLoaded) return;
    fetchAll(myTeams);
  }, [teamsLoaded, myTeams]);

  async function fetchAll(teams: MyTeam[]) {
    if (!supabase) return;
    setLoading(true);

    const teamIds = teams.map((t) => t.id);
    const myDivisions = [...new Set(teams.map((t) => t.division))];

    const [draftedRes, undraftedRes, docsRes, contractsRes] = await Promise.all([
      teamIds.length > 0
        ? supabase
            .from("tryout_registrations")
            .select(SELECT_COLS)
            .in("team_id", teamIds)
            .in("status", ["selected", "alternate"])
            .order("team_id")
            .order("player_last_name")
        : Promise.resolve({ data: [] as Registration[], error: null }),
      myDivisions.length > 0
        ? supabase
            .from("tryout_registrations")
            .select(SELECT_COLS)
            .is("team_id", null)
            .in("division", myDivisions)
            .in("status", ["selected", "alternate"])
            .order("division")
            .order("player_last_name")
        : Promise.resolve({ data: [] as Registration[], error: null }),
      supabase.from("player_documents").select("registration_id, document_type, file_path"),
      supabase.from("player_contracts").select("registration_id"),
    ]);

    const fetchErr =
      draftedRes.error ||
      undraftedRes.error ||
      docsRes.error ||
      contractsRes.error;
    if (fetchErr) {
      setError(fetchErr.message ?? "Failed to load roster");
      setLoading(false);
      return;
    }

    const draftedRegs = (draftedRes.data ?? []) as Registration[];
    const undraftedRegs = (undraftedRes.data ?? []) as Registration[];
    const allDocs = (docsRes.data ?? []) as PlayerDocument[];
    const allContracts = (contractsRes.data ?? []) as PlayerContract[];

    // Determine acceptance status (selection_acceptance doc) for drafted players
    const acceptedIds = new Set(
      allDocs
        .filter((d) => d.document_type === "selection_acceptance")
        .map((d) => d.registration_id)
    );

    // Players with a contract on file (e-signed online OR uploaded by coach)
    const signedRegIds = new Set(allContracts.map((c) => c.registration_id));
    const uploadedContractIds = new Set(
      allDocs
        .filter((d) => d.document_type === "signed_contract")
        .map((d) => d.registration_id)
    );
    const rosterIds = new Set([...signedRegIds, ...uploadedContractIds]);

    // Roster = drafted players who have a contract
    const onRoster = draftedRegs.filter((r) => rosterIds.has(r.id));
    setDrafted(onRoster);

    // Awaiting acceptance = drafted but no contract yet
    const awaiting: AwaitingPlayer[] = draftedRegs
      .filter((r) => !rosterIds.has(r.id))
      .map((r) => ({
        id: r.id,
        player_first_name: r.player_first_name,
        player_last_name: r.player_last_name,
        division: r.division,
        team_id: r.team_id,
        primary_position: r.primary_position,
        parent_name: r.parent_name,
        parent_email: r.parent_email,
        status: r.status,
        accepted: acceptedIds.has(r.id),
      }));
    setAwaitingPlayers(awaiting);

    setUndrafted(undraftedRegs);
    setDocuments(allDocs);
    setContracts(allContracts);
    setLoading(false);
  }

  async function handleDocUpload(
    regId: string,
    playerName: string,
    division: string,
    docType: string,
    filePath: string,
    fileName: string
  ) {
    if (!supabase || !user) return;
    const { error: insErr } = await supabase.from("player_documents").insert({
      registration_id: regId,
      player_name: playerName,
      division,
      document_type: docType,
      file_path: filePath,
      file_name: fileName,
      uploaded_by: user.id,
      status: "approved",
    });
    if (insErr) {
      console.error("Failed to record uploaded doc:", insErr.message);
      return;
    }
    await fetchAll(myTeams);
  }

  async function handleContractUpload(
    reg: AwaitingPlayer,
    filePath: string,
    fileName: string
  ) {
    if (!supabase || !user) return;
    const { error: insErr } = await supabase.from("player_documents").insert({
      registration_id: reg.id,
      player_name: `${reg.player_first_name} ${reg.player_last_name}`,
      division: reg.division,
      document_type: "signed_contract",
      file_path: filePath,
      file_name: fileName,
      uploaded_by: user.id,
      status: "approved",
    });
    if (insErr) {
      console.error("Failed to record uploaded contract:", insErr.message);
      return;
    }
    await fetchAll(myTeams);
  }

  /* ---- Filtered data based on selected tab ---- */

  const isPoolTab = selectedTeamId === POOL_TAB;
  const selectedTeam = myTeams.find((t) => t.id === selectedTeamId) ?? null;

  const visibleRoster = isPoolTab
    ? []
    : drafted.filter((r) => r.team_id === selectedTeamId);

  const visibleAwaiting = isPoolTab
    ? []
    : awaitingPlayers.filter((p) => p.team_id === selectedTeamId);

  // For pool tab: all undrafted in coach's divisions (we may show grouped by division)
  const visiblePool = isPoolTab ? undrafted : [];

  const complianceMap = new Map(
    [...drafted, ...undrafted].map((r) => [
      r.id,
      getPlayerCompliance(r.id, documents, contracts),
    ])
  );

  const totalPlayers = isPoolTab ? visiblePool.length : visibleRoster.length;
  const readyCount = (isPoolTab ? visiblePool : visibleRoster).filter(
    (r) => complianceMap.get(r.id)?.ready
  ).length;
  const needsAttentionCount = totalPlayers - readyCount;

  /* ---- Supabase not configured ---- */

  if (!supabase) {
    return (
      <div className="p-6 md:p-10">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

  /* ---- Coach has no team assignments ---- */

  if (myTeams.length === 0) {
    return (
      <div className="p-6 md:p-10 space-y-6">
        <div>
          <p className="font-display text-sm font-semibold text-flag-red uppercase tracking-[3px] mb-1">
            Coach
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide flex items-center">
            Team Roster
            <HelpTooltip
              text="View your complete team roster with player details and contact info."
              guideUrl="/coach/help"
            />
          </h1>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
          <Users size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="font-display text-lg font-bold uppercase tracking-wide text-charcoal mb-2">
            No Team Assigned Yet
          </p>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            You haven&apos;t been assigned to a team yet. Contact your league
            admin to get connected to your roster.
          </p>
          {error && (
            <p className="text-xs text-flag-red mt-4">Error: {error}</p>
          )}
        </div>
      </div>
    );
  }

  /* ---- Pool: group undrafted by division if more than one ---- */
  const poolByDivision = new Map<string, Registration[]>();
  for (const r of visiblePool) {
    if (!poolByDivision.has(r.division)) poolByDivision.set(r.division, []);
    poolByDivision.get(r.division)!.push(r);
  }
  const poolDivisions = [...poolByDivision.keys()];

  return (
    <div className="p-6 md:p-10 space-y-6">
      {/* ---- Header ---- */}
      <div>
        <p className="font-display text-sm font-semibold text-flag-red uppercase tracking-[3px] mb-1">
          Coach
        </p>
        <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide flex items-center">
          {isPoolTab ? "Undrafted Pool" : selectedTeam?.team_name ?? "Team Roster"}
          <HelpTooltip
            text="Switch tabs to view each team you coach plus the undrafted player pool for your division(s)."
            guideUrl="/coach/help"
          />
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {isPoolTab
            ? `Players still up for draft in ${poolDivisions.length > 0 ? poolDivisions.map(divisionShortName).join(", ") : myTeams.map((t) => divisionShortName(t.division)).join(", ")}`
            : selectedTeam
              ? `${selectedTeam.division}${selectedTeam.role === "head" ? " · Head Coach" : " · Assistant Coach"}`
              : null}
          {totalPlayers > 0 &&
            ` · ${totalPlayers} player${totalPlayers !== 1 ? "s" : ""}`}
        </p>
      </div>

      {/* ---- Team Tabs ---- */}
      <div className="flex flex-wrap gap-2">
        {myTeams.map((team) => {
          const active = selectedTeamId === team.id;
          const teamCount = drafted.filter((r) => r.team_id === team.id).length;
          return (
            <button
              key={team.id}
              type="button"
              onClick={() => setSelectedTeamId(team.id)}
              className={`px-3 py-2 min-h-[44px] rounded-full text-xs font-semibold uppercase tracking-wide border transition-colors ${
                active
                  ? "bg-flag-blue text-white border-flag-blue"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-charcoal"
              }`}
            >
              {team.team_name}
              {teamCount > 0 && (
                <span
                  className={`ml-1.5 inline-flex items-center justify-center min-w-[20px] px-1.5 rounded-full text-[10px] font-bold ${
                    active
                      ? "bg-white/20 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {teamCount}
                </span>
              )}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setSelectedTeamId(POOL_TAB)}
          className={`px-3 py-2 min-h-[44px] rounded-full text-xs font-semibold uppercase tracking-wide border transition-colors ${
            isPoolTab
              ? "bg-flag-blue text-white border-flag-blue"
              : "bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-charcoal"
          }`}
        >
          Undrafted Pool
          {undrafted.length > 0 && (
            <span
              className={`ml-1.5 inline-flex items-center justify-center min-w-[20px] px-1.5 rounded-full text-[10px] font-bold ${
                isPoolTab ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              {undrafted.length}
            </span>
          )}
        </button>
      </div>

      {/* ---- Summary Stats ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <StatCard
          label={isPoolTab ? "In Pool" : "Total Players"}
          value={totalPlayers}
          accent="blue"
        />
        <StatCard label="Tournament Ready" value={readyCount} accent="green" />
        <StatCard
          label="Needs Attention"
          value={needsAttentionCount}
          accent="red"
        />
      </div>

      {/* ---- Awaiting Acceptance (team tabs only) ---- */}
      {!isPoolTab && visibleAwaiting.length > 0 && (
        <div>
          <h2 className="font-display text-lg font-bold uppercase tracking-wide mb-3 flex items-center gap-2">
            <Clock size={18} className="text-amber-500" />
            Awaiting Response ({visibleAwaiting.length})
          </h2>
          <div className="space-y-2 mb-6">
            {visibleAwaiting.map((p) => (
              <div
                key={p.id}
                className="bg-white border border-amber-200 rounded-2xl p-4"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-charcoal">
                        {p.player_first_name} {p.player_last_name}
                      </p>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${
                        p.status === "selected"
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {p.status === "selected" ? "Selected" : "Alternate"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {p.primary_position} &middot; Parent: {p.parent_name} ({p.parent_email})
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    {p.accepted ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        <UserCheck size={14} />
                        Accepted — Awaiting Contract
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                        <Clock size={14} />
                        Awaiting Parent Response
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setUploadOpenFor(uploadOpenFor === p.id ? null : p.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[44px] rounded-full text-xs font-semibold text-flag-blue bg-white border border-flag-blue/30 hover:bg-flag-blue/10 transition-colors"
                    >
                      <FileUp size={14} />
                      {uploadOpenFor === p.id ? "Close" : "Upload Contract"}
                    </button>
                  </div>
                </div>
                {uploadOpenFor === p.id && (
                  <div className="mt-4 pt-4 border-t border-amber-200">
                    <FileUpload
                      bucket="player-documents"
                      folder={`signed-contracts/${p.id}`}
                      label="Signed Contract"
                      description="Upload the player's signed contract (PDF or image). This will move them onto your roster."
                      accept="image/*,.pdf"
                      maxSizeMB={15}
                      onUploadComplete={(filePath, fileName) => {
                        handleContractUpload(p, filePath, fileName);
                        setUploadOpenFor(null);
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---- Roster Cards (team tab) ---- */}
      {!isPoolTab && (
        visibleRoster.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
            <Shield size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              No players on your roster yet. Players appear here after they are
              drafted to this team and their parent signs the player contract.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {visibleRoster.map((reg) => (
              <PlayerCard
                key={reg.id}
                reg={reg}
                compliance={
                  complianceMap.get(reg.id) ?? {
                    birthCert: false,
                    photo: false,
                    contract: false,
                    contractSigned: false,
                    contractUploaded: false,
                    medical: false,
                    ready: false,
                  }
                }
                docs={documents}
                docUploadOpen={docUploadOpen}
                onOpenUpload={(regId, docType) =>
                  setDocUploadOpen({ regId, docType })
                }
                onCloseUpload={() => setDocUploadOpen(null)}
                onDocUpload={handleDocUpload}
              />
            ))}
          </div>
        )
      )}

      {/* ---- Pool Tab content ---- */}
      {isPoolTab && (
        visiblePool.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
            <Users size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              No undrafted players in your division
              {myTeams.length > 1 ? "s" : ""} right now. Once tryouts wrap and
              players are marked selected/alternate, they will appear here until
              you draft them onto a team.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {poolDivisions.map((div) => (
              <div key={div}>
                {poolDivisions.length > 1 && (
                  <h2 className="font-display text-lg font-bold uppercase tracking-wide mb-3 flex items-center gap-2">
                    <DivisionBadge division={div} />
                    <span>
                      {poolByDivision.get(div)!.length} undrafted
                    </span>
                  </h2>
                )}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {poolByDivision.get(div)!.map((reg) => (
                    <PlayerCard
                      key={reg.id}
                      reg={reg}
                      compliance={
                        complianceMap.get(reg.id) ?? {
                          birthCert: false,
                          photo: false,
                          contract: false,
                          contractSigned: false,
                          contractUploaded: false,
                          medical: false,
                          ready: false,
                        }
                      }
                      docs={documents}
                      docUploadOpen={docUploadOpen}
                      onOpenUpload={(regId, docType) =>
                        setDocUploadOpen({ regId, docType })
                      }
                      onCloseUpload={() => setDocUploadOpen(null)}
                      onDocUpload={handleDocUpload}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  UserPlus,
  Zap,
  X,
  MapPin,
  Clock,
  Users,
  Mail,
  Send,
  Check,
  Pencil,
  CheckSquare,
  Square,
  AlertTriangle,
} from "lucide-react";

/* ---------- Types ---------- */

type Status =
  | "registered"
  | "invited"
  | "confirmed"
  | "tryout_complete"
  | "selected"
  | "not_selected"
  | "alternate"
  | "withdrawn";

type Tab = "players" | "sessions";

interface Registration {
  id: string;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  player_first_name: string;
  player_last_name: string;
  player_date_of_birth: string;
  division: string;
  primary_position: string;
  secondary_position: string | null;
  bats: string;
  throws: string;
  current_team: string | null;
  jersey_number: string | null;
  medical_conditions: string | null;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  photo_release_consent: boolean;
  liability_waiver_consent: boolean;
  parent_code_of_conduct: boolean;
  status: Status;
  submitted_at: string;
}

interface TryoutSession {
  id: string;
  division: string;
  session_date: string;
  start_time: string;
  end_time: string | null;
  location: string;
  field: string | null;
  notes: string | null;
  max_players: number;
  created_at: string;
}

interface TryoutAssignment {
  id: string;
  session_id: string;
  registration_id: string;
  checked_in: boolean;
  checked_in_at: string | null;
  invited_at: string | null;
  created_at: string;
}

/* ---------- Constants ---------- */

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
];

const DIVISION_COLORS: Record<string, string> = {
  "5U-Shetland": "bg-purple-500",
  "6U-Shetland": "bg-purple-400",
  "7U MP-Pinto": "bg-blue-500",
  "7U KP-Pinto": "bg-blue-400",
  "8U MP-Pinto": "bg-cyan-500",
  "8U KP-Pinto": "bg-cyan-400",
  "9U-Mustang": "bg-green-500",
  "10U-Mustang": "bg-green-400",
  "11U-Bronco": "bg-orange-500",
  "12U-Bronco": "bg-orange-400",
};

const STATUS_OPTIONS: { value: Status; label: string; color: string }[] = [
  { value: "registered", label: "Registered", color: "bg-gray-100 text-gray-600" },
  { value: "invited", label: "Invited", color: "bg-blue-50 text-blue-600" },
  { value: "confirmed", label: "Confirmed", color: "bg-green-100 text-green-700" },
  { value: "tryout_complete", label: "Tryout Complete", color: "bg-blue-100 text-blue-700" },
  { value: "selected", label: "Selected", color: "bg-green-100 text-green-800 font-bold" },
  { value: "not_selected", label: "Not Selected", color: "bg-gray-100 text-gray-500" },
  { value: "alternate", label: "Alternate", color: "bg-orange-100 text-orange-700" },
  { value: "withdrawn", label: "Withdrawn", color: "bg-flag-red/10 text-flag-red" },
];

/* ---------- Helpers ---------- */

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${display}:${m} ${ampm}`;
}

function StatusBadge({ status }: { status: Status }) {
  const opt = STATUS_OPTIONS.find((s) => s.value === status) ?? STATUS_OPTIONS[0];
  return (
    <span
      className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${opt.color}`}
    >
      {opt.label}
    </span>
  );
}

/* ---------- Component ---------- */

export default function TryoutsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("players");

  // Data
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [sessions, setSessions] = useState<TryoutSession[]>([]);
  const [assignments, setAssignments] = useState<TryoutAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  // Players tab state
  const [divisionFilter, setDivisionFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Bulk select state
  const [bulkSelectedIds, setBulkSelectedIds] = useState<Set<string>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0, emailsSent: 0, emailsFailed: 0 });

  // Sessions tab state
  const [sessionDivisionFilter, setSessionDivisionFilter] = useState<string>("all");
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  // Assign modal
  const [assigningSessionId, setAssigningSessionId] = useState<string | null>(null);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set());

  // Create session form
  const [formDivision, setFormDivision] = useState(DIVISIONS[0]);
  const [formDate, setFormDate] = useState("");
  const [formStartTime, setFormStartTime] = useState("");
  const [formEndTime, setFormEndTime] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formField, setFormField] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formMaxPlayers, setFormMaxPlayers] = useState(30);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Edit session
  const [editingSession, setEditingSession] = useState<TryoutSession | null>(null);
  const [editDivision, setEditDivision] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editField, setEditField] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editMaxPlayers, setEditMaxPlayers] = useState(30);
  const [saving, setSaving] = useState(false);

  // Auto-assign
  const [autoAssigning, setAutoAssigning] = useState(false);
  const [autoAssignResult, setAutoAssignResult] = useState<string | null>(null);

  /* ---------- Data Fetching ---------- */

  const fetchAll = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);

    const [regsRes, sessionsRes, assignmentsRes] = await Promise.all([
      supabase
        .from("tryout_registrations")
        .select("*")
        .order("submitted_at", { ascending: false }),
      supabase
        .from("tryout_sessions")
        .select("*")
        .order("session_date")
        .order("start_time"),
      supabase.from("tryout_assignments").select("*"),
    ]);

    if (regsRes.data) setRegistrations(regsRes.data);
    if (sessionsRes.data) setSessions(sessionsRes.data);
    if (assignmentsRes.data) setAssignments(assignmentsRes.data);

    setLoading(false);
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    fetchAll();
  }, [fetchAll]);

  /* ---------- Stats ---------- */

  const totalRegistered = registrations.length;
  const totalSessions = sessions.length;
  const totalInvited = assignments.filter((a) => a.invited_at).length;

  /* ---------- Status Update (Players Tab) ---------- */

  async function updateStatus(id: string, newStatus: Status) {
    if (!supabase) return;
    setUpdatingId(id);
    const { error } = await supabase
      .from("tryout_registrations")
      .update({ status: newStatus })
      .eq("id", id);

    if (!error) {
      setRegistrations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      );

      // Send selection notification emails
      if (newStatus === "selected" || newStatus === "not_selected" || newStatus === "alternate") {
        const reg = registrations.find((r) => r.id === id);
        if (reg) {
          try {
            await fetch("/api/send-selection", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                registration_id: id,
                status: newStatus,
                division: reg.division,
                player_name: `${reg.player_first_name} ${reg.player_last_name}`,
                parent_name: reg.parent_name,
                parent_email: reg.parent_email,
              }),
            });
          } catch {
            // Email failure shouldn't block status update
          }
        }
      }
    }
    setUpdatingId(null);
  }

  /* ---------- Bulk Status Update ---------- */

  function toggleBulkSelect(id: string) {
    setBulkSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllFiltered() {
    const allFilteredIds = filteredPlayers.map((r) => r.id);
    const allSelected = allFilteredIds.every((id) => bulkSelectedIds.has(id));
    if (allSelected) {
      setBulkSelectedIds((prev) => {
        const next = new Set(prev);
        allFilteredIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setBulkSelectedIds((prev) => {
        const next = new Set(prev);
        allFilteredIds.forEach((id) => next.add(id));
        return next;
      });
    }
  }

  async function bulkUpdateStatus(newStatus: Status) {
    if (!supabase || bulkSelectedIds.size === 0) return;
    const ids = Array.from(bulkSelectedIds);
    const sendEmail = newStatus === "selected" || newStatus === "not_selected" || newStatus === "alternate";

    setBulkUpdating(true);
    setBulkProgress({ done: 0, total: ids.length, emailsSent: 0, emailsFailed: 0 });

    let emailsSent = 0;
    let emailsFailed = 0;

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const { error } = await supabase
        .from("tryout_registrations")
        .update({ status: newStatus })
        .eq("id", id);

      if (!error) {
        setRegistrations((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
        );

        if (sendEmail) {
          const reg = registrations.find((r) => r.id === id);
          if (reg) {
            try {
              const res = await fetch("/api/send-selection", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  registration_id: id,
                  status: newStatus,
                  division: reg.division,
                  player_name: `${reg.player_first_name} ${reg.player_last_name}`,
                  parent_name: reg.parent_name,
                  parent_email: reg.parent_email,
                }),
              });
              if (res.ok) emailsSent++;
              else emailsFailed++;
            } catch {
              emailsFailed++;
            }
          }
        }
      }

      setBulkProgress({ done: i + 1, total: ids.length, emailsSent, emailsFailed });
    }

    setBulkSelectedIds(new Set());
    setBulkUpdating(false);
  }

  /* ---------- Session CRUD ---------- */

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setCreating(true);
    setCreateError(null);

    const { error } = await supabase.from("tryout_sessions").insert({
      division: formDivision,
      session_date: formDate,
      start_time: formStartTime,
      end_time: formEndTime || null,
      location: formLocation.trim(),
      field: formField.trim() || null,
      notes: formNotes.trim() || null,
      max_players: formMaxPlayers,
    });

    if (error) {
      setCreateError(error.message);
    } else {
      setFormDate("");
      setFormStartTime("");
      setFormEndTime("");
      setFormLocation("");
      setFormField("");
      setFormNotes("");
      setFormMaxPlayers(30);
      await fetchAll();
    }
    setCreating(false);
  }

  async function handleDelete(id: string) {
    if (!supabase) return;
    await supabase.from("tryout_assignments").delete().eq("session_id", id);
    const { error } = await supabase.from("tryout_sessions").delete().eq("id", id);
    if (!error) {
      setSessions((prev) => prev.filter((s) => s.id !== id));
      setAssignments((prev) => prev.filter((a) => a.session_id !== id));
    }
    setDeletingId(null);
  }

  /* ---------- Edit Session ---------- */

  function startEditing(session: TryoutSession) {
    setEditingSession(session);
    setEditDivision(session.division);
    setEditDate(session.session_date);
    setEditStartTime(session.start_time);
    setEditEndTime(session.end_time || "");
    setEditLocation(session.location);
    setEditField(session.field || "");
    setEditNotes(session.notes || "");
    setEditMaxPlayers(session.max_players);
  }

  async function handleSaveEdit() {
    if (!supabase || !editingSession) return;
    setSaving(true);

    const { error } = await supabase
      .from("tryout_sessions")
      .update({
        division: editDivision,
        session_date: editDate,
        start_time: editStartTime,
        end_time: editEndTime || null,
        location: editLocation.trim(),
        field: editField.trim() || null,
        notes: editNotes.trim() || null,
        max_players: editMaxPlayers,
      })
      .eq("id", editingSession.id);

    if (!error) {
      // Send update emails to all previously invited players in this session
      const invitedAssignments = assignments.filter(
        (a) => a.session_id === editingSession.id && a.invited_at
      );

      for (const assignment of invitedAssignments) {
        const player = registrations.find((r) => r.id === assignment.registration_id);
        if (!player) continue;

        try {
          await fetch("/api/send-tryout-invite", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              parent_name: player.parent_name,
              parent_email: player.parent_email,
              player_name: `${player.player_first_name} ${player.player_last_name}`,
              division: editDivision,
              session_date: editDate,
              start_time: editStartTime,
              end_time: editEndTime || null,
              location: editLocation.trim(),
              field: editField.trim() || null,
              updated: true,
            }),
          });
        } catch {
          // continue sending to others
        }
      }

      await fetchAll();
      setEditingSession(null);
    }
    setSaving(false);
  }

  /* ---------- Assignment Helpers ---------- */

  function getSessionAssignments(sessionId: string) {
    return assignments.filter((a) => a.session_id === sessionId);
  }

  function getUnassignedPlayers(session: TryoutSession) {
    const assignedRegIds = new Set(
      getSessionAssignments(session.id).map((a) => a.registration_id)
    );
    return registrations.filter(
      (r) => r.division === session.division && !assignedRegIds.has(r.id)
    );
  }

  function getPlayerAssignment(registrationId: string) {
    return assignments.find((a) => a.registration_id === registrationId) ?? null;
  }

  function getPlayerSession(registrationId: string) {
    const assignment = getPlayerAssignment(registrationId);
    if (!assignment) return null;
    return sessions.find((s) => s.id === assignment.session_id) ?? null;
  }

  async function handleAssignSelected() {
    if (!supabase || !assigningSessionId || selectedPlayerIds.size === 0) return;

    const rows = Array.from(selectedPlayerIds).map((regId) => ({
      session_id: assigningSessionId,
      registration_id: regId,
      checked_in: false,
    }));

    const { error } = await supabase.from("tryout_assignments").insert(rows);
    if (!error) {
      await fetchAll();
    }
    setAssigningSessionId(null);
    setSelectedPlayerIds(new Set());
  }

  async function handleAssignAll(session: TryoutSession) {
    if (!supabase) return;
    const unassigned = getUnassignedPlayers(session);
    if (unassigned.length === 0) return;

    const rows = unassigned.map((r) => ({
      session_id: session.id,
      registration_id: r.id,
      checked_in: false,
    }));

    const { error } = await supabase.from("tryout_assignments").insert(rows);
    if (!error) {
      await fetchAll();
    }
  }

  /* ---------- Invite Emails ---------- */

  const [sendingInvites, setSendingInvites] = useState<Set<string>>(new Set());
  const [sendingSessionInvites, setSendingSessionInvites] = useState<string | null>(null);

  async function sendInvite(assignment: TryoutAssignment, session: TryoutSession) {
    if (!supabase) return;
    const player = registrations.find((r) => r.id === assignment.registration_id);
    if (!player) return;

    setSendingInvites((prev) => new Set(prev).add(assignment.id));

    try {
      await fetch("/api/send-tryout-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registration_id: player.id,
          parent_name: player.parent_name,
          parent_email: player.parent_email,
          player_name: `${player.player_first_name} ${player.player_last_name}`,
          division: session.division,
          session_date: session.session_date,
          start_time: session.start_time,
          end_time: session.end_time,
          location: session.location,
          field: session.field,
        }),
      });

      const now = new Date().toISOString();
      await supabase
        .from("tryout_assignments")
        .update({ invited_at: now })
        .eq("id", assignment.id);

      setAssignments((prev) =>
        prev.map((a) =>
          a.id === assignment.id ? { ...a, invited_at: now } : a
        )
      );

      // Auto-update player status to "invited" if still "registered"
      if (player.status === "registered") {
        await supabase
          .from("tryout_registrations")
          .update({ status: "invited" })
          .eq("id", player.id);

        setRegistrations((prev) =>
          prev.map((r) =>
            r.id === player.id ? { ...r, status: "invited" as Status } : r
          )
        );
      }
    } catch {
      // silently fail individual invite
    }

    setSendingInvites((prev) => {
      const next = new Set(prev);
      next.delete(assignment.id);
      return next;
    });
  }

  async function sendAllInvites(session: TryoutSession) {
    if (!supabase) return;
    setSendingSessionInvites(session.id);

    const sessionAssigns = assignments.filter(
      (a) => a.session_id === session.id && !a.invited_at
    );

    for (const assignment of sessionAssigns) {
      await sendInvite(assignment, session);
    }

    setSendingSessionInvites(null);
  }

  /* ---------- Auto-Assign All ---------- */

  async function handleAutoAssign() {
    if (!supabase) return;
    setAutoAssigning(true);
    setAutoAssignResult(null);

    let totalAssigned = 0;
    let sessionsAffected = 0;

    for (const session of sessions) {
      const unassigned = getUnassignedPlayers(session);
      if (unassigned.length === 0) continue;

      const rows = unassigned.map((r) => ({
        session_id: session.id,
        registration_id: r.id,
        checked_in: false,
      }));

      const { error } = await supabase.from("tryout_assignments").insert(rows);
      if (!error) {
        totalAssigned += rows.length;
        sessionsAffected++;
      }
    }

    await fetchAll();
    setAutoAssignResult(
      `${totalAssigned} player${totalAssigned !== 1 ? "s" : ""} assigned across ${sessionsAffected} session${sessionsAffected !== 1 ? "s" : ""}`
    );
    setAutoAssigning(false);
  }

  /* ---------- Filtered Lists ---------- */

  const filteredPlayers = registrations.filter((r) => {
    if (divisionFilter !== "all" && r.division !== divisionFilter) return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    return true;
  });

  const filteredSessions = sessions.filter((s) => {
    if (sessionDivisionFilter !== "all" && s.division !== sessionDivisionFilter) return false;
    return true;
  });

  /* ---------- Renders ---------- */

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
          <div className="h-10 bg-gray-200 rounded w-72" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-lg" />
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
          Tryouts
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          {totalRegistered} registered &middot; {totalSessions} session{totalSessions !== 1 ? "s" : ""} &middot; {totalInvited} invited
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("players")}
          className={`px-5 py-2.5 rounded-full text-sm font-semibold uppercase tracking-wide transition-colors ${
            activeTab === "players"
              ? "bg-flag-blue text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Players
        </button>
        <button
          onClick={() => setActiveTab("sessions")}
          className={`px-5 py-2.5 rounded-full text-sm font-semibold uppercase tracking-wide transition-colors ${
            activeTab === "sessions"
              ? "bg-flag-blue text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Sessions
        </button>
      </div>

      {/* ========== PLAYERS TAB ========== */}
      {activeTab === "players" && (
        <>
          {/* Filters */}
          <div className="space-y-3 mb-6">
            {/* Division Filter */}
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-2">
                Division:
              </span>
              <div className="inline-flex flex-wrap gap-1.5">
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

            {/* Status Filter */}
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-2">
                Status:
              </span>
              <div className="inline-flex flex-wrap gap-1.5">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide transition-colors ${
                    statusFilter === "all"
                      ? "bg-flag-blue text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  All
                </button>
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setStatusFilter(opt.value)}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide transition-colors ${
                      statusFilter === opt.value
                        ? "bg-flag-blue text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bulk Action Bar */}
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <button
              onClick={toggleSelectAllFiltered}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wide border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
            >
              {filteredPlayers.length > 0 && filteredPlayers.every((r) => bulkSelectedIds.has(r.id))
                ? <><CheckSquare size={14} /> Deselect All</>
                : <><Square size={14} /> Select All</>
              }
            </button>

            <span className="text-xs text-gray-400">
              {bulkSelectedIds.size > 0
                ? `${bulkSelectedIds.size} selected`
                : `Showing ${filteredPlayers.length} of ${registrations.length}`}
            </span>

            {bulkSelectedIds.size > 0 && !bulkUpdating && (
              <>
                <span className="text-xs text-gray-300">|</span>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Bulk Set:
                </span>
                {(["selected", "alternate", "not_selected"] as Status[]).map((s) => {
                  const opt = STATUS_OPTIONS.find((o) => o.value === s)!;
                  return (
                    <button
                      key={s}
                      onClick={() => {
                        if (confirm(`Set ${bulkSelectedIds.size} player(s) to "${opt.label}"?\n\n${s === "selected" || s === "not_selected" || s === "alternate" ? "This will also send notification emails to parents." : ""}`)) {
                          bulkUpdateStatus(s);
                        }
                      }}
                      className={`px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wide transition-colors border border-gray-200 hover:bg-gray-100 ${opt.color}`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
                <button
                  onClick={() => setBulkSelectedIds(new Set())}
                  className="px-2 py-1.5 rounded text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={14} />
                </button>
              </>
            )}

            {bulkUpdating && (
              <div className="flex items-center gap-2 text-xs">
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-flag-blue rounded-full transition-all"
                    style={{ width: `${bulkProgress.total > 0 ? (bulkProgress.done / bulkProgress.total) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-gray-500">
                  {bulkProgress.done}/{bulkProgress.total}
                  {bulkProgress.emailsSent > 0 && ` · ${bulkProgress.emailsSent} emails sent`}
                  {bulkProgress.emailsFailed > 0 && (
                    <span className="text-flag-red"> · {bulkProgress.emailsFailed} failed</span>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Player List */}
          {filteredPlayers.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
              <p className="text-gray-400 text-sm">No players found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPlayers.map((reg) => {
                const expanded = expandedPlayerId === reg.id;
                const playerSession = getPlayerSession(reg.id);
                const playerAssignment = getPlayerAssignment(reg.id);

                return (
                  <div
                    key={reg.id}
                    className={`bg-white border rounded-lg overflow-hidden ${bulkSelectedIds.has(reg.id) ? "border-flag-blue ring-1 ring-flag-blue/30" : "border-gray-200"}`}
                  >
                    {/* Summary Row */}
                    <div className="flex items-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleBulkSelect(reg.id); }}
                        className="pl-4 pr-1 py-4 shrink-0"
                        aria-label={bulkSelectedIds.has(reg.id) ? "Deselect player" : "Select player"}
                      >
                        {bulkSelectedIds.has(reg.id)
                          ? <CheckSquare size={18} className="text-flag-blue" />
                          : <Square size={18} className="text-gray-300 hover:text-gray-500" />
                        }
                      </button>
                    <button
                      onClick={() => setExpandedPlayerId(expanded ? null : reg.id)}
                      className="flex-1 text-left p-4 md:p-5 flex items-center gap-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-charcoal truncate">
                            {reg.player_first_name} {reg.player_last_name}
                          </p>
                          <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-flag-blue/10 text-flag-blue">
                            {reg.division}
                          </span>
                          <StatusBadge status={reg.status ?? "registered"} />
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                          {playerSession ? (
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {formatDate(playerSession.session_date)} {formatTime(playerSession.start_time)} &middot; {playerSession.location}
                              {playerAssignment?.invited_at && (
                                <span className="text-green-600 font-semibold ml-1 flex items-center gap-0.5"><Check size={12} /> Invited</span>
                              )}
                            </span>
                          ) : (
                            <span className="text-gray-300">Not scheduled</span>
                          )}
                          <span>Parent: {reg.parent_name}</span>
                          <span>{reg.primary_position}</span>
                          <span>
                            {new Date(reg.submitted_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      {expanded ? (
                        <ChevronUp size={18} className="text-gray-400 shrink-0" />
                      ) : (
                        <ChevronDown size={18} className="text-gray-400 shrink-0" />
                      )}
                    </button>
                    </div>

                    {/* Expanded Details */}
                    {expanded && (
                      <div className="border-t border-gray-200 p-4 md:p-5 space-y-5">
                        {/* Status Update */}
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-sm font-semibold text-charcoal">
                            Update Status:
                          </span>
                          {STATUS_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => updateStatus(reg.id, opt.value)}
                              disabled={
                                updatingId === reg.id ||
                                (reg.status ?? "registered") === opt.value
                              }
                              className={`px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wide transition-colors disabled:opacity-40 ${
                                (reg.status ?? "registered") === opt.value
                                  ? "bg-flag-blue text-white"
                                  : "border border-gray-200 text-gray-600 hover:bg-gray-100"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>

                        {/* Player Info */}
                        <div>
                          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-gray-400 mb-2">
                            Player Info
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-400">Name:</span>{" "}
                              <span className="text-charcoal">
                                {reg.player_first_name} {reg.player_last_name}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-400">DOB:</span>{" "}
                              <span className="text-charcoal">
                                {new Date(reg.player_date_of_birth).toLocaleDateString()}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-400">Division:</span>{" "}
                              <span className="text-charcoal">{reg.division}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Position:</span>{" "}
                              <span className="text-charcoal">
                                {reg.primary_position}
                                {reg.secondary_position &&
                                reg.secondary_position !== "None"
                                  ? ` / ${reg.secondary_position}`
                                  : ""}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-400">Bats:</span>{" "}
                              <span className="text-charcoal">{reg.bats}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Throws:</span>{" "}
                              <span className="text-charcoal">{reg.throws}</span>
                            </div>
                            {reg.current_team && (
                              <div>
                                <span className="text-gray-400">Team:</span>{" "}
                                <span className="text-charcoal">
                                  {reg.current_team}
                                </span>
                              </div>
                            )}
                            {reg.jersey_number && (
                              <div>
                                <span className="text-gray-400">Jersey #:</span>{" "}
                                <span className="text-charcoal">
                                  {reg.jersey_number}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Parent / Contact */}
                        <div>
                          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-gray-400 mb-2">
                            Parent / Contact
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-400">Parent:</span>{" "}
                              <span className="text-charcoal">
                                {reg.parent_name}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-400">Email:</span>{" "}
                              <span className="text-charcoal">
                                {reg.parent_email}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-400">Phone:</span>{" "}
                              <span className="text-charcoal">
                                {reg.parent_phone}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Emergency */}
                        <div>
                          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-gray-400 mb-2">
                            Emergency Contact
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-400">Name:</span>{" "}
                              <span className="text-charcoal">
                                {reg.emergency_contact_name}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-400">Phone:</span>{" "}
                              <span className="text-charcoal">
                                {reg.emergency_contact_phone}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Medical */}
                        {reg.medical_conditions && (
                          <div>
                            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-gray-400 mb-2">
                              Medical Conditions
                            </h3>
                            <p className="text-charcoal text-sm whitespace-pre-wrap">
                              {reg.medical_conditions}
                            </p>
                          </div>
                        )}

                        {/* Consent */}
                        <div>
                          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-gray-400 mb-2">
                            Consent
                          </h3>
                          <div className="flex flex-wrap gap-3 text-xs">
                            <span
                              className={`px-2 py-1 rounded ${
                                reg.photo_release_consent
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-400"
                              }`}
                            >
                              Photo Release: {reg.photo_release_consent ? "Yes" : "No"}
                            </span>
                            <span
                              className={`px-2 py-1 rounded ${
                                reg.liability_waiver_consent
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-400"
                              }`}
                            >
                              Liability: {reg.liability_waiver_consent ? "Yes" : "No"}
                            </span>
                            <span
                              className={`px-2 py-1 rounded ${
                                reg.parent_code_of_conduct
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-400"
                              }`}
                            >
                              Code of Conduct: {reg.parent_code_of_conduct ? "Yes" : "No"}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ========== SESSIONS TAB ========== */}
      {activeTab === "sessions" && (
        <>
          {/* Auto-Assign Button */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <button
              onClick={handleAutoAssign}
              disabled={autoAssigning || sessions.length === 0}
              className="inline-flex items-center gap-2 bg-star-gold text-white px-5 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wide hover:bg-star-gold/90 transition-colors disabled:opacity-50"
            >
              <Zap size={16} />
              {autoAssigning ? "Assigning..." : "Auto-Assign All Players by Division"}
            </button>
            {autoAssignResult && (
              <span className="text-sm text-green-600 font-semibold">{autoAssignResult}</span>
            )}
          </div>

          {/* Create Session Form */}
          <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
              Create New Session
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Division */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Division *
                  </label>
                  <select
                    value={formDivision}
                    onChange={(e) => setFormDivision(e.target.value)}
                    required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-flag-blue/30"
                  >
                    {DIVISIONS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-flag-blue/30"
                  />
                </div>

                {/* Start Time */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-flag-blue/30"
                  />
                </div>

                {/* End Time */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-flag-blue/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Location */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Location *
                  </label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="e.g. Deerfield Community Park"
                    required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-charcoal placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-flag-blue/30"
                  />
                </div>

                {/* Field */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Field
                  </label>
                  <input
                    type="text"
                    value={formField}
                    onChange={(e) => setFormField(e.target.value)}
                    placeholder="e.g. Field 3"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-charcoal placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-flag-blue/30"
                  />
                </div>

                {/* Max Players */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Max Players
                  </label>
                  <input
                    type="number"
                    value={formMaxPlayers}
                    onChange={(e) => setFormMaxPlayers(parseInt(e.target.value, 10) || 30)}
                    min={1}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-flag-blue/30"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Notes
                </label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={2}
                  placeholder="Optional notes..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-charcoal placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-flag-blue/30 resize-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={creating || !formDate || !formStartTime || !formLocation.trim()}
                  className="inline-flex items-center gap-2 bg-flag-blue text-white px-5 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wide hover:bg-flag-blue/90 transition-colors disabled:opacity-50"
                >
                  <Plus size={16} />
                  {creating ? "Creating..." : "Create Session"}
                </button>
                {createError && (
                  <p className="text-flag-red text-xs font-semibold">{createError}</p>
                )}
              </div>
            </form>
          </div>

          {/* Division Filter */}
          <div className="mb-6">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-2">
              Division:
            </span>
            <div className="inline-flex flex-wrap gap-1.5">
              <button
                onClick={() => setSessionDivisionFilter("all")}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide transition-colors ${
                  sessionDivisionFilter === "all"
                    ? "bg-flag-blue text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              {DIVISIONS.map((div) => (
                <button
                  key={div}
                  onClick={() => setSessionDivisionFilter(div)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide transition-colors ${
                    sessionDivisionFilter === div
                      ? "bg-flag-blue text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {div.split("-")[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Results count */}
          <p className="text-xs text-gray-400 mb-3">
            Showing {filteredSessions.length} of {sessions.length}
          </p>

          {/* Sessions List */}
          {filteredSessions.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
              <p className="text-gray-400 text-sm">
                No tryout sessions found. Create one above to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSessions.map((session) => {
                const sessionAssignments = getSessionAssignments(session.id);
                const invitedCount = sessionAssignments.filter((a) => a.invited_at).length;
                const uninvitedCount = sessionAssignments.length - invitedCount;
                const expanded = expandedSessionId === session.id;
                const barColor = DIVISION_COLORS[session.division] ?? "bg-flag-blue";

                return (
                  <div
                    key={session.id}
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden"
                  >
                    {/* Division Color Bar */}
                    <div className={`h-1.5 ${barColor}`} />

                    {/* Session Summary */}
                    <button
                      onClick={() => setExpandedSessionId(expanded ? null : session.id)}
                      className="w-full text-left p-4 md:p-5 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-flag-blue/10 text-flag-blue">
                              {session.division}
                            </span>
                            <span className="text-sm font-semibold text-charcoal">
                              {formatDate(session.session_date)}
                            </span>
                            <span className="text-sm text-gray-400 flex items-center gap-1">
                              <Clock size={13} />
                              {formatTime(session.start_time)}
                              {session.end_time && ` - ${formatTime(session.end_time)}`}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <MapPin size={12} />
                              {session.location}
                              {session.field && ` - ${session.field}`}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users size={12} />
                              {sessionAssignments.length} / {session.max_players} assigned
                              {sessionAssignments.length > 0 && (
                                <span className={`ml-1 ${invitedCount === sessionAssignments.length ? "text-green-600" : "text-gray-400"}`}>
                                  ({invitedCount} invited{uninvitedCount > 0 ? `, ${uninvitedCount} pending` : ""})
                                </span>
                              )}
                            </span>
                          </div>
                          {session.notes && (
                            <p className="text-xs text-gray-400 mt-1 italic">{session.notes}</p>
                          )}
                        </div>
                        <div className="shrink-0 flex items-center gap-2">
                          {expanded ? (
                            <ChevronUp size={18} className="text-gray-400" />
                          ) : (
                            <ChevronDown size={18} className="text-gray-400" />
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Expanded Details */}
                    {expanded && (
                      <div className="border-t border-gray-200 p-4 md:p-5 space-y-4">
                        {/* Actions Row */}
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setAssigningSessionId(session.id);
                              setSelectedPlayerIds(new Set());
                            }}
                            className="inline-flex items-center gap-2 bg-flag-blue text-white px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wide hover:bg-flag-blue/90 transition-colors"
                          >
                            <UserPlus size={14} />
                            Assign Players
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAssignAll(session);
                            }}
                            className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wide hover:bg-green-700 transition-colors"
                          >
                            <Users size={14} />
                            Assign All in Division
                          </button>

                          {sessionAssignments.length > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                sendAllInvites(session);
                              }}
                              disabled={sendingSessionInvites === session.id || uninvitedCount === 0}
                              className="inline-flex items-center gap-2 bg-star-gold text-white px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wide hover:bg-star-gold/90 transition-colors disabled:opacity-50"
                            >
                              <Mail size={14} />
                              {sendingSessionInvites === session.id
                                ? "Sending..."
                                : uninvitedCount === 0
                                ? "All Invited"
                                : `Send All Invites (${uninvitedCount})`}
                            </button>
                          )}

                          {/* Delete */}
                          {deletingId === session.id ? (
                            <div className="flex items-center gap-2 ml-auto">
                              <span className="text-xs text-flag-red font-semibold">
                                Delete session?
                              </span>
                              <button
                                onClick={() => handleDelete(session.id)}
                                className="px-2.5 py-1 rounded text-xs font-semibold uppercase bg-flag-red text-white hover:bg-flag-red/90 transition-colors"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setDeletingId(null)}
                                className="px-2.5 py-1 rounded text-xs font-semibold uppercase bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 ml-auto">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditing(session);
                                }}
                                className="p-2 rounded-lg text-gray-300 hover:text-flag-blue hover:bg-flag-blue/5 transition-colors"
                                title="Edit session"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingId(session.id);
                                }}
                                className="p-2 rounded-lg text-gray-300 hover:text-flag-red hover:bg-flag-red/5 transition-colors"
                                title="Delete session"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Assigned Players */}
                        <div>
                          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">
                            Assigned Players ({sessionAssignments.length})
                          </h3>
                          {sessionAssignments.length === 0 ? (
                            <p className="text-xs text-gray-300">
                              No players assigned yet. Use the buttons above to assign players.
                            </p>
                          ) : (
                            <div className="space-y-1.5">
                              {sessionAssignments.map((assignment) => {
                                const player = registrations.find(
                                  (r) => r.id === assignment.registration_id
                                );
                                if (!player) return null;
                                const isInvited = !!assignment.invited_at;
                                const isSending = sendingInvites.has(assignment.id);

                                return (
                                  <div
                                    key={assignment.id}
                                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                                      isInvited
                                        ? "bg-green-50 border border-green-200"
                                        : "bg-gray-50 border border-gray-100"
                                    }`}
                                  >
                                    <div className="flex-1 min-w-0">
                                      <span className="text-sm font-semibold text-charcoal">
                                        {player.player_first_name} {player.player_last_name}
                                      </span>
                                      <span className="text-xs text-gray-400 ml-2">
                                        ({player.parent_name} &middot; {player.parent_email})
                                      </span>
                                    </div>
                                    {isInvited ? (
                                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 uppercase tracking-wide shrink-0">
                                        <Check size={14} />
                                        Invited
                                      </span>
                                    ) : (
                                      <button
                                        onClick={() => sendInvite(assignment, session)}
                                        disabled={isSending}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wide bg-star-gold/10 text-star-gold hover:bg-star-gold/20 transition-colors disabled:opacity-50 shrink-0"
                                      >
                                        <Send size={12} />
                                        {isSending ? "Sending..." : "Send Invite"}
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Assign Players Modal */}
      {assigningSessionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <div>
                <h2 className="font-display text-lg font-bold uppercase tracking-wide text-charcoal">
                  Assign Players
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {(() => {
                    const s = sessions.find((s) => s.id === assigningSessionId);
                    return s
                      ? `${s.division} - ${formatDate(s.session_date)}`
                      : "";
                  })()}
                </p>
              </div>
              <button
                onClick={() => {
                  setAssigningSessionId(null);
                  setSelectedPlayerIds(new Set());
                }}
                className="p-2 rounded-lg text-gray-400 hover:text-charcoal hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5">
              {(() => {
                const session = sessions.find((s) => s.id === assigningSessionId);
                if (!session) return null;
                const unassigned = getUnassignedPlayers(session);

                if (unassigned.length === 0) {
                  return (
                    <p className="text-sm text-gray-400 text-center py-8">
                      All players in {session.division} are already assigned to this session.
                    </p>
                  );
                }

                return (
                  <div className="space-y-1.5">
                    {/* Select All */}
                    <label className="flex items-center gap-3 p-3 rounded-lg cursor-pointer bg-flag-blue/5 border border-flag-blue/10 hover:bg-flag-blue/10 transition-colors mb-3">
                      <input
                        type="checkbox"
                        checked={selectedPlayerIds.size === unassigned.length}
                        onChange={() => {
                          if (selectedPlayerIds.size === unassigned.length) {
                            setSelectedPlayerIds(new Set());
                          } else {
                            setSelectedPlayerIds(new Set(unassigned.map((r) => r.id)));
                          }
                        }}
                        className="w-6 h-6 min-w-[24px] rounded border-gray-300 text-flag-blue focus:ring-flag-blue cursor-pointer"
                      />
                      <span className="text-sm font-semibold text-flag-blue uppercase tracking-wide">
                        Select All ({unassigned.length})
                      </span>
                    </label>

                    {unassigned.map((player) => (
                      <label
                        key={player.id}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedPlayerIds.has(player.id)
                            ? "bg-flag-blue/5 border border-flag-blue/20"
                            : "bg-gray-50 border border-gray-100 hover:bg-gray-100"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedPlayerIds.has(player.id)}
                          onChange={() => {
                            setSelectedPlayerIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(player.id)) {
                                next.delete(player.id);
                              } else {
                                next.add(player.id);
                              }
                              return next;
                            });
                          }}
                          className="w-6 h-6 min-w-[24px] rounded border-gray-300 text-flag-blue focus:ring-flag-blue cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold text-charcoal">
                            {player.player_first_name} {player.player_last_name}
                          </span>
                          <span className="text-xs text-gray-400 ml-2">
                            ({player.parent_name})
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setAssigningSessionId(null);
                  setSelectedPlayerIds(new Set());
                }}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignSelected}
                disabled={selectedPlayerIds.size === 0}
                className="inline-flex items-center gap-2 bg-flag-blue text-white px-5 py-2 rounded-lg text-sm font-semibold uppercase tracking-wide hover:bg-flag-blue/90 transition-colors disabled:opacity-50"
              >
                <UserPlus size={14} />
                Assign Selected ({selectedPlayerIds.size})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Session Modal */}
      {editingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="font-display text-lg font-bold uppercase tracking-wide text-charcoal">
                Edit Session
              </h2>
              <button
                onClick={() => setEditingSession(null)}
                className="p-2 rounded-lg text-gray-400 hover:text-charcoal hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Division *
                  </label>
                  <select
                    value={editDivision}
                    onChange={(e) => setEditDivision(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-flag-blue/30"
                  >
                    {DIVISIONS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-flag-blue/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                    required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-flag-blue/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-flag-blue/30"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Location *
                  </label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-flag-blue/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Field
                  </label>
                  <input
                    type="text"
                    value={editField}
                    onChange={(e) => setEditField(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-flag-blue/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Max Players
                  </label>
                  <input
                    type="number"
                    value={editMaxPlayers}
                    onChange={(e) => setEditMaxPlayers(parseInt(e.target.value, 10) || 30)}
                    min={1}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-flag-blue/30"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Notes
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-flag-blue/30 resize-none"
                />
              </div>

              {/* Info about update emails */}
              {assignments.filter((a) => a.session_id === editingSession.id && a.invited_at).length > 0 && (
                <div className="bg-star-gold/10 border border-star-gold/20 rounded-lg p-3">
                  <p className="text-xs text-star-gold font-semibold">
                    <Mail size={12} className="inline mr-1" />
                    {assignments.filter((a) => a.session_id === editingSession.id && a.invited_at).length} player(s) have already been invited. Saving will automatically send them an update email with the new details.
                  </p>
                </div>
              )}
            </div>
            <div className="p-5 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setEditingSession(null)}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving || !editDate || !editStartTime || !editLocation.trim()}
                className="inline-flex items-center gap-2 bg-flag-blue text-white px-5 py-2 rounded-lg text-sm font-semibold uppercase tracking-wide hover:bg-flag-blue/90 transition-colors disabled:opacity-50"
              >
                {saving ? "Saving & Notifying..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

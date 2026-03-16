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
} from "lucide-react";

/* ---------- Types ---------- */

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
  created_at: string;
}

interface Registration {
  id: string;
  player_first_name: string;
  player_last_name: string;
  division: string;
  parent_name: string;
  parent_email: string;
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

/* ---------- Component ---------- */

export default function TryoutsPage() {
  const [sessions, setSessions] = useState<TryoutSession[]>([]);
  const [assignments, setAssignments] = useState<TryoutAssignment[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [divisionFilter, setDivisionFilter] = useState<string>("all");

  // Expanded session
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Assign modal
  const [assigningSessionId, setAssigningSessionId] = useState<string | null>(null);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set());

  // Create form
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

  // Auto-assign
  const [autoAssigning, setAutoAssigning] = useState(false);
  const [autoAssignResult, setAutoAssignResult] = useState<string | null>(null);

  /* ---------- Data Fetching ---------- */

  const fetchAll = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);

    const [sessionsRes, assignmentsRes, regsRes] = await Promise.all([
      supabase
        .from("tryout_sessions")
        .select("*")
        .order("session_date")
        .order("start_time"),
      supabase.from("tryout_assignments").select("*"),
      supabase
        .from("tryout_registrations")
        .select("id, player_first_name, player_last_name, division, parent_name, parent_email"),
    ]);

    if (sessionsRes.data) setSessions(sessionsRes.data);
    if (assignmentsRes.data) setAssignments(assignmentsRes.data);
    if (regsRes.data) setRegistrations(regsRes.data);

    setLoading(false);
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    fetchAll();
  }, [fetchAll]);

  /* ---------- Create Session ---------- */

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

  /* ---------- Delete Session ---------- */

  async function handleDelete(id: string) {
    if (!supabase) return;
    // Delete assignments first, then session
    await supabase.from("tryout_assignments").delete().eq("session_id", id);
    const { error } = await supabase.from("tryout_sessions").delete().eq("id", id);
    if (!error) {
      setSessions((prev) => prev.filter((s) => s.id !== id));
      setAssignments((prev) => prev.filter((a) => a.session_id !== id));
    }
    setDeletingId(null);
  }

  /* ---------- Assign Players ---------- */

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

  /* ---------- Check-In ---------- */

  async function toggleCheckIn(assignment: TryoutAssignment) {
    if (!supabase) return;
    const newCheckedIn = !assignment.checked_in;
    const { error } = await supabase
      .from("tryout_assignments")
      .update({
        checked_in: newCheckedIn,
        checked_in_at: newCheckedIn ? new Date().toISOString() : null,
      })
      .eq("id", assignment.id);

    if (!error) {
      setAssignments((prev) =>
        prev.map((a) =>
          a.id === assignment.id
            ? {
                ...a,
                checked_in: newCheckedIn,
                checked_in_at: newCheckedIn ? new Date().toISOString() : null,
              }
            : a
        )
      );
    }
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

  /* ---------- Filter ---------- */

  const filtered = sessions.filter((s) => {
    if (divisionFilter !== "all" && s.division !== divisionFilter) return false;
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
          Tryout Schedule
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          {sessions.length} session{sessions.length !== 1 ? "s" : ""} scheduled
        </p>
      </div>

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

      {/* Results count */}
      <p className="text-xs text-gray-400 mb-3">
        Showing {filtered.length} of {sessions.length}
      </p>

      {/* Sessions List */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-400 text-sm">
            No tryout sessions found. Create one above to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((session) => {
            const sessionAssignments = getSessionAssignments(session.id);
            const checkedInCount = sessionAssignments.filter((a) => a.checked_in).length;
            const expanded = expandedId === session.id;
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
                  onClick={() => setExpandedId(expanded ? null : session.id)}
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
                            <span className="text-green-600 ml-1">
                              ({checkedInCount} checked in)
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
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingId(session.id);
                          }}
                          className="p-2 rounded-lg text-gray-300 hover:text-flag-red hover:bg-flag-red/5 transition-colors ml-auto"
                          title="Delete session"
                        >
                          <Trash2 size={16} />
                        </button>
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

                            return (
                              <label
                                key={assignment.id}
                                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                                  assignment.checked_in
                                    ? "bg-green-50 border border-green-200"
                                    : "bg-gray-50 border border-gray-100 hover:bg-gray-100"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={assignment.checked_in}
                                  onChange={() => toggleCheckIn(assignment)}
                                  className="w-6 h-6 min-w-[24px] rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                                />
                                <div className="flex-1 min-w-0">
                                  <span className="text-sm font-semibold text-charcoal">
                                    {player.player_first_name} {player.player_last_name}
                                  </span>
                                  <span className="text-xs text-gray-400 ml-2">
                                    ({player.parent_name})
                                  </span>
                                </div>
                                {assignment.checked_in && (
                                  <span className="text-xs font-semibold text-green-600 uppercase tracking-wide shrink-0">
                                    Checked In
                                  </span>
                                )}
                              </label>
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
    </div>
  );
}

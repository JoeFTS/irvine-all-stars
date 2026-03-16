"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ChevronDown, ChevronUp } from "lucide-react";

type Status = "registered" | "confirmed" | "tryout_complete" | "selected" | "not_selected" | "alternate" | "waitlisted" | "withdrawn";

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

const STATUS_OPTIONS: { value: Status; label: string; color: string }[] = [
  { value: "registered", label: "Registered", color: "bg-gray-100 text-gray-600" },
  { value: "confirmed", label: "Confirmed", color: "bg-green-100 text-green-700" },
  { value: "tryout_complete", label: "Tryout Complete", color: "bg-blue-100 text-blue-700" },
  { value: "selected", label: "Selected", color: "bg-green-100 text-green-800 font-bold" },
  { value: "not_selected", label: "Not Selected", color: "bg-gray-100 text-gray-500" },
  { value: "alternate", label: "Alternate", color: "bg-orange-100 text-orange-700" },
  { value: "waitlisted", label: "Waitlisted", color: "bg-star-gold/15 text-star-gold" },
  { value: "withdrawn", label: "Withdrawn", color: "bg-flag-red/10 text-flag-red" },
];

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

export default function RegistrationsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [divisionFilter, setDivisionFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    fetchRegistrations();
  }, []);

  async function fetchRegistrations() {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("tryout_registrations")
      .select("*")
      .order("submitted_at", { ascending: false });

    if (!error && data) {
      setRegistrations(data);
    }
    setLoading(false);
  }

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

  const filtered = registrations.filter((r) => {
    if (divisionFilter !== "all" && r.division !== divisionFilter) return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    return true;
  });

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
          Player Registrations
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          {registrations.length} total registration{registrations.length !== 1 ? "s" : ""}
        </p>
      </div>

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

      {/* Results count */}
      <p className="text-xs text-gray-400 mb-3">
        Showing {filtered.length} of {registrations.length}
      </p>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-400 text-sm">No registrations found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((reg) => {
            const expanded = expandedId === reg.id;
            return (
              <div
                key={reg.id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden"
              >
                {/* Summary Row */}
                <button
                  onClick={() => setExpandedId(expanded ? null : reg.id)}
                  className="w-full text-left p-4 md:p-5 flex items-center gap-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-charcoal truncate">
                        {reg.player_first_name} {reg.player_last_name}
                      </p>
                      <StatusBadge status={reg.status ?? "registered"} />
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                      <span>Parent: {reg.parent_name}</span>
                      <span>{reg.division}</span>
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
    </div>
  );
}

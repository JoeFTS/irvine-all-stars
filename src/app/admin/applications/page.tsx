"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ChevronDown, ChevronUp } from "lucide-react";

type Status = "submitted" | "under_review" | "accepted" | "rejected";

interface Application {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  division_preference: string;
  years_coaching: number | null;
  previous_allstar_experience: string;
  coaching_philosophy: string;
  player_development_approach: string;
  communication_style: string;
  tournament_experience: string;
  why_manage: string;
  unique_qualities: string;
  additional_comments: string;
  status: Status;
  submitted_at: string;
}

const STATUS_OPTIONS: { value: Status; label: string; color: string }[] = [
  { value: "submitted", label: "Submitted", color: "bg-gray-100 text-gray-600" },
  { value: "under_review", label: "Under Review", color: "bg-star-gold/15 text-star-gold" },
  { value: "accepted", label: "Accepted", color: "bg-green-100 text-green-700" },
  { value: "rejected", label: "Rejected", color: "bg-flag-red/10 text-flag-red" },
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

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Status | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    fetchApplications();
  }, []);

  async function fetchApplications() {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("coach_applications")
      .select("*")
      .order("submitted_at", { ascending: false });

    if (!error && data) {
      setApplications(data);
    }
    setLoading(false);
  }

  async function updateStatus(id: string, newStatus: Status) {
    if (!supabase) return;
    setUpdatingId(id);
    const { error } = await supabase
      .from("coach_applications")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      alert(`Failed to update status: ${error.message}`);
    } else {
      setApplications((prev) =>
        prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
      );
    }
    setUpdatingId(null);
  }

  const filtered =
    filter === "all"
      ? applications
      : applications.filter((a) => a.status === filter);

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

  if (loading) {
    return (
      <div className="p-6 md:p-10">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-56" />
          <div className="h-10 bg-gray-200 rounded w-72" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-2xl" />
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
          Coach Applications
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          {applications.length} total application{applications.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide transition-colors ${
            filter === "all"
              ? "bg-flag-blue text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          All ({applications.length})
        </button>
        {STATUS_OPTIONS.map((opt) => {
          const count = applications.filter((a) => a.status === opt.value).length;
          return (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide transition-colors ${
                filter === opt.value
                  ? "bg-flag-blue text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {opt.label} ({count})
            </button>
          );
        })}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
          <p className="text-gray-400 text-sm">No applications found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => {
            const expanded = expandedId === app.id;
            return (
              <div
                key={app.id}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden"
              >
                {/* Summary Row */}
                <button
                  onClick={() => setExpandedId(expanded ? null : app.id)}
                  className="w-full text-left p-4 md:p-5 flex items-center gap-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-charcoal truncate">
                        {app.full_name}
                      </p>
                      <StatusBadge status={app.status} />
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                      <span>{app.email}</span>
                      <span>{app.division_preference}</span>
                      <span>
                        {new Date(app.submitted_at).toLocaleDateString()}
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
                          onClick={() => updateStatus(app.id, opt.value)}
                          disabled={
                            updatingId === app.id || app.status === opt.value
                          }
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide transition-colors disabled:opacity-40 ${
                            app.status === opt.value
                              ? "bg-flag-blue text-white"
                              : "border border-gray-200 text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    {/* Contact */}
                    <div>
                      <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-gray-400 mb-2">
                        Contact
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-400">Phone:</span>{" "}
                          <span className="text-charcoal">{app.phone}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Email:</span>{" "}
                          <span className="text-charcoal">{app.email}</span>
                        </div>
                        {app.address && (
                          <div className="sm:col-span-2">
                            <span className="text-gray-400">Address:</span>{" "}
                            <span className="text-charcoal">{app.address}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Experience */}
                    <div>
                      <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-gray-400 mb-2">
                        Experience
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-400">Division:</span>{" "}
                          <span className="text-charcoal">
                            {app.division_preference}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Years Coaching:</span>{" "}
                          <span className="text-charcoal">
                            {app.years_coaching ?? "N/A"}
                          </span>
                        </div>
                      </div>
                      {app.previous_allstar_experience && (
                        <div className="mt-2">
                          <span className="text-gray-400 text-sm">
                            Previous All-Star Experience:
                          </span>
                          <p className="text-charcoal text-sm mt-1 whitespace-pre-wrap">
                            {app.previous_allstar_experience}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Philosophy */}
                    {(app.coaching_philosophy ||
                      app.player_development_approach ||
                      app.communication_style ||
                      app.tournament_experience) && (
                      <div>
                        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-gray-400 mb-2">
                          Philosophy
                        </h3>
                        <div className="space-y-3 text-sm">
                          {app.coaching_philosophy && (
                            <div>
                              <span className="text-gray-400">
                                Coaching Philosophy:
                              </span>
                              <p className="text-charcoal mt-1 whitespace-pre-wrap">
                                {app.coaching_philosophy}
                              </p>
                            </div>
                          )}
                          {app.player_development_approach && (
                            <div>
                              <span className="text-gray-400">
                                Player Development:
                              </span>
                              <p className="text-charcoal mt-1 whitespace-pre-wrap">
                                {app.player_development_approach}
                              </p>
                            </div>
                          )}
                          {app.communication_style && (
                            <div>
                              <span className="text-gray-400">
                                Communication:
                              </span>
                              <p className="text-charcoal mt-1 whitespace-pre-wrap">
                                {app.communication_style}
                              </p>
                            </div>
                          )}
                          {app.tournament_experience && (
                            <div>
                              <span className="text-gray-400">
                                Tournament Experience:
                              </span>
                              <p className="text-charcoal mt-1 whitespace-pre-wrap">
                                {app.tournament_experience}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Why & Qualities */}
                    {(app.why_manage || app.unique_qualities) && (
                      <div>
                        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-gray-400 mb-2">
                          Motivation
                        </h3>
                        <div className="space-y-3 text-sm">
                          {app.why_manage && (
                            <div>
                              <span className="text-gray-400">
                                Why Manage:
                              </span>
                              <p className="text-charcoal mt-1 whitespace-pre-wrap">
                                {app.why_manage}
                              </p>
                            </div>
                          )}
                          {app.unique_qualities && (
                            <div>
                              <span className="text-gray-400">
                                Unique Qualities:
                              </span>
                              <p className="text-charcoal mt-1 whitespace-pre-wrap">
                                {app.unique_qualities}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {app.additional_comments && (
                      <div>
                        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-gray-400 mb-2">
                          Additional Comments
                        </h3>
                        <p className="text-charcoal text-sm whitespace-pre-wrap">
                          {app.additional_comments}
                        </p>
                      </div>
                    )}
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

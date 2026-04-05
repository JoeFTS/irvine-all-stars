"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Pencil, Trash2, X, CheckCircle2 } from "lucide-react";
import { divisions } from "@/content/divisions";
import FileUpload from "@/components/file-upload";

interface Tournament {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  location: string;
  divisions_display: string | null;
  division_ids: string[] | null;
  registration_url: string | null;
  registration_deadline: string | null;
  host: string | null;
  description: string | null;
  flyer_url: string | null;
  status: "draft" | "published";
  auto_announce: boolean;
  created_at: string;
  updated_at: string;
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start + "T12:00:00");
  const e = new Date(end + "T12:00:00");
  if (s.getMonth() === e.getMonth()) {
    return `${s.toLocaleDateString("en-US", { month: "long" })} ${s.getDate()}-${e.getDate()}, ${s.getFullYear()}`;
  }
  return `${s.toLocaleDateString("en-US", { month: "long", day: "numeric" })} - ${e.toLocaleDateString("en-US", { month: "long", day: "numeric" })}, ${s.getFullYear()}`;
}

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("");
  const [divisionsDisplay, setDivisionsDisplay] = useState("");
  const [divisionIds, setDivisionIds] = useState<string[]>([]);
  const [registrationUrl, setRegistrationUrl] = useState("");
  const [registrationDeadline, setRegistrationDeadline] = useState("");
  const [host, setHost] = useState("");
  const [description, setDescription] = useState("");
  const [flyerUrl, setFlyerUrl] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [autoAnnounce, setAutoAnnounce] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Edit mode
  const [editingId, setEditingId] = useState<string | null>(null);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Show form
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    fetchTournaments();
  }, []);

  async function fetchTournaments() {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("tournaments")
      .select("*")
      .order("start_date", { ascending: true });

    if (!error && data) {
      setTournaments(data);
    }
    setLoading(false);
  }

  function resetForm() {
    setName("");
    setStartDate("");
    setEndDate("");
    setLocation("");
    setDivisionsDisplay("");
    setDivisionIds([]);
    setRegistrationUrl("");
    setRegistrationDeadline("");
    setHost("");
    setDescription("");
    setFlyerUrl("");
    setStatus("draft");
    setAutoAnnounce(true);
    setEditingId(null);
    setFormError("");
    setShowForm(false);
  }

  function startEdit(t: Tournament) {
    setName(t.name);
    setStartDate(t.start_date);
    setEndDate(t.end_date);
    setLocation(t.location);
    setDivisionsDisplay(t.divisions_display ?? "");
    setDivisionIds(t.division_ids ?? []);
    setRegistrationUrl(t.registration_url ?? "");
    setRegistrationDeadline(t.registration_deadline ?? "");
    setHost(t.host ?? "");
    setDescription(t.description ?? "");
    setFlyerUrl(t.flyer_url ?? "");
    setStatus(t.status);
    setAutoAnnounce(t.auto_announce);
    setEditingId(t.id);
    setFormError("");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleDivision(id: string) {
    setDivisionIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  }

  async function handleAutoAnnounce(tournamentName: string) {
    if (!supabase) return;

    // Check if announcement already exists
    const { data: existing } = await supabase
      .from("announcements")
      .select("id")
      .like("title", `Tournament:%${tournamentName}%`);

    if (existing && existing.length > 0) return;

    // Build announcement body
    const parts: string[] = [];
    if (location) parts.push(`Location: ${location}`);
    parts.push(`Dates: ${formatDateRange(startDate, endDate)}`);
    if (host) parts.push(`Host: ${host}`);
    if (divisionsDisplay) parts.push(`Divisions: ${divisionsDisplay}`);
    if (registrationUrl) parts.push(`Register: ${registrationUrl}`);
    if (registrationDeadline) {
      const dl = new Date(registrationDeadline + "T12:00:00");
      parts.push(
        `Registration Deadline: ${dl.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`
      );
    }
    if (description) parts.push(`\n${description}`);

    const title = `Tournament: ${tournamentName} — ${formatDateRange(startDate, endDate)}`;
    const body = parts.join("\n");

    await supabase.from("announcements").insert({
      title,
      body,
      division: null,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    if (!name.trim()) {
      setFormError("Name is required");
      return;
    }
    if (!startDate) {
      setFormError("Start date is required");
      return;
    }
    if (!endDate) {
      setFormError("End date is required");
      return;
    }
    if (!location.trim()) {
      setFormError("Location is required");
      return;
    }

    setSubmitting(true);
    setFormError("");

    const payload = {
      name: name.trim(),
      start_date: startDate,
      end_date: endDate,
      location: location.trim(),
      divisions_display: divisionsDisplay.trim() || null,
      division_ids: divisionIds.length > 0 ? divisionIds : null,
      registration_url: registrationUrl.trim() || null,
      registration_deadline: registrationDeadline || null,
      host: host.trim() || null,
      description: description.trim() || null,
      flyer_url: flyerUrl || null,
      status,
      auto_announce: autoAnnounce,
      updated_at: new Date().toISOString(),
    };

    if (editingId) {
      const { error } = await supabase
        .from("tournaments")
        .update(payload)
        .eq("id", editingId);

      if (error) {
        setFormError("Failed to update tournament. Please try again.");
        setSubmitting(false);
        return;
      }

      setTournaments((prev) =>
        prev.map((t) =>
          t.id === editingId ? { ...t, ...payload } : t
        )
      );

      // Auto-announce if publishing
      if (status === "published" && autoAnnounce) {
        await handleAutoAnnounce(name.trim());
      }
    } else {
      const { data, error } = await supabase
        .from("tournaments")
        .insert(payload)
        .select()
        .single();

      if (error || !data) {
        setFormError("Failed to create tournament. Please try again.");
        setSubmitting(false);
        return;
      }

      setTournaments((prev) => [...prev, data].sort((a, b) =>
        a.start_date.localeCompare(b.start_date)
      ));

      // Auto-announce if publishing
      if (status === "published" && autoAnnounce) {
        await handleAutoAnnounce(name.trim());
      }
    }

    const msg = editingId ? "Tournament updated!" : "Tournament created!";
    resetForm();
    setSubmitting(false);
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), 4000);
  }

  async function handleDelete(id: string) {
    if (!supabase) return;
    const { error } = await supabase
      .from("tournaments")
      .delete()
      .eq("id", id);

    if (!error) {
      setTournaments((prev) => prev.filter((t) => t.id !== id));
    }
    setDeletingId(null);
  }

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
          <div className="h-48 bg-gray-200 rounded-2xl" />
          {[1, 2].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const inputClass =
    "w-full min-h-[44px] px-4 py-3 bg-white border border-gray-200 rounded-xl text-charcoal placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-flag-blue/30 focus:border-flag-blue transition-colors";
  const selectClass =
    "w-full min-h-[44px] px-4 py-3 bg-white border border-gray-200 rounded-xl text-charcoal focus:outline-none focus:ring-2 focus:ring-flag-blue/30 focus:border-flag-blue transition-colors appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%234B5563%22%20d%3D%22M6%208L1%203h10z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_16px_center] bg-no-repeat";

  return (
    <div className="p-6 md:p-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="font-display text-sm font-semibold text-flag-red uppercase tracking-[3px] mb-1">
            Admin
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide">
            Tournaments
          </h1>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 min-h-[44px] px-5 py-3 bg-flag-blue hover:bg-flag-blue-mid text-white rounded-full font-display text-sm font-semibold uppercase tracking-wider transition-colors"
          >
            <Plus size={18} />
            Add Tournament
          </button>
        )}
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 md:p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-display text-lg font-bold uppercase tracking-wide">
              {editingId ? "Edit Tournament" : "New Tournament"}
            </h2>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-charcoal transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label
                htmlFor="t-name"
                className="block text-sm font-semibold text-charcoal mb-1.5"
              >
                Name <span className="text-flag-red">*</span>
              </label>
              <input
                id="t-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. PONY West Zone Tournament"
                className={inputClass}
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="t-start"
                  className="block text-sm font-semibold text-charcoal mb-1.5"
                >
                  Start Date <span className="text-flag-red">*</span>
                </label>
                <input
                  id="t-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label
                  htmlFor="t-end"
                  className="block text-sm font-semibold text-charcoal mb-1.5"
                >
                  End Date <span className="text-flag-red">*</span>
                </label>
                <input
                  id="t-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label
                htmlFor="t-location"
                className="block text-sm font-semibold text-charcoal mb-1.5"
              >
                Location <span className="text-flag-red">*</span>
              </label>
              <input
                id="t-location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Great Park, Irvine"
                className={inputClass}
              />
            </div>

            {/* Divisions Display */}
            <div>
              <label
                htmlFor="t-divisions-display"
                className="block text-sm font-semibold text-charcoal mb-1.5"
              >
                Divisions Display
              </label>
              <input
                id="t-divisions-display"
                type="text"
                value={divisionsDisplay}
                onChange={(e) => setDivisionsDisplay(e.target.value)}
                placeholder="e.g., Shetland 6, Pinto 8 PP, Mustang 9"
                className={inputClass}
              />
            </div>

            {/* Division IDs checkboxes */}
            <div>
              <label className="block text-sm font-semibold text-charcoal mb-1.5">
                Division IDs
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {divisions.map((d) => (
                  <label
                    key={d.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={divisionIds.includes(d.id)}
                      onChange={() => toggleDivision(d.id)}
                      className="w-4 h-4 rounded border-gray-300 text-flag-blue focus:ring-flag-blue/30"
                    />
                    <span className="text-sm text-charcoal">
                      {d.name} {d.ponyName}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Registration URL */}
            <div>
              <label
                htmlFor="t-reg-url"
                className="block text-sm font-semibold text-charcoal mb-1.5"
              >
                Registration URL
              </label>
              <input
                id="t-reg-url"
                type="text"
                value={registrationUrl}
                onChange={(e) => setRegistrationUrl(e.target.value)}
                placeholder="https://..."
                className={inputClass}
              />
            </div>

            {/* Registration Deadline */}
            <div>
              <label
                htmlFor="t-reg-deadline"
                className="block text-sm font-semibold text-charcoal mb-1.5"
              >
                Registration Deadline
              </label>
              <input
                id="t-reg-deadline"
                type="date"
                value={registrationDeadline}
                onChange={(e) => setRegistrationDeadline(e.target.value)}
                className={inputClass}
              />
            </div>

            {/* Host */}
            <div>
              <label
                htmlFor="t-host"
                className="block text-sm font-semibold text-charcoal mb-1.5"
              >
                Host
              </label>
              <input
                id="t-host"
                type="text"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="e.g. Irvine PONY Baseball"
                className={inputClass}
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="t-description"
                className="block text-sm font-semibold text-charcoal mb-1.5"
              >
                Description
              </label>
              <textarea
                id="t-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Tournament details, rules, etc."
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-charcoal placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-flag-blue/30 focus:border-flag-blue transition-colors resize-y"
              />
            </div>

            {/* Flyer Upload */}
            <FileUpload
              bucket="tournament-flyers"
              folder="flyers"
              accept="image/*"
              label="Flyer Image"
              description="Upload a tournament flyer image"
              onUploadComplete={(filePath) => setFlyerUrl(filePath)}
              existingFile={
                flyerUrl
                  ? { path: flyerUrl, name: flyerUrl.split("/").pop() ?? "flyer" }
                  : null
              }
            />

            {/* Status */}
            <div>
              <label
                htmlFor="t-status"
                className="block text-sm font-semibold text-charcoal mb-1.5"
              >
                Status
              </label>
              <select
                id="t-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as "draft" | "published")}
                className={selectClass}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            {/* Auto-announce */}
            <label className="flex items-center gap-3 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={autoAnnounce}
                onChange={(e) => setAutoAnnounce(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-flag-blue focus:ring-flag-blue/30"
              />
              <span className="text-sm text-charcoal font-medium">
                Automatically post announcement when published
              </span>
            </label>

            {formError && (
              <div className="bg-flag-red/10 border border-flag-red/30 rounded-2xl p-3">
                <p className="text-flag-red text-sm">{formError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="min-h-[44px] px-6 py-3 bg-flag-blue hover:bg-flag-blue-mid text-white rounded-full font-display text-sm font-semibold uppercase tracking-wider transition-colors disabled:opacity-50"
            >
              {submitting
                ? "Saving..."
                : editingId
                ? "Update Tournament"
                : "Create Tournament"}
            </button>
          </form>
        </div>
      )}

      {/* Success Banner */}
      {successMessage && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
          <CheckCircle2 size={20} className="text-green-600 shrink-0" />
          <p className="text-sm font-semibold text-green-700">{successMessage}</p>
        </div>
      )}

      {/* Tournaments List */}
      <h2 className="font-display text-lg font-bold uppercase tracking-wide mb-4">
        All Tournaments ({tournaments.length})
      </h2>

      {tournaments.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
          <p className="text-gray-400 text-sm">No tournaments yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tournaments.map((t) => (
            <div
              key={t.id}
              className="bg-white border border-gray-200 rounded-2xl p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-display text-base font-bold uppercase tracking-wide">
                      {t.name}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${
                        t.status === "published"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {t.status === "published" ? "Published" : "Draft"}
                    </span>
                  </div>
                  <p className="text-charcoal text-sm mb-1">
                    {formatDateRange(t.start_date, t.end_date)}
                    {t.location && ` — ${t.location}`}
                  </p>
                  {t.divisions_display && (
                    <p className="text-gray-500 text-sm truncate">
                      {t.divisions_display}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => startEdit(t)}
                    className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-flag-blue transition-colors rounded-full hover:bg-gray-100"
                    title="Edit"
                  >
                    <Pencil size={16} />
                  </button>

                  {deletingId === t.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="px-2 py-1 bg-flag-red text-white text-xs font-semibold rounded-full"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeletingId(t.id)}
                      className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-flag-red transition-colors rounded-full hover:bg-gray-100"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

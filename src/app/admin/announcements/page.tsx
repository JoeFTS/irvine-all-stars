"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Pencil, Trash2, X, CheckCircle2 } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  body: string;
  division: string | null;
  created_at: string;
  updated_at: string;
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
  "13U-Pony",
  "14U-Pony",
];

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [division, setDivision] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  // Edit mode
  const [editingId, setEditingId] = useState<string | null>(null);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    fetchAnnouncements();
  }, []);

  async function fetchAnnouncements() {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setAnnouncements(data);
    }
    setLoading(false);
  }

  function resetForm() {
    setTitle("");
    setBody("");
    setDivision("");
    setEditingId(null);
    setFormError("");
  }

  function startEdit(ann: Announcement) {
    setTitle(ann.title);
    setBody(ann.body);
    setDivision(ann.division ?? "");
    setEditingId(ann.id);
    setFormError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    if (!title.trim()) {
      setFormError("Title is required");
      return;
    }
    if (!body.trim()) {
      setFormError("Body is required");
      return;
    }

    setSubmitting(true);
    setFormError("");

    if (editingId) {
      // Update
      const { error } = await supabase
        .from("announcements")
        .update({
          title: title.trim(),
          body: body.trim(),
          division: division || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingId);

      if (error) {
        setFormError("Failed to update announcement. Please try again.");
        setSubmitting(false);
        return;
      }

      setAnnouncements((prev) =>
        prev.map((a) =>
          a.id === editingId
            ? {
                ...a,
                title: title.trim(),
                body: body.trim(),
                division: division || null,
                updated_at: new Date().toISOString(),
              }
            : a
        )
      );
    } else {
      // Create
      const { data, error } = await supabase
        .from("announcements")
        .insert({
          title: title.trim(),
          body: body.trim(),
          division: division || null,
        })
        .select()
        .single();

      if (error || !data) {
        setFormError("Failed to create announcement. Please try again.");
        setSubmitting(false);
        return;
      }

      setAnnouncements((prev) => [data, ...prev]);
    }

    const msg = editingId ? "Announcement updated!" : "Announcement posted!";
    resetForm();
    setSubmitting(false);
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), 4000);
  }

  async function handleDelete(id: string) {
    if (!supabase) return;
    const { error } = await supabase
      .from("announcements")
      .delete()
      .eq("id", id);

    if (!error) {
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    }
    setDeletingId(null);
  }

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
          <div className="h-48 bg-gray-200 rounded-lg" />
          {[1, 2].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg" />
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
          Announcements
        </h1>
      </div>

      {/* Create / Edit Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 md:p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-display text-lg font-bold uppercase tracking-wide">
            {editingId ? "Edit Announcement" : "New Announcement"}
          </h2>
          {editingId && (
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-charcoal transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="ann-title"
              className="block text-sm font-semibold text-charcoal mb-1.5"
            >
              Title <span className="text-flag-red">*</span>
            </label>
            <input
              id="ann-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Tryout Schedule Updated"
              className="w-full min-h-[44px] px-4 py-3 bg-white border border-gray-200 rounded-lg text-charcoal placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-flag-blue/30 focus:border-flag-blue transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="ann-body"
              className="block text-sm font-semibold text-charcoal mb-1.5"
            >
              Body <span className="text-flag-red">*</span>
            </label>
            <textarea
              id="ann-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder="Write the announcement details here..."
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-charcoal placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-flag-blue/30 focus:border-flag-blue transition-colors resize-y"
            />
          </div>

          <div>
            <label
              htmlFor="ann-division"
              className="block text-sm font-semibold text-charcoal mb-1.5"
            >
              Division (optional — leave blank for all)
            </label>
            <select
              id="ann-division"
              value={division}
              onChange={(e) => setDivision(e.target.value)}
              className="w-full min-h-[44px] px-4 py-3 bg-white border border-gray-200 rounded-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-flag-blue/30 focus:border-flag-blue transition-colors appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%234B5563%22%20d%3D%22M6%208L1%203h10z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_16px_center] bg-no-repeat"
            >
              <option value="">All Divisions</option>
              {DIVISIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {formError && (
            <div className="bg-flag-red/10 border border-flag-red/30 rounded-lg p-3">
              <p className="text-flag-red text-sm">{formError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="min-h-[44px] px-6 py-3 bg-flag-blue hover:bg-flag-blue-mid text-white rounded-lg font-display text-sm font-semibold uppercase tracking-wider transition-colors disabled:opacity-50"
          >
            {submitting
              ? "Saving..."
              : editingId
              ? "Update Announcement"
              : "Post Announcement"}
          </button>
        </form>
      </div>

      {/* Success Banner */}
      {successMessage && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle2 size={20} className="text-green-600 shrink-0" />
          <p className="text-sm font-semibold text-green-700">{successMessage}</p>
        </div>
      )}

      {/* Announcements List */}
      <h2 className="font-display text-lg font-bold uppercase tracking-wide mb-4">
        Posted ({announcements.length})
      </h2>

      {announcements.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-400 text-sm">No announcements yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className="bg-white border border-gray-200 rounded-lg p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-display text-base font-bold uppercase tracking-wide">
                      {ann.title}
                    </h3>
                    {ann.division && (
                      <span className="px-2 py-0.5 rounded-full bg-flag-blue/10 text-flag-blue text-xs font-semibold uppercase tracking-wide">
                        {ann.division}
                      </span>
                    )}
                  </div>
                  <p className="text-charcoal text-sm whitespace-pre-wrap leading-relaxed mb-2">
                    {ann.body}
                  </p>
                  <p className="text-xs text-gray-400">
                    Posted {new Date(ann.created_at).toLocaleDateString()}
                    {ann.updated_at !== ann.created_at &&
                      ` (edited ${new Date(ann.updated_at).toLocaleDateString()})`}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => startEdit(ann)}
                    className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-flag-blue transition-colors rounded-lg hover:bg-gray-100"
                    title="Edit"
                  >
                    <Pencil size={16} />
                  </button>

                  {deletingId === ann.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(ann.id)}
                        className="px-2 py-1 bg-flag-red text-white text-xs font-semibold rounded"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeletingId(ann.id)}
                      className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-flag-red transition-colors rounded-lg hover:bg-gray-100"
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

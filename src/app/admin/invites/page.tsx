"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Mail, RefreshCw } from "lucide-react";

const DIVISION_OPTIONS = [
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
] as const;

interface Invite {
  id: string;
  email: string;
  role: string;
  division: string | null;
  token: string;
  used: boolean;
  created_at: string;
  expires_at: string;
}

function getStatus(invite: Invite): "used" | "expired" | "pending" {
  if (invite.used) return "used";
  if (new Date(invite.expires_at) < new Date()) return "expired";
  return "pending";
}

const statusStyles = {
  pending: "bg-yellow-100 text-yellow-800",
  used: "bg-green-100 text-green-800",
  expired: "bg-gray-100 text-gray-500",
};

const roleStyles = {
  coach: "bg-blue-100 text-blue-800",
  parent: "bg-flag-blue/10 text-flag-blue",
};

export default function AdminInvitesPage() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"coach" | "parent">("coach");
  const [division, setDivision] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvites = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("invites")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) {
      setInvites(data as Invite[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSending(true);

    try {
      const res = await fetch("/api/send-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role, ...(role === "coach" && division ? { division } : {}) }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to send invite (${res.status})`);
      }

      setMessage({ type: "success", text: `Invite sent to ${email}!` });
      setEmail("");
      setDivision("");
      fetchInvites();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to send invite",
      });
    } finally {
      setSending(false);
    }
  }

  async function handleResend(invite: Invite) {
    setMessage(null);
    try {
      const res = await fetch("/api/send-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: invite.email, role: invite.role, ...(invite.division ? { division: invite.division } : {}) }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to resend invite (${res.status})`);
      }

      setMessage({ type: "success", text: `Invite resent to ${invite.email}!` });
      fetchInvites();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to resend invite",
      });
    }
  }

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <p className="text-flag-red font-display text-xs font-bold uppercase tracking-widest mb-1">
          Admin
        </p>
        <h1 className="font-display text-2xl font-bold text-flag-blue uppercase tracking-wider">
          Send Invites
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Invite coaches and parents to create their portal accounts.
        </p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mb-6 rounded px-4 py-3 text-sm ${
            message.type === "success"
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-flag-red/10 border border-flag-red/30 text-flag-red"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Send Invite Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <h2 className="font-display text-lg font-bold text-charcoal uppercase tracking-wider mb-4">
          New Invite
        </h2>
        <form onSubmit={handleSend} className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label
              htmlFor="invite-email"
              className="block text-sm font-semibold text-charcoal uppercase tracking-wide mb-1.5 font-display"
            >
              Email
            </label>
            <input
              id="invite-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded px-4 py-2.5 text-charcoal focus:outline-none focus:ring-2 focus:ring-flag-blue/30 focus:border-flag-blue transition-colors"
              placeholder="coach@example.com"
            />
          </div>
          <div className="w-full sm:w-40">
            <label
              htmlFor="invite-role"
              className="block text-sm font-semibold text-charcoal uppercase tracking-wide mb-1.5 font-display"
            >
              Role
            </label>
            <select
              id="invite-role"
              value={role}
              onChange={(e) => {
                const newRole = e.target.value as "coach" | "parent";
                setRole(newRole);
                if (newRole !== "coach") setDivision("");
              }}
              className="w-full border border-gray-200 rounded px-4 py-2.5 text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-flag-blue/30 focus:border-flag-blue transition-colors"
            >
              <option value="coach">Coach</option>
              <option value="parent">Parent</option>
            </select>
          </div>
          {role === "coach" && (
            <div className="w-full sm:w-48">
              <label
                htmlFor="invite-division"
                className="block text-sm font-semibold text-charcoal uppercase tracking-wide mb-1.5 font-display"
              >
                Division
              </label>
              <select
                id="invite-division"
                required
                value={division}
                onChange={(e) => setDivision(e.target.value)}
                className="w-full border border-gray-200 rounded px-4 py-2.5 text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-flag-blue/30 focus:border-flag-blue transition-colors"
              >
                <option value="">Select division...</option>
                {DIVISION_OPTIONS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          )}
          <button
            type="submit"
            disabled={sending}
            className="w-full sm:w-auto bg-flag-red hover:bg-flag-red-dark text-white font-display font-bold uppercase tracking-wider py-2.5 px-6 rounded transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Mail size={16} />
            {sending ? "Sending..." : "Send Invite"}
          </button>
        </form>
      </div>

      {/* Sent Invites List */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-6 border-b border-gray-200">
          <h2 className="font-display text-lg font-bold text-charcoal uppercase tracking-wider">
            Sent Invites
          </h2>
        </div>

        {loading ? (
          <div className="p-6 text-center text-gray-400 text-sm">Loading invites...</div>
        ) : invites.length === 0 ? (
          <div className="p-6 text-center text-gray-400 text-sm">No invites sent yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="px-6 py-3 font-display font-semibold text-charcoal uppercase tracking-wide text-xs">
                    Email
                  </th>
                  <th className="px-6 py-3 font-display font-semibold text-charcoal uppercase tracking-wide text-xs">
                    Role
                  </th>
                  <th className="px-6 py-3 font-display font-semibold text-charcoal uppercase tracking-wide text-xs">
                    Status
                  </th>
                  <th className="px-6 py-3 font-display font-semibold text-charcoal uppercase tracking-wide text-xs">
                    Sent
                  </th>
                  <th className="px-6 py-3 font-display font-semibold text-charcoal uppercase tracking-wide text-xs">
                    Expires
                  </th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {invites.map((invite) => {
                  const status = getStatus(invite);
                  return (
                    <tr key={invite.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-6 py-3 text-charcoal">{invite.email}</td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                            roleStyles[invite.role as keyof typeof roleStyles] ?? "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {invite.role}
                        </span>
                        {invite.role === "coach" && invite.division && (
                          <span className="inline-block ml-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                            {invite.division}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${statusStyles[status]}`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-500">
                        {new Date(invite.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3 text-gray-500">
                        {new Date(invite.expires_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3">
                        {status !== "used" && (
                          <button
                            onClick={() => handleResend(invite)}
                            className="text-flag-blue hover:text-flag-blue-mid transition-colors"
                            title="Resend invite"
                          >
                            <RefreshCw size={15} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

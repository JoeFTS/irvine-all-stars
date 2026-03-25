"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Mail, RefreshCw, Upload, Download, Plus, X } from "lucide-react";

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
  "13U-Pony",
  "14U-Pony",
] as const;

const TEAM_OPTIONS = [
  "Astros",
  "Baystars",
  "Blue Jays",
  "Cardinals",
  "Dodgers",
  "Marlins",
  "Red Sox",
  "Royals",
  "Twins",
  "Yankees",
] as const;

interface Invite {
  id: string;
  email: string;
  role: string;
  division: string | null;
  parent_name: string | null;
  child_first_name: string | null;
  child_last_name: string | null;
  token: string;
  used: boolean;
  created_at: string;
  expires_at: string;
}

interface CsvRow {
  parent_name: string;
  parent_email: string;
  child_first_name: string;
  child_last_name: string;
  division: string;
  current_team: string;
  status: "pending" | "sent" | "duplicate" | "error";
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

const csvStatusStyles = {
  pending: "bg-gray-100 text-gray-500",
  sent: "bg-green-100 text-green-800",
  duplicate: "bg-yellow-100 text-yellow-800",
  error: "bg-red-100 text-red-800",
};

function parseCSV(text: string): CsvRow[] {
  const lines = text.trim().split("\n");
  const header = lines[0].toLowerCase();
  // Detect separator (comma or tab)
  const sep = header.includes("\t") ? "\t" : ",";

  return lines
    .slice(1)
    .map((line) => {
      const cols = line.split(sep).map((c) => c.trim().replace(/^"|"$/g, ""));
      return {
        parent_name: cols[0] || "",
        parent_email: cols[1]?.toLowerCase() || "",
        child_first_name: cols[2] || "",
        child_last_name: cols[3] || "",
        division: cols[4] || "",
        current_team: cols[5] || "",
        status: "pending" as const,
      };
    })
    .filter((row) => row.parent_email); // Skip empty rows
}

async function downloadTemplate() {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("invite-template");

  // Header row
  const headers = ["parent_name", "parent_email", "child_first_name", "child_last_name", "division", "current_team"];
  const headerRow = sheet.addRow(headers);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
  });

  // Sample data row
  sheet.addRow(["Jane Smith", "jane@example.com", "Tommy", "Smith", "9U-Mustang", "Dodgers"]);

  // Set column widths
  sheet.columns = [
    { width: 20 }, // parent_name
    { width: 28 }, // parent_email
    { width: 18 }, // child_first_name
    { width: 18 }, // child_last_name
    { width: 18 }, // division
    { width: 18 }, // current_team
  ];

  // Add dropdown validations (rows 2-200)
  const divisionList = DIVISION_OPTIONS.join(",");
  const teamList = TEAM_OPTIONS.join(",");
  for (let row = 2; row <= 200; row++) {
    sheet.getCell(`E${row}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [`"${divisionList}"`],
      showErrorMessage: true,
      errorTitle: "Invalid Division",
      error: "Please select a division from the dropdown list.",
    };
    sheet.getCell(`F${row}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [`"${teamList}"`],
      showErrorMessage: true,
      errorTitle: "Invalid Team",
      error: "Please select a team from the dropdown list.",
    };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "invite-template.xlsx";
  a.click();
  URL.revokeObjectURL(url);
}

interface ChildEntry {
  firstName: string;
  lastName: string;
  division: string;
}

const emptyChild = (): ChildEntry => ({ firstName: "", lastName: "", division: "" });

export default function AdminInvitesPage() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"coach" | "parent">("coach");
  const [division, setDivision] = useState<string>("");
  const [parentName, setParentName] = useState("");
  const [children, setChildren] = useState<ChildEntry[]>([emptyChild()]);
  const [coachIsParent, setCoachIsParent] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);

  // CSV bulk upload state
  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const [csvSending, setCsvSending] = useState(false);
  const [csvProgress, setCsvProgress] = useState(0);
  const [csvResults, setCsvResults] = useState<{ sent: number; duplicates: number; failed: number } | null>(null);

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
      const payload: Record<string, unknown> = { email, role };
      if (role === "coach") {
        if (division) payload.division = division;
        if (coachIsParent) {
          payload.children = children.map((c) => ({
            child_first_name: c.firstName,
            child_last_name: c.lastName,
            division: c.division,
          }));
        }
      } else {
        if (parentName) payload.parent_name = parentName;
        payload.children = children.map((c) => ({
          child_first_name: c.firstName,
          child_last_name: c.lastName,
          division: c.division,
        }));
      }

      const res = await fetch("/api/send-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to send invite (${res.status})`);
      }

      setMessage({ type: "success", text: `Invite sent to ${email}!` });
      setEmail("");
      setDivision("");
      setParentName("");
      setChildren([emptyChild()]);
      setCoachIsParent(false);
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
      const payload: Record<string, string> = { email: invite.email, role: invite.role };
      if (invite.division) payload.division = invite.division;
      if (invite.parent_name) payload.parent_name = invite.parent_name;
      if (invite.child_first_name) payload.child_first_name = invite.child_first_name;
      if (invite.child_last_name) payload.child_last_name = invite.child_last_name;

      const res = await fetch("/api/send-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvResults(null);

    if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
      const ExcelJS = (await import("exceljs")).default;
      const workbook = new ExcelJS.Workbook();
      const buffer = await file.arrayBuffer();
      await workbook.xlsx.load(buffer);
      const sheet = workbook.worksheets[0];
      const rows: CsvRow[] = [];
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header
        const vals = (row.values as (string | undefined)[]).slice(1); // row.values is 1-indexed
        const email = (vals[1] || "").toString().trim().toLowerCase();
        if (!email) return;
        rows.push({
          parent_name: (vals[0] || "").toString().trim(),
          parent_email: email,
          child_first_name: (vals[2] || "").toString().trim(),
          child_last_name: (vals[3] || "").toString().trim(),
          division: (vals[4] || "").toString().trim(),
          current_team: (vals[5] || "").toString().trim(),
          status: "pending",
        });
      });
      setCsvRows(rows);
    } else {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        const rows = parseCSV(text);
        setCsvRows(rows);
      };
      reader.readAsText(file);
    }
  }

  async function sendAll() {
    setCsvSending(true);
    setCsvResults(null);
    let sent = 0,
      duplicates = 0,
      failed = 0;

    const updatedRows = [...csvRows];

    for (let i = 0; i < updatedRows.length; i++) {
      setCsvProgress(i + 1);
      const row = updatedRows[i];
      try {
        const res = await fetch("/api/send-invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: row.parent_email,
            role: "parent",
            division: row.division,
            parent_name: row.parent_name,
            child_first_name: row.child_first_name,
            child_last_name: row.child_last_name,
            current_team: row.current_team || undefined,
          }),
        });
        if (res.ok) {
          sent++;
          updatedRows[i] = { ...row, status: "sent" };
        } else if (res.status === 409) {
          duplicates++;
          updatedRows[i] = { ...row, status: "duplicate" };
        } else {
          failed++;
          updatedRows[i] = { ...row, status: "error" };
        }
      } catch {
        failed++;
        updatedRows[i] = { ...row, status: "error" };
      }
      setCsvRows([...updatedRows]);
    }

    setCsvSending(false);
    setCsvResults({ sent, duplicates, failed });
    fetchInvites();
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
        <form onSubmit={handleSend} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
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
                  if (newRole === "coach") {
                    setParentName("");
                    setChildren([emptyChild()]);
                    setCoachIsParent(false);
                  }
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
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Coach also a parent? */}
          {role === "coach" && (
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={coachIsParent}
                  onChange={(e) => {
                    setCoachIsParent(e.target.checked);
                    if (!e.target.checked) setChildren([emptyChild()]);
                  }}
                  className="w-4 h-4 rounded border-gray-300 text-flag-blue focus:ring-flag-blue cursor-pointer"
                />
                <span className="text-sm font-semibold text-charcoal group-hover:text-flag-blue transition-colors">
                  This coach also has a child in All-Stars
                </span>
              </label>

              {coachIsParent && (
                <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <p className="text-sm font-semibold text-charcoal uppercase tracking-wide font-display">
                    Children
                  </p>
                  {children.map((child, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row gap-3 items-start sm:items-end"
                    >
                      <div className="flex-1">
                        {idx === 0 && (
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 font-display">
                            First Name
                          </label>
                        )}
                        <input
                          type="text"
                          required
                          value={child.firstName}
                          onChange={(e) => {
                            const updated = [...children];
                            updated[idx] = { ...updated[idx], firstName: e.target.value };
                            setChildren(updated);
                          }}
                          className="w-full border border-gray-200 rounded px-4 py-2.5 text-charcoal focus:outline-none focus:ring-2 focus:ring-flag-blue/30 focus:border-flag-blue transition-colors"
                          placeholder="Tommy"
                        />
                      </div>
                      <div className="flex-1">
                        {idx === 0 && (
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 font-display">
                            Last Name
                          </label>
                        )}
                        <input
                          type="text"
                          required
                          value={child.lastName}
                          onChange={(e) => {
                            const updated = [...children];
                            updated[idx] = { ...updated[idx], lastName: e.target.value };
                            setChildren(updated);
                          }}
                          className="w-full border border-gray-200 rounded px-4 py-2.5 text-charcoal focus:outline-none focus:ring-2 focus:ring-flag-blue/30 focus:border-flag-blue transition-colors"
                          placeholder="Smith"
                        />
                      </div>
                      <div className="flex-1">
                        {idx === 0 && (
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 font-display">
                            Child&apos;s Division
                          </label>
                        )}
                        <select
                          required
                          value={child.division}
                          onChange={(e) => {
                            const updated = [...children];
                            updated[idx] = { ...updated[idx], division: e.target.value };
                            setChildren(updated);
                          }}
                          className="w-full border border-gray-200 rounded px-4 py-2.5 text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-flag-blue/30 focus:border-flag-blue transition-colors"
                        >
                          <option value="">Select division...</option>
                          {DIVISION_OPTIONS.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>
                      {children.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setChildren(children.filter((_, i) => i !== idx))}
                          className="shrink-0 p-2 text-gray-400 hover:text-flag-red transition-colors"
                          title="Remove child"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setChildren([...children, emptyChild()])}
                    className="inline-flex items-center gap-1.5 text-sm font-display font-semibold text-flag-blue hover:text-flag-blue-mid uppercase tracking-wide transition-colors mt-1"
                  >
                    <Plus size={15} />
                    Add Another Child
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Parent-specific fields */}
          {role === "parent" && (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="invite-parent-name"
                  className="block text-sm font-semibold text-charcoal uppercase tracking-wide mb-1.5 font-display"
                >
                  Parent Name
                </label>
                <input
                  id="invite-parent-name"
                  type="text"
                  required
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  className="w-full sm:w-1/2 border border-gray-200 rounded px-4 py-2.5 text-charcoal focus:outline-none focus:ring-2 focus:ring-flag-blue/30 focus:border-flag-blue transition-colors"
                  placeholder="Jane Smith"
                />
              </div>

              <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                <p className="text-sm font-semibold text-charcoal uppercase tracking-wide font-display">
                  Children
                </p>
                {children.map((child, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row gap-3 items-start sm:items-end"
                  >
                    <div className="flex-1">
                      {idx === 0 && (
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 font-display">
                          First Name
                        </label>
                      )}
                      <input
                        type="text"
                        required
                        value={child.firstName}
                        onChange={(e) => {
                          const updated = [...children];
                          updated[idx] = { ...updated[idx], firstName: e.target.value };
                          setChildren(updated);
                        }}
                        className="w-full border border-gray-200 rounded px-4 py-2.5 text-charcoal focus:outline-none focus:ring-2 focus:ring-flag-blue/30 focus:border-flag-blue transition-colors"
                        placeholder="Tommy"
                      />
                    </div>
                    <div className="flex-1">
                      {idx === 0 && (
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 font-display">
                          Last Name
                        </label>
                      )}
                      <input
                        type="text"
                        required
                        value={child.lastName}
                        onChange={(e) => {
                          const updated = [...children];
                          updated[idx] = { ...updated[idx], lastName: e.target.value };
                          setChildren(updated);
                        }}
                        className="w-full border border-gray-200 rounded px-4 py-2.5 text-charcoal focus:outline-none focus:ring-2 focus:ring-flag-blue/30 focus:border-flag-blue transition-colors"
                        placeholder="Smith"
                      />
                    </div>
                    <div className="flex-1">
                      {idx === 0 && (
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 font-display">
                          Division
                        </label>
                      )}
                      <select
                        required
                        value={child.division}
                        onChange={(e) => {
                          const updated = [...children];
                          updated[idx] = { ...updated[idx], division: e.target.value };
                          setChildren(updated);
                        }}
                        className="w-full border border-gray-200 rounded px-4 py-2.5 text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-flag-blue/30 focus:border-flag-blue transition-colors"
                      >
                        <option value="">Select division...</option>
                        {DIVISION_OPTIONS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                    {children.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setChildren(children.filter((_, i) => i !== idx))}
                        className="shrink-0 p-2 text-gray-400 hover:text-flag-red transition-colors"
                        title="Remove child"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setChildren([...children, emptyChild()])}
                  className="inline-flex items-center gap-1.5 text-sm font-display font-semibold text-flag-blue hover:text-flag-blue-mid uppercase tracking-wide transition-colors mt-1"
                >
                  <Plus size={15} />
                  Add Another Child
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={sending}
              className="w-full sm:w-auto bg-flag-red hover:bg-flag-red-dark text-white font-display font-bold uppercase tracking-wider py-2.5 px-6 rounded transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Mail size={16} />
              {sending ? "Sending..." : "Send Invite"}
            </button>
          </div>
        </form>
      </div>

      {/* CSV Bulk Upload */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <p className="text-flag-red font-display text-xs font-bold uppercase tracking-widest mb-1">
          Bulk Import
        </p>
        <h2 className="font-display text-lg font-bold text-charcoal uppercase tracking-wider mb-2">
          Upload CSV
        </h2>
        <p className="text-gray-500 text-sm mb-4">
          Upload a CSV file to send multiple parent invites at once.
        </p>

        <div className="flex flex-wrap gap-3 items-center mb-4">
          <button
            onClick={downloadTemplate}
            className="inline-flex items-center gap-2 text-sm font-display font-semibold text-flag-blue hover:text-flag-blue-mid uppercase tracking-wide transition-colors"
          >
            <Download size={15} />
            Download Template
          </button>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-4">
          <Upload size={24} className="mx-auto text-gray-400 mb-2" />
          <p className="text-sm text-gray-500 mb-2">Choose a CSV file or drag and drop</p>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileUpload}
            className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-flag-blue/10 file:text-flag-blue hover:file:bg-flag-blue/20 file:cursor-pointer"
          />
        </div>

        {/* Preview table */}
        {csvRows.length > 0 && (
          <>
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    <th className="px-4 py-2 font-display font-semibold text-charcoal uppercase tracking-wide text-xs">
                      Parent Name
                    </th>
                    <th className="px-4 py-2 font-display font-semibold text-charcoal uppercase tracking-wide text-xs">
                      Email
                    </th>
                    <th className="px-4 py-2 font-display font-semibold text-charcoal uppercase tracking-wide text-xs">
                      Child First
                    </th>
                    <th className="px-4 py-2 font-display font-semibold text-charcoal uppercase tracking-wide text-xs">
                      Child Last
                    </th>
                    <th className="px-4 py-2 font-display font-semibold text-charcoal uppercase tracking-wide text-xs">
                      Division
                    </th>
                    <th className="px-4 py-2 font-display font-semibold text-charcoal uppercase tracking-wide text-xs">
                      Current Team
                    </th>
                    <th className="px-4 py-2 font-display font-semibold text-charcoal uppercase tracking-wide text-xs">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {csvRows.map((row, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-2 text-charcoal">{row.parent_name}</td>
                      <td className="px-4 py-2 text-charcoal">{row.parent_email}</td>
                      <td className="px-4 py-2 text-charcoal">{row.child_first_name}</td>
                      <td className="px-4 py-2 text-charcoal">{row.child_last_name}</td>
                      <td className="px-4 py-2 text-charcoal">{row.division}</td>
                      <td className="px-4 py-2 text-charcoal">{row.current_team}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${csvStatusStyles[row.status]}`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Progress bar */}
            {csvSending && (
              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Sending invites...</span>
                  <span>
                    {csvProgress}/{csvRows.length}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-flag-blue h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(csvProgress / csvRows.length) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Results summary */}
            {csvResults && (
              <div className="mb-4 rounded px-4 py-3 text-sm bg-gray-50 border border-gray-200">
                <span className="text-green-700 font-semibold">{csvResults.sent} sent</span>
                {csvResults.duplicates > 0 && (
                  <span className="text-yellow-700 font-semibold ml-3">
                    {csvResults.duplicates} duplicates
                  </span>
                )}
                {csvResults.failed > 0 && (
                  <span className="text-red-700 font-semibold ml-3">
                    {csvResults.failed} failed
                  </span>
                )}
              </div>
            )}

            <button
              onClick={sendAll}
              disabled={csvSending}
              className="bg-flag-red hover:bg-flag-red-dark text-white font-display font-bold uppercase tracking-wider py-2.5 px-6 rounded transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Mail size={16} />
              {csvSending
                ? `Sending ${csvProgress}/${csvRows.length}...`
                : `Send All (${csvRows.length} invites)`}
            </button>
          </>
        )}
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
                    Parent Name
                  </th>
                  <th className="px-6 py-3 font-display font-semibold text-charcoal uppercase tracking-wide text-xs">
                    Child Name
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
                        {invite.division && (
                          <span className="inline-block ml-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                            {invite.division}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-charcoal">
                        {invite.parent_name || "\u2014"}
                      </td>
                      <td className="px-6 py-3 text-charcoal">
                        {invite.child_first_name && invite.child_last_name
                          ? `${invite.child_first_name} ${invite.child_last_name}`
                          : "\u2014"}
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

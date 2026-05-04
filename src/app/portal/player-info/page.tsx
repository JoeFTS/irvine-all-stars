"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { HelpTooltip } from "@/components/help-tooltip";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Registration {
  id: string;
  player_first_name: string;
  player_middle_name: string | null;
  player_last_name: string;
  player_suffix: string | null;
  division: string;
  parent_email: string;
  street_address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
}

interface PlayerInfoForm {
  player_middle_name: string;
  player_suffix: string;
  street_address: string;
  city: string;
  state: string;
  zip: string;
}

const SUFFIX_OPTIONS = ["", "Jr", "Sr", "II", "III", "IV"] as const;

const initialForm: PlayerInfoForm = {
  player_middle_name: "",
  player_suffix: "",
  street_address: "",
  city: "",
  state: "CA",
  zip: "",
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function PlayerInfoPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<PlayerInfoForm>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState("");

  /* ---- Auth guard ---- */
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login?redirect=/portal/player-info");
    }
  }, [authLoading, user, router]);

  /* ---- Load registrations for this parent ---- */
  useEffect(() => {
    if (!user || !supabase) {
      setLoading(false);
      return;
    }

    async function fetchData() {
      if (!supabase || !user) return;
      setLoading(true);

      const { data: regs } = await supabase
        .from("tryout_registrations")
        .select(
          "id, player_first_name, player_middle_name, player_last_name, player_suffix, division, parent_email, street_address, city, state, zip"
        )
        .or(
          `parent_email.eq.${user.email},secondary_parent_email.eq.${user.email}`
        )
        .order("submitted_at", { ascending: false });

      const regData = (regs ?? []) as Registration[];
      setRegistrations(regData);

      // Honor ?player= query param if present, else default to first
      const params = new URLSearchParams(window.location.search);
      const requested = params.get("player");
      const initialReg =
        regData.find((r) => r.id === requested) ?? regData[0] ?? null;

      if (initialReg) {
        setSelectedId(initialReg.id);
        loadFormFromRegistration(initialReg);
      }

      setLoading(false);
    }

    fetchData();
  }, [user]);

  function loadFormFromRegistration(reg: Registration) {
    setForm({
      player_middle_name: reg.player_middle_name ?? "",
      player_suffix: reg.player_suffix ?? "",
      street_address: reg.street_address ?? "",
      city: reg.city ?? "",
      state: reg.state ?? "CA",
      zip: reg.zip ?? "",
    });
    setSavedAt(null);
    setError("");
  }

  function handleSelectPlayer(id: string) {
    setSelectedId(id);
    const reg = registrations.find((r) => r.id === id);
    if (reg) loadFormFromRegistration(reg);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !selectedId) return;

    // Light validation
    const zip = form.zip.trim();
    if (zip && !/^\d{5}$/.test(zip)) {
      setError("ZIP must be 5 digits.");
      return;
    }
    const stateVal = form.state.trim().toUpperCase();
    if (stateVal && !/^[A-Z]{2}$/.test(stateVal)) {
      setError("State must be a 2-letter abbreviation (e.g. CA).");
      return;
    }

    setSaving(true);
    setError("");

    const payload = {
      player_middle_name: form.player_middle_name.trim() || null,
      player_suffix: form.player_suffix.trim() || null,
      street_address: form.street_address.trim() || null,
      city: form.city.trim() || null,
      state: stateVal || null,
      zip: zip || null,
    };

    const { error: updateError } = await supabase
      .from("tryout_registrations")
      .update(payload)
      .eq("id", selectedId);

    if (updateError) {
      setError("Something went wrong. Please try again.");
      setSaving(false);
      return;
    }

    // Reflect saved values back into local state
    setRegistrations((prev) =>
      prev.map((r) =>
        r.id === selectedId
          ? {
              ...r,
              player_middle_name: payload.player_middle_name,
              player_suffix: payload.player_suffix,
              street_address: payload.street_address,
              city: payload.city,
              state: payload.state,
              zip: payload.zip,
            }
          : r
      )
    );

    setSaving(false);
    setSavedAt(Date.now());
  }

  /* ---- Loading ---- */
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-off-white pt-16 flex items-center justify-center">
        <p className="text-gray-400 font-display uppercase tracking-wider text-sm">
          Loading...
        </p>
      </div>
    );
  }

  /* ---- No registrations ---- */
  if (registrations.length === 0) {
    return (
      <div className="min-h-screen bg-off-white pt-[120px] px-6">
        <div className="max-w-xl mx-auto bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <p className="text-gray-500 mb-4">
            No registrations found for your account.
          </p>
          <Link
            href="/portal"
            className="text-flag-blue font-semibold underline"
          >
            Back to Portal
          </Link>
        </div>
      </div>
    );
  }

  const selectedReg = registrations.find((r) => r.id === selectedId);

  return (
    <div className="min-h-screen bg-off-white pt-[120px] pb-16 px-6">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/portal"
          className="text-sm text-flag-blue hover:underline mb-4 inline-block"
        >
          &larr; Back to Portal
        </Link>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8">
          <h1 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide mb-1 flex items-center">
            Player Info
            <HelpTooltip
              text="Full legal name and home address used to complete the PONY tournament affidavit."
              guideUrl="/portal/help"
            />
          </h1>
          <p className="text-gray-500 text-sm mb-6">
            Required for the PONY tournament affidavit. Must match the
            player&apos;s birth certificate.
          </p>

          {/* Player selector when multiple players */}
          {registrations.length > 1 && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-charcoal mb-2">
                Player
              </label>
              <div className="flex flex-wrap gap-2">
                {registrations.map((reg) => {
                  const isActive = reg.id === selectedId;
                  const label = `${reg.player_first_name} ${reg.player_last_name}`.trim();
                  return (
                    <button
                      key={reg.id}
                      type="button"
                      onClick={() => handleSelectPlayer(reg.id)}
                      className={`min-h-[44px] px-4 py-2 rounded-full font-display text-xs font-semibold uppercase tracking-widest transition-colors border ${
                        isActive
                          ? "bg-flag-blue text-white border-flag-blue"
                          : "bg-white text-charcoal border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {selectedReg && (
            <p className="text-gray-500 text-sm mb-6">
              For{" "}
              <strong>
                {selectedReg.player_first_name} {selectedReg.player_last_name}
              </strong>{" "}
              ({selectedReg.division})
            </p>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-flag-red text-sm p-4 rounded-xl mb-6">
              {error}
            </div>
          )}

          {savedAt && !error && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm p-4 rounded-xl mb-6 flex items-center gap-2">
              <svg
                className="w-5 h-5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Saved.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Legal Name */}
            <div>
              <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-flag-blue mb-3">
                Legal Name
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-charcoal mb-1">
                    Middle Name <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={form.player_middle_name}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        player_middle_name: e.target.value,
                      }))
                    }
                    placeholder="As shown on birth certificate"
                    className="w-full min-h-[44px] border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-flag-blue/30 focus:border-flag-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-1">
                    Suffix <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <select
                    value={form.player_suffix}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        player_suffix: e.target.value,
                      }))
                    }
                    className="w-full min-h-[44px] border border-gray-300 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-flag-blue/30 focus:border-flag-blue"
                  >
                    {SUFFIX_OPTIONS.map((opt) => (
                      <option key={opt || "none"} value={opt}>
                        {opt || "None"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Home Address */}
            <div>
              <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-flag-blue mb-3">
                Home Address
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={form.street_address}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        street_address: e.target.value,
                      }))
                    }
                    placeholder="123 Main St"
                    autoComplete="street-address"
                    className="w-full min-h-[44px] border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-flag-blue/30 focus:border-flag-blue"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
                  <div className="sm:col-span-3">
                    <label className="block text-sm font-semibold text-charcoal mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, city: e.target.value }))
                      }
                      placeholder="Irvine"
                      autoComplete="address-level2"
                      className="w-full min-h-[44px] border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-flag-blue/30 focus:border-flag-blue"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-sm font-semibold text-charcoal mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      value={form.state}
                      maxLength={2}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          state: e.target.value.toUpperCase().slice(0, 2),
                        }))
                      }
                      placeholder="CA"
                      autoComplete="address-level1"
                      className="w-full min-h-[44px] border border-gray-300 rounded-xl px-4 py-2.5 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-flag-blue/30 focus:border-flag-blue"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-charcoal mb-1">
                      ZIP
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.zip}
                      maxLength={5}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          zip: e.target.value.replace(/\D/g, "").slice(0, 5),
                        }))
                      }
                      placeholder="92602"
                      autoComplete="postal-code"
                      className="w-full min-h-[44px] border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-flag-blue/30 focus:border-flag-blue"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-flag-red hover:bg-flag-red-dark disabled:opacity-50 text-white px-6 py-3.5 rounded-full font-display text-sm font-semibold uppercase tracking-widest transition-colors"
            >
              {saving ? "Saving..." : "Save Player Info"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

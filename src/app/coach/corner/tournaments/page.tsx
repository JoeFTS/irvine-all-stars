"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Trophy,
  BookOpen,
  Download,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Calendar,
  MapPin,
  FileText,
  CheckSquare,
  ClipboardCheck,
  Award,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import {
  ruleFamilies,
  matchRuleFamily,
  divisions,
  type RuleFamilyKey,
} from "@/content/divisions";

const RULEBOOK_PATH = "/rules/2026-pony-baseball-rulebook.pdf";
const RULEBOOK_FILENAME = "2026-pony-baseball-rulebook.pdf";

interface Tournament {
  id: string;
  name: string;
  start_date: string;
  end_date: string | null;
  location: string | null;
  registration_url: string | null;
  registration_deadline: string | null;
  flyer_url: string | null;
  division_ids: string[] | null;
}

export default function CornerTournamentsPage() {
  const { user } = useAuth();
  const [coachDivision, setCoachDivision] = useState<string | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [showAllDivisions, setShowAllDivisions] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !supabase) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      if (!supabase || !user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("division")
        .eq("id", user.id)
        .single();

      if (cancelled) return;
      const division = (profile?.division as string | null) ?? null;
      setCoachDivision(division);

      let query = supabase
        .from("tournaments")
        .select(
          "id, name, start_date, end_date, location, registration_url, registration_deadline, flyer_url, division_ids"
        )
        .eq("status", "published")
        .gte("start_date", new Date().toISOString().slice(0, 10))
        .order("start_date", { ascending: true })
        .limit(6);

      if (division) {
        query = query.contains("division_ids", [division]);
      }

      const { data: tournamentsData } = await query;
      if (cancelled) return;
      setTournaments((tournamentsData ?? []) as Tournament[]);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const familyKey: RuleFamilyKey | null = matchRuleFamily(coachDivision);
  const family = familyKey ? ruleFamilies[familyKey] : null;

  return (
    <>
      {/* ===== HERO HEADER ===== */}
      <div className="relative overflow-hidden rounded-2xl bg-flag-blue p-6 sm:p-8">
        <div
          aria-hidden
          className="absolute inset-0 text-white/[0.05] text-xl leading-[2.8rem] tracking-widest overflow-hidden pointer-events-none p-2"
        >
          {"\u2605 ".repeat(200)}
        </div>
        <div aria-hidden className="absolute top-0 left-0 w-24 h-1 bg-flag-red" />
        <div aria-hidden className="absolute top-0 left-0 w-1 h-24 bg-flag-red" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="bg-white/10 text-star-gold-bright p-3 rounded-xl border border-white/10 backdrop-blur-sm shrink-0">
            <Trophy size={28} />
          </div>
          <div>
            <p className="font-display text-xs font-semibold text-star-gold-bright uppercase tracking-[3px] mb-1">
              &#9733; Coach&apos;s Corner
            </p>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-white uppercase tracking-wide leading-tight">
              Tournaments
            </h1>
            <p className="text-white/70 text-sm mt-1">
              Everything you need to prep for tournament play.
            </p>
          </div>
        </div>
      </div>

      {/* ===== YOUR DIVISION RULES ===== */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="relative overflow-hidden bg-flag-blue p-5 sm:p-6 text-white">
          <div
            aria-hidden
            className="absolute inset-0 text-white/[0.05] text-lg leading-[2.4rem] tracking-widest overflow-hidden pointer-events-none p-2"
          >
            {"\u2605 ".repeat(120)}
          </div>
          <div aria-hidden className="absolute top-0 left-0 w-20 h-1 bg-flag-red" />
          <div aria-hidden className="absolute top-0 left-0 w-1 h-20 bg-flag-red" />
          <div className="relative z-10 flex items-start gap-4">
            <div className="bg-white/10 text-star-gold-bright p-3 rounded-xl shrink-0 border border-white/10 backdrop-blur-sm">
              <BookOpen size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display text-xs font-semibold uppercase tracking-[2px] text-star-gold-bright mb-1">
                Your Division Rules
              </p>
              {family ? (
                <>
                  <p className="font-display text-2xl font-bold uppercase tracking-wide">
                    {coachDivision} &middot; {family.label}
                  </p>
                  <p className="text-white/70 text-sm mt-0.5">
                    Diamond: {family.diamondFeet} ft &middot; Pitching:{" "}
                    {family.pitchingDistance}
                  </p>
                </>
              ) : (
                <>
                  <p className="font-display text-2xl font-bold uppercase tracking-wide">
                    2026 PONY Rulebook
                  </p>
                  <p className="text-white/70 text-sm mt-0.5">
                    {coachDivision
                      ? "Division not recognized - showing the full rulebook."
                      : "Assign a division to see your division-specific rules."}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {family && (
          <div className="p-5 sm:p-6 space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatBox label="Game Length" value={family.gameInnings} />
              <StatBox label="Pitch Type" value={family.pitchType} />
              <StatBox label="Leads & Steals" value={family.leadOffsAndSteals} />
              <StatBox label="Mercy Rule" value={family.mercyRule} />
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="font-display text-xs font-semibold uppercase tracking-[2px] text-flag-red mb-2">
                Daily Pitch Count
              </p>
              <p className="text-sm text-charcoal leading-relaxed">
                {family.dailyPitchMax}
              </p>
            </div>

            <div>
              <p className="font-display text-xs font-semibold uppercase tracking-[2px] text-flag-red mb-2">
                Key Rules at a Glance
              </p>
              <ul className="space-y-2">
                {family.quickRules.map((rule, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-charcoal"
                  >
                    <span className="inline-flex items-center justify-center shrink-0 w-5 h-5 rounded-full bg-flag-blue/10 text-flag-blue text-[10px] font-bold mt-0.5">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="border-t border-gray-100 bg-gradient-to-r from-off-white to-gray-50 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="font-display text-[11px] font-semibold uppercase tracking-[2px] text-flag-red mb-0.5">
              Official Rulebook
            </p>
            <p className="font-display text-sm font-bold uppercase tracking-wide text-charcoal">
              2026 PONY Baseball Rulebook
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              The complete official rulebook. Every division is covered.
            </p>
          </div>
          <a
            href={RULEBOOK_PATH}
            download={RULEBOOK_FILENAME}
            className="relative inline-flex items-center gap-2.5 bg-flag-red text-white px-7 py-3.5 rounded-full font-display text-sm font-semibold uppercase tracking-[1.5px] transition-all hover:bg-flag-red-dark hover:-translate-y-0.5 hover:shadow-lg hover:shadow-flag-red/30 active:scale-[0.97] min-h-[48px] shrink-0 overflow-hidden group/btn"
          >
            <span
              aria-hidden
              className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-star-gold-bright transition-all duration-300 group-hover/btn:w-2/3"
            />
            <Download size={16} className="relative" />
            <span className="relative">Download PDF</span>
          </a>
        </div>

        {/* All divisions accordion */}
        <div className="border-t border-gray-100">
          <button
            onClick={() => setShowAllDivisions((v) => !v)}
            className="w-full px-5 sm:px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors min-h-[44px]"
          >
            <span className="font-display text-xs font-semibold uppercase tracking-[2px] text-flag-blue">
              View rules for all divisions
            </span>
            {showAllDivisions ? (
              <ChevronUp size={16} className="text-flag-blue" />
            ) : (
              <ChevronDown size={16} className="text-flag-blue" />
            )}
          </button>
          {showAllDivisions && (
            <div className="px-5 sm:px-6 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {divisions.map((d) => {
                const fam = ruleFamilies[d.ruleFamily];
                return (
                  <div
                    key={d.id}
                    className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-lg px-3 py-2.5 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-charcoal">
                        {d.name} {d.ponyName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {fam.diamondFeet} ft &middot; {fam.gameInnings}
                      </p>
                    </div>
                    <a
                      href={RULEBOOK_PATH}
                      download={RULEBOOK_FILENAME}
                      className="text-xs font-semibold text-flag-blue hover:text-flag-red shrink-0"
                      aria-label={`Download rulebook for ${d.name} ${d.ponyName}`}
                    >
                      <Download size={14} />
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ===== UPCOMING TOURNAMENTS ===== */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="font-display text-lg font-bold uppercase tracking-wide text-flag-blue">
            Upcoming Tournaments
          </h2>
          <Link
            href="/coach/tournaments"
            className="text-xs font-semibold text-flag-blue hover:text-flag-red flex items-center gap-1"
          >
            Full list <ExternalLink size={12} />
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-gray-400">Loading tournaments...</p>
        ) : tournaments.length === 0 ? (
          <p className="text-sm text-gray-500">
            No upcoming tournaments published for your division yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {tournaments.map((t) => (
              <li
                key={t.id}
                className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex items-start gap-3"
              >
                <div className="bg-flag-blue/10 text-flag-blue p-2 rounded-lg shrink-0">
                  <Trophy size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-charcoal">{t.name}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(t.start_date + "T00:00:00").toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric", year: "numeric" }
                      )}
                    </span>
                    {t.location && (
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        {t.location}
                      </span>
                    )}
                  </div>
                  {t.registration_url && (
                    <a
                      href={t.registration_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-flag-blue hover:text-flag-red"
                    >
                      Registration <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ===== TOURNAMENT RULES & FORMS ===== */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6">
        <h2 className="font-display text-lg font-bold uppercase tracking-wide text-flag-blue mb-4">
          Tournament Rules &amp; Forms
        </h2>
        <div className="space-y-3">
          <ResourceLink
            icon={BookOpen}
            title="2026 PONY Baseball Rulebook"
            description="The complete official rulebook (PDF)."
            href={RULEBOOK_PATH}
            download={RULEBOOK_FILENAME}
          />
          <ResourceLink
            icon={FileText}
            title="PONY Tournament Rules Quick Reference"
            description="Irvine PONY tournament rules, organized by division."
            href="/coach/tournament-rules"
          />
          <ResourceLink
            icon={ExternalLink}
            title="Sanction Play Schedule"
            description="Full Google Sheet schedule for the season."
            href="https://docs.google.com/spreadsheets/d/1Drx76VHKBQrb-dcL8nCfBUfxZio9pVXBVf01HHbcuh0/edit?gid=1045930144#gid=1045930144"
            external
          />
        </div>
      </div>

      {/* ===== PRE-TOURNAMENT CHECKLIST ===== */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6">
        <h2 className="font-display text-lg font-bold uppercase tracking-wide text-flag-blue mb-1">
          Pre-Tournament Checklist
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Make sure every box is checked before your first tournament game.
        </p>
        <ul className="space-y-2">
          <ChecklistItem
            icon={CheckSquare}
            label="Binder checklist 100% complete"
            href="/coach/checklist"
          />
          <ChecklistItem
            icon={Award}
            label="Concussion and cardiac arrest certifications uploaded"
            href="/coach/certifications"
          />
          <ChecklistItem
            icon={ClipboardCheck}
            label="Tournament rules agreement acknowledged"
            href="/coach/tournament-rules"
          />
        </ul>
      </div>
    </>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
      <p className="text-[10px] font-display font-semibold uppercase tracking-[1.5px] text-flag-red mb-1">
        {label}
      </p>
      <p className="text-xs text-charcoal leading-snug">{value}</p>
    </div>
  );
}

function ResourceLink({
  icon: Icon,
  title,
  description,
  href,
  download,
  external,
}: {
  icon: typeof BookOpen;
  title: string;
  description: string;
  href: string;
  download?: string;
  external?: boolean;
}) {
  const className =
    "flex items-start gap-3 bg-gray-50 hover:bg-flag-blue/5 border border-gray-100 rounded-xl p-4 transition-colors group min-h-[44px]";
  const inner = (
    <>
      <div className="bg-white text-flag-blue p-2 rounded-lg border border-gray-200 shrink-0">
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-charcoal text-sm">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      {download ? (
        <Download
          size={16}
          className="text-gray-400 group-hover:text-flag-blue shrink-0 mt-1"
        />
      ) : external ? (
        <ExternalLink
          size={16}
          className="text-gray-400 group-hover:text-flag-blue shrink-0 mt-1"
        />
      ) : null}
    </>
  );

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {inner}
      </a>
    );
  }
  if (download) {
    return (
      <a href={href} download={download} className={className}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {inner}
    </Link>
  );
}

function ChecklistItem({
  icon: Icon,
  label,
  href,
}: {
  icon: typeof BookOpen;
  label: string;
  href: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-3 bg-gray-50 hover:bg-flag-blue/5 border border-gray-100 rounded-xl p-3 transition-colors min-h-[44px]"
      >
        <Icon size={18} className="text-flag-blue shrink-0" />
        <span className="text-sm text-charcoal flex-1">{label}</span>
      </Link>
    </li>
  );
}

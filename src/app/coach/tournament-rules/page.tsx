"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { CheckCircle2, AlertTriangle, BookOpen, ExternalLink } from "lucide-react";

interface AgreementRecord {
  id: string;
  agreement_type: string;
  coach_name: string;
  acknowledged_at: string;
}

const DIVISIONS = [
  { key: "shetland", label: "Shetland", subtitle: "5U, 6U" },
  { key: "pinto_machine", label: "Pinto Machine Pitch", subtitle: "7U MP, 8U MP" },
  { key: "pinto_kid", label: "Pinto Kid Pitch", subtitle: "7U KP, 8U KP" },
  { key: "mustang_bronco", label: "Mustang / Bronco", subtitle: "9U-12U" },
  { key: "pony", label: "Pony", subtitle: "13U, 14U" },
] as const;

// Map coach profile division (e.g. "12U-Bronco") to tab key
function divisionToTabKey(division: string | null): string | null {
  if (!division) return null;
  const d = division.toLowerCase();
  if (d.includes("shetland")) return "shetland";
  if (d.includes("pinto") && d.includes("mp")) return "pinto_machine";
  if (d.includes("pinto") && d.includes("kp")) return "pinto_kid";
  if (d.includes("mustang") || d.includes("bronco")) return "mustang_bronco";
  if (d.includes("pony")) return "pony";
  return null;
}

const COMMON_RULES = {
  title: "TOURNAMENT BASEBALL RULES: KNOW THE RULES!",
  sections: [
    {
      heading: "Manager & Coaching Staff Responsibilities",
      content:
        "Manager & Coaching staff's responsibility. We do not play by your League Rules. Study the rules thoroughly. If you have questions, ask your League President, Player Agent, Division Director, or a PONY Field Director PRIOR to stepping onto the field. Rules will NOT be answered during your game. Manager needs to have rules at all tournament games.",
    },
    {
      heading: "Manager & Coaching Staff Conduct",
      items: [
        "Responsible for knowing the rules & controlling team & fans",
        "Be a good example — don't get ejected!",
        "Only coaches on the Affidavit are allowed on the playing field, in the dugout, or bullpen",
        "Coaching staff may NOT leave the dugout area during the game (no visiting fans, watching from backstop, going to snack bar)",
        "Managers and coaches ejected must leave the BallPark",
        "Must be in baseball pants, closed-toe shoes, and jersey/league shirt",
        "Meet with PONY Director 60 minutes prior to your first game at each level",
      ],
    },
  ],
  reminders: [
    "This document does not replace meeting with the on-site PONY Director 60 minutes prior to your first game",
    "Know your pitching & batting rules thoroughly BEFORE tournament play",
    "NO CIF or Local League Rules apply",
  ],
};

interface RuleBook {
  name: string;
  url: string;
}

const PONY_RULEBOOK_URL =
  "https://cdn3.sportngin.com/attachments/document/f8cc-2645833/2026_PONY_Baseball_Rule_Book_Final_Proof__1_.pdf";
const MLB_RULES_URL =
  "https://mktg.mlbstatic.com/mlb/official-information/2025-official-baseball-rules.pdf";

const COMMON_RULE_BOOKS: RuleBook[] = [
  { name: "2026 PONY Baseball Rule Book (Blue & White Pages)", url: PONY_RULEBOOK_URL },
  { name: "Official MLB Baseball Rules (2025)", url: MLB_RULES_URL },
];

const DIVISION_SPECIFIC: Record<
  string,
  { note: string; ruleBooks: RuleBook[] }
> = {
  shetland: {
    note: "Shetland — West Zone Tournament Supplemental Rules apply.",
    ruleBooks: [
      ...COMMON_RULE_BOOKS,
      {
        name: "Shetland West Zone Tournament Supplemental Rules",
        url: "https://ponybbsb.freshdesk.com/en/support/solutions/articles/27000078348-2025-west-zone-supplemental-rules-for-shetland-league-tournaments",
      },
    ],
  },
  pinto_machine: {
    note: "Supplement Rules (Pinto Machine) apply. Check rules regarding balls in play hitting the machine or coach specifically.",
    ruleBooks: [
      ...COMMON_RULE_BOOKS,
      {
        name: "Pinto Machine Pitch Supplemental Rules",
        url: "https://ponybbsb.freshdesk.com/en/support/solutions/articles/27000078350-2025-west-zone-supplemental-rules-for-pinto-machine-pitch-league-tournaments",
      },
    ],
  },
  pinto_kid: {
    note: "Pinto Pitch — West Zone Tournament Supplemental Rules apply. Know by heart the bat 9 play 9 rules regarding substitutions, pitch counts, and rest day language.",
    ruleBooks: [
      ...COMMON_RULE_BOOKS,
      {
        name: "Pinto Kid Pitch West Zone Tournament Supplemental Rules",
        url: "https://ponybbsb.freshdesk.com/en/support/solutions/articles/27000078349-2025-west-zone-supplemental-rules-for-pinto-player-pitch-league-tournaments",
      },
    ],
  },
  mustang_bronco: {
    note: "PONY Baseball Rule Book (Blue Pages), PONY Baseball Rule (White Pages), Official MLB Baseball Rules apply.",
    ruleBooks: [...COMMON_RULE_BOOKS],
  },
  pony: {
    note: "PONY Baseball Rule Book (Blue Pages), PONY Baseball Rule (White Pages), Official MLB Baseball Rules apply. Pony division is inter-league — know host league ground rules.",
    ruleBooks: [...COMMON_RULE_BOOKS],
  },
};

export default function TournamentRulesPage() {
  const { user } = useAuth();
  const [agreements, setAgreements] = useState<AgreementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDivision, setActiveDivision] = useState<string>("shetland");
  const [coachName, setCoachName] = useState("");
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchAgreements = useCallback(async () => {
    if (!supabase || !user) return;
    try {
      const { data, error } = await supabase
        .from("tournament_agreements")
        .select("*")
        .eq("coach_id", user.id);
      if (!error && data) {
        setAgreements(data as AgreementRecord[]);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAgreements();
  }, [fetchAgreements]);

  // Auto-select division tab based on coach's profile
  const [divisionLoaded, setDivisionLoaded] = useState(false);
  useEffect(() => {
    async function loadCoachDivision() {
      if (!supabase || !user || divisionLoaded) return;
      const { data } = await supabase
        .from("profiles")
        .select("division")
        .eq("id", user.id)
        .single();
      if (data?.division) {
        const tabKey = divisionToTabKey(data.division);
        if (tabKey) setActiveDivision(tabKey);
      }
      setDivisionLoaded(true);
    }
    loadCoachDivision();
  }, [user, divisionLoaded]);

  // Reset form when switching divisions
  useEffect(() => {
    setChecked(false);
    setCoachName("");
    setSubmitMessage(null);
  }, [activeDivision]);

  const getAgreement = (divKey: string) =>
    agreements.find((a) => a.agreement_type === divKey);

  const handleSubmit = async () => {
    if (!supabase || !user || !checked || !coachName.trim()) return;

    setSubmitting(true);
    const now = new Date().toISOString();

    const existing = getAgreement(activeDivision);

    const divLabel = DIVISIONS.find((d) => d.key === activeDivision)?.label ?? activeDivision;
    let error;
    if (existing) {
      ({ error } = await supabase
        .from("tournament_agreements")
        .update({
          coach_name: coachName.trim(),
          acknowledged: true,
          acknowledged_at: now,
        })
        .eq("id", existing.id));
    } else {
      ({ error } = await supabase.from("tournament_agreements").insert({
        coach_id: user.id,
        agreement_type: activeDivision,
        division: divLabel,
        coach_name: coachName.trim(),
        acknowledged: true,
        acknowledged_at: now,
      }));
    }

    if (error) {
      console.error("Acknowledgment error:", error);
      setSubmitMessage({ type: "error", text: "Failed to save acknowledgment. Please try again." });
    } else {
      await fetchAgreements();
      setSubmitMessage({ type: "success", text: `${divLabel} rules acknowledged successfully!` });
      setTimeout(() => setSubmitMessage(null), 6000);
    }

    setSubmitting(false);
    setChecked(false);
    setCoachName("");
  };

  const divisionConfig = DIVISION_SPECIFIC[activeDivision];
  const existingAgreement = getAgreement(activeDivision);

  return (
    <div className="p-6 md:p-10 max-w-3xl">
      {/* Header */}
      <p className="font-display text-sm font-semibold text-flag-red uppercase tracking-[3px] mb-1">
        Coach
      </p>
      <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide mb-4">
        Pre-Tournament Rules
      </h1>
      <p className="text-gray-600 mb-6">
        Read and acknowledge the rules for your division before tournament play
        begins.
      </p>

      {/* Division Tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {DIVISIONS.map((div) => {
          const isActive = activeDivision === div.key;
          const isAcknowledged = !!getAgreement(div.key);
          return (
            <button
              key={div.key}
              onClick={() => setActiveDivision(div.key)}
              className={`relative px-4 py-3 sm:py-2.5 min-h-[44px] rounded-full text-sm font-semibold transition-colors border ${
                isActive
                  ? "bg-flag-blue text-white border-flag-blue"
                  : "bg-white text-charcoal border-gray-200 hover:border-flag-blue hover:text-flag-blue"
              }`}
            >
              <span>{div.label}</span>
              <span className="block text-[10px] font-normal opacity-70">
                {div.subtitle}
              </span>
              {isAcknowledged && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle2 size={10} className="text-white" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <p className="text-gray-500">Loading rules...</p>
      ) : (
        <div className="space-y-6">
          {/* Common Rules */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-flag-red/5">
              <h2 className="font-display text-lg font-bold uppercase tracking-wide text-flag-red">
                {COMMON_RULES.title}
              </h2>
            </div>
            <div className="px-4 sm:px-6 py-5 space-y-5">
              {COMMON_RULES.sections.map((section) => (
                <div key={section.heading}>
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider text-charcoal mb-2">
                    {section.heading}
                  </h3>
                  {"content" in section && section.content && (
                    <p className="text-sm text-gray-700 leading-relaxed mb-3">
                      {section.content}
                    </p>
                  )}
                  {"items" in section && section.items && (
                    <ul className="space-y-1.5">
                      {section.items.map((item, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-gray-700"
                        >
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-flag-blue shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}

              {/* Important Reminders */}
              <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-lg p-4">
                <div className="flex items-start gap-2 mb-2">
                  <AlertTriangle
                    size={18}
                    className="text-amber-600 mt-0.5 shrink-0"
                  />
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider text-amber-800">
                    Important Reminders
                  </h3>
                </div>
                <ul className="space-y-1.5 ml-6">
                  {COMMON_RULES.reminders.map((reminder, i) => (
                    <li key={i} className="text-sm text-amber-900 font-medium">
                      {reminder}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Division-Specific Rules */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-display text-lg font-bold uppercase tracking-wide text-charcoal">
                {DIVISIONS.find((d) => d.key === activeDivision)?.label} Rules
              </h2>
            </div>
            <div className="px-4 sm:px-6 py-5 space-y-4">
              {/* Division note */}
              <div className="bg-blue-50 border-l-4 border-flag-blue rounded-r-lg p-4">
                <p className="text-sm text-charcoal font-medium leading-relaxed">
                  {divisionConfig.note}
                </p>
              </div>

              {/* Applicable Rule Books */}
              <div>
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-charcoal mb-2">
                  Applicable Rule Books
                </h3>
                <ul className="space-y-2">
                  {divisionConfig.ruleBooks.map((book) => (
                    <li key={book.name}>
                      <a
                        href={book.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-flag-blue hover:text-flag-blue/80 hover:underline transition-colors"
                      >
                        <BookOpen size={14} className="shrink-0" />
                        <span className="flex-1">{book.name}</span>
                        <ExternalLink size={12} className="shrink-0 opacity-50" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Submit Message */}
          {submitMessage && (
            <div
              className={`rounded-2xl px-4 py-3 text-sm font-semibold flex items-center gap-2 ${
                submitMessage.type === "success"
                  ? "bg-green-50 border border-green-200 text-green-800"
                  : "bg-red-50 border border-red-200 text-red-800"
              }`}
            >
              {submitMessage.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              {submitMessage.text}
            </div>
          )}

          {/* Acknowledgment Section */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-display text-lg font-bold uppercase tracking-wide text-charcoal">
                Acknowledgment
              </h2>
            </div>
            <div className="px-4 sm:px-6 py-5">
              {existingAgreement ? (
                <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl p-4">
                  <CheckCircle2 className="text-green-600 shrink-0" size={24} />
                  <div>
                    <p className="text-green-800 font-semibold">
                      Acknowledged on{" "}
                      {new Date(
                        existingAgreement.acknowledged_at
                      ).toLocaleDateString()}
                    </p>
                    <p className="text-green-700 text-sm">
                      Signed by: {existingAgreement.coach_name}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Checkbox */}
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => setChecked(e.target.checked)}
                      className="mt-0.5 w-5 h-5 rounded border-gray-300 text-flag-blue focus:ring-flag-blue cursor-pointer"
                    />
                    <span className="text-sm text-charcoal leading-relaxed group-hover:text-flag-blue transition-colors">
                      I have read and understand the tournament rules for the{" "}
                      <strong>
                        {DIVISIONS.find((d) => d.key === activeDivision)?.label}
                      </strong>{" "}
                      division.
                    </span>
                  </label>

                  {/* Digital Signature */}
                  <div>
                    <label
                      htmlFor="coach-name"
                      className="block text-sm font-semibold text-charcoal font-display uppercase tracking-wide mb-1"
                    >
                      Type your full name as digital signature
                    </label>
                    <input
                      id="coach-name"
                      type="text"
                      value={coachName}
                      onChange={(e) => setCoachName(e.target.value)}
                      placeholder="e.g. John Smith"
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 sm:py-2.5 min-h-[44px] text-sm text-charcoal placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-flag-blue focus:border-transparent"
                    />
                  </div>

                  {/* Submit */}
                  <button
                    onClick={handleSubmit}
                    disabled={!checked || !coachName.trim() || submitting}
                    className="w-full sm:w-auto px-6 py-3 min-h-[44px] bg-flag-blue text-white font-display font-bold uppercase tracking-wider text-sm rounded-full hover:bg-flag-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Submitting..." : "Acknowledge Rules"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

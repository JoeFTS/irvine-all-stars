"use client";

import { FaqAccordion, FaqSection } from "@/components/faq-accordion";

const helpSections: FaqSection[] = [
  {
    title: "Getting Started",
    items: [
      {
        question: "Dashboard",
        answer: (
          <div className="space-y-3">
            <p>
              Your home base with compliance progress, action items, and
              announcements. Everything you need to stay on track is right here.
            </p>
            <div>
              <p className="font-semibold text-charcoal mb-1">How to use it:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Check the compliance progress bar to see where your team stands</li>
                <li>Review action items that need your attention</li>
                <li>Use quick links to jump to common tasks</li>
                <li>Scroll down for the latest announcements</li>
              </ol>
            </div>
            <p className="text-sm text-gray-500 italic">
              Good to know: Dashboard updates in real-time as parents upload
              documents.
            </p>
          </div>
        ),
      },
    ],
  },
  {
    title: "Tryouts & Evaluation",
    items: [
      {
        question: "Tryouts",
        answer: (
          <div className="space-y-3">
            <p>
              Scout players and submit nominations for your division. Review
              who&apos;s registered and pick the players you want on your team.
            </p>
            <div>
              <p className="font-semibold text-charcoal mb-1">How to use it:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>View all registered players for your division</li>
                <li>Review player details including age, experience, and position</li>
                <li>Submit your nominations before the deadline</li>
              </ol>
            </div>
          </div>
        ),
      },
      {
        question: "Enter Scores",
        answer: (
          <div className="space-y-3">
            <p>
              Score players using the 54-point rubric during tryout sessions.
              Each player is evaluated across six categories worth up to 9 points
              each.
            </p>
            <div>
              <p className="font-semibold text-charcoal mb-1">How to use it:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Select the tryout session you&apos;re evaluating</li>
                <li>Score each player on 6 categories (1–9 points each)</li>
                <li>Submit your scores when finished</li>
              </ol>
            </div>
            <p className="text-sm text-gray-500 italic">
              Good to know: Scores are locked after the tryout period ends.
            </p>
          </div>
        ),
      },
    ],
  },
  {
    title: "Team Management",
    items: [
      {
        question: "Binder Checklist",
        answer: (
          <div className="space-y-3">
            <p>
              Track required documents for your roster — birth certificates,
              photos, contracts, and certifications. This is your compliance
              command center.
            </p>
            <div>
              <p className="font-semibold text-charcoal mb-1">How to use it:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>View all players and their document status at a glance</li>
                <li>
                  Green = uploaded, Yellow = pending, Red = missing
                </li>
                <li>Click on any player to see detailed document info</li>
              </ol>
            </div>
            <p className="text-sm text-gray-500 italic">
              Good to know: Parents upload docs through their portal — you just
              track status.
            </p>
          </div>
        ),
      },
      {
        question: "Pitching Log",
        answer: (
          <div className="space-y-3">
            <p>
              Log pitch counts after every game to stay compliant with PONY
              rules. The system automatically calculates required rest days.
            </p>
            <div>
              <p className="font-semibold text-charcoal mb-1">How to use it:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>After each game, open the pitching log</li>
                <li>Select the date and pitcher</li>
                <li>Enter the pitch count</li>
                <li>The system calculates rest days automatically</li>
              </ol>
            </div>
            <p className="text-sm text-gray-500 italic">
              Good to know: Rules vary by division — the log shows your
              division&apos;s specific limits.
            </p>
          </div>
        ),
      },
      {
        question: "Roster",
        answer: (
          <div className="space-y-3">
            <p>
              View your complete team roster with player details and parent
              contact information.
            </p>
            <div>
              <p className="font-semibold text-charcoal mb-1">How to use it:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>View all players assigned to your team</li>
                <li>See age, position, and parent contact info for each player</li>
                <li>Use as a quick reference during games and practices</li>
              </ol>
            </div>
          </div>
        ),
      },
      {
        question: "Contracts",
        answer: (
          <div className="space-y-3">
            <p>
              Track player contract signatures. Every player needs a signed
              contract before they can compete.
            </p>
            <div>
              <p className="font-semibold text-charcoal mb-1">How to use it:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>View contract status for each player on your roster</li>
                <li>Green = signed — you&apos;re good to go</li>
                <li>Follow up with parents of unsigned players</li>
              </ol>
            </div>
          </div>
        ),
      },
    ],
  },
  {
    title: "Compliance & Rules",
    items: [
      {
        question: "Certifications",
        answer: (
          <div className="space-y-3">
            <p>
              Upload your concussion and cardiac arrest training certifications.
              Both are required before you can manage a team.
            </p>
            <div>
              <p className="font-semibold text-charcoal mb-1">How to use it:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Upload your concussion training certificate</li>
                <li>Upload your cardiac arrest training certificate</li>
                <li>Both must be current and valid</li>
              </ol>
            </div>
            <p className="text-sm text-gray-500 italic">
              Good to know: You cannot manage a team until both certs are
              uploaded and verified.
            </p>
          </div>
        ),
      },
      {
        question: "Tournament Rules",
        answer: (
          <div className="space-y-3">
            <p>
              Review and acknowledge the official tournament rules. This is
              required before your team can participate in any tournament.
            </p>
            <div>
              <p className="font-semibold text-charcoal mb-1">How to use it:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Read through the complete rules document</li>
                <li>Click &quot;Acknowledge&quot; at the bottom when finished</li>
                <li>Required before tournament participation</li>
              </ol>
            </div>
          </div>
        ),
      },
    ],
  },
  {
    title: "Tournaments & Updates",
    items: [
      {
        question: "Tournaments",
        answer: (
          <div className="space-y-3">
            <p>
              View the tournament schedule, locations, registration links, and
              flyers. Everything you need to get your team signed up and ready.
            </p>
            <div>
              <p className="font-semibold text-charcoal mb-1">How to use it:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Browse tournaments by month</li>
                <li>Click on a tournament for full details</li>
                <li>Use the registration link to sign up your team</li>
                <li>Click any flyer to view it full-size</li>
              </ol>
            </div>
          </div>
        ),
      },
      {
        question: "Updates",
        answer: (
          <div className="space-y-3">
            <p>
              Stay informed with the latest announcements from the league admin.
              Don&apos;t miss important deadlines or changes.
            </p>
            <div>
              <p className="font-semibold text-charcoal mb-1">How to use it:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Announcements are shown newest first</li>
                <li>Look for both general and division-specific updates</li>
                <li>Check regularly so you don&apos;t miss anything</li>
              </ol>
            </div>
          </div>
        ),
      },
    ],
  },
];

export default function CoachHelpPage() {
  return (
    <div className="p-6 md:p-10 max-w-3xl">
      <p className="text-flag-red font-display text-sm font-semibold uppercase tracking-[3px] mb-1">
        Coach
      </p>
      <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide mb-8">
        Help & Guides
      </h1>
      <FaqAccordion sections={helpSections} />
    </div>
  );
}

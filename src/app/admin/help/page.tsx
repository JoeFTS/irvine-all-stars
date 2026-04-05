"use client";

import { FaqAccordion, FaqSection } from "@/components/faq-accordion";

const helpSections: FaqSection[] = [
  {
    title: "Overview",
    items: [
      {
        question: "Dashboard",
        answer: (
          <div className="space-y-3">
            <p>
              Overview stats at a glance: coach applications count, player
              registrations, division breakdown, and recent activity. Your
              command center for managing the league.
            </p>
            <div>
              <p className="font-semibold text-charcoal mb-1">How to use it:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Review stat cards at the top for a quick pulse check</li>
                <li>Click into sections that need attention</li>
                <li>Check the recent applications list for new submissions</li>
              </ol>
            </div>
            <p className="text-sm text-gray-500 italic">
              Good to know: Numbers update in real-time as new applications and
              registrations come in.
            </p>
          </div>
        ),
      },
    ],
  },
  {
    title: "People",
    items: [
      {
        question: "Coach Applications",
        answer: (
          <div className="space-y-3">
            <p>
              Review, approve, or decline coach applications. Every application
              lands here first so you can vet coaches before granting access.
            </p>
            <div>
              <p className="font-semibold text-charcoal mb-1">How to use it:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>View pending applications at the top of the list</li>
                <li>Click on an application to read full details</li>
                <li>Approve or decline with optional notes</li>
              </ol>
            </div>
          </div>
        ),
      },
      {
        question: "Invites",
        answer: (
          <div className="space-y-3">
            <p>
              Send invite links to coaches and parents via email. Invites grant
              access to the appropriate portal based on the selected role.
            </p>
            <div>
              <p className="font-semibold text-charcoal mb-1">How to use it:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Enter the recipient&apos;s email address</li>
                <li>Select the role (coach or parent)</li>
                <li>Click send to deliver the invite</li>
                <li>Track who has accepted their invite</li>
              </ol>
            </div>
            <p className="text-sm text-gray-500 italic">
              Good to know: Invite links expire after 7 days — resend if needed.
            </p>
          </div>
        ),
      },
    ],
  },
  {
    title: "Tryouts & Scores",
    items: [
      {
        question: "Scores",
        answer: (
          <div className="space-y-3">
            <p>
              View tryout evaluation scores across all players and divisions.
              Use this to compare players and inform draft decisions.
            </p>
            <div>
              <p className="font-semibold text-charcoal mb-1">How to use it:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Select a division to filter results</li>
                <li>View scores sorted by total</li>
                <li>Compare players side by side</li>
              </ol>
            </div>
          </div>
        ),
      },
      {
        question: "Tryouts",
        answer: (
          <div className="space-y-3">
            <p>
              Manage tryout registrations, player selections, and coach
              recommendations. This is where you finalize rosters after
              evaluations are complete.
            </p>
            <div>
              <p className="font-semibold text-charcoal mb-1">How to use it:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>View registered players by division</li>
                <li>Review evaluator scores and coach recommendations</li>
                <li>Make final player selections</li>
                <li>Notify families of results</li>
              </ol>
            </div>
          </div>
        ),
      },
    ],
  },
  {
    title: "Content & Communication",
    items: [
      {
        question: "Announcements",
        answer: (
          <div className="space-y-3">
            <p>
              Create and post announcements to coaches and parents. Keep
              everyone informed about schedules, deadlines, and league updates.
            </p>
            <div>
              <p className="font-semibold text-charcoal mb-1">How to use it:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Write a title and body for your announcement</li>
                <li>Optionally select a division, or leave blank for all</li>
                <li>Click Post to publish</li>
              </ol>
            </div>
            <p className="text-sm text-gray-500 italic">
              Good to know: Division-specific announcements only show to coaches
              and parents in that division.
            </p>
          </div>
        ),
      },
      {
        question: "Documents",
        answer: (
          <div className="space-y-3">
            <p>
              Manage policies and public-facing documents. Control what coaches
              and parents can see on the site.
            </p>
            <div>
              <p className="font-semibold text-charcoal mb-1">How to use it:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>View existing documents</li>
                <li>Edit content as needed</li>
                <li>Toggle visibility on the public site</li>
              </ol>
            </div>
          </div>
        ),
      },
    ],
  },
  {
    title: "Tournaments & Teams",
    items: [
      {
        question: "Tournaments",
        answer: (
          <div className="space-y-3">
            <p>
              Add tournaments, upload flyers, and publish to the coach and
              parent portals. Manage the full tournament lifecycle from draft to
              published.
            </p>
            <div>
              <p className="font-semibold text-charcoal mb-1">How to use it:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Click Add Tournament</li>
                <li>Fill in name, dates, location, and divisions</li>
                <li>Upload a flyer image</li>
                <li>Save as draft, then publish when ready</li>
              </ol>
            </div>
            <p className="text-sm text-gray-500 italic">
              Good to know: Publishing a tournament with auto-announce enabled
              creates an announcement automatically.
            </p>
          </div>
        ),
      },
      {
        question: "Teams",
        answer: (
          <div className="space-y-3">
            <p>
              Assign selected players to their teams after tryouts. Build your
              division rosters from the player pool.
            </p>
            <div>
              <p className="font-semibold text-charcoal mb-1">How to use it:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Select a division</li>
                <li>Assign players to team slots</li>
                <li>Save assignments</li>
              </ol>
            </div>
          </div>
        ),
      },
    ],
  },
  {
    title: "Compliance",
    items: [
      {
        question: "Compliance",
        answer: (
          <div className="space-y-3">
            <p>
              Track compliance requirements across all teams and coaches. Make
              sure every team is tournament-ready with all certifications and
              documents in order.
            </p>
            <div>
              <p className="font-semibold text-charcoal mb-1">How to use it:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>View the compliance dashboard for an overview</li>
                <li>Check which coaches are missing certifications or documents</li>
                <li>Follow up as needed to close gaps</li>
              </ol>
            </div>
          </div>
        ),
      },
    ],
  },
];

export default function AdminHelpPage() {
  return (
    <div className="p-6 md:p-10 max-w-3xl">
      <p className="text-flag-red font-display text-sm font-semibold uppercase tracking-[3px] mb-1">
        Admin
      </p>
      <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide mb-8">
        Help & Guides
      </h1>
      <FaqAccordion sections={helpSections} />
    </div>
  );
}

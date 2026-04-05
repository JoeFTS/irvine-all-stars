"use client";

import { FaqAccordion, FaqSection } from "@/components/faq-accordion";

const helpSections: FaqSection[] = [
  {
    title: "Your Player",
    items: [
      {
        question: "Dashboard",
        answer: (
          <div className="space-y-3">
            <p>
              Your player&apos;s registration status, tryout details, upcoming
              dates, and division announcements.
            </p>
            <div>
              <p className="font-semibold text-charcoal mb-1">How to use it:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Check registration status at top</li>
                <li>
                  View tryout session details (date/time/location/field)
                </li>
                <li>See document upload status</li>
                <li>Scroll for announcements</li>
              </ol>
            </div>
            <p className="text-sm text-gray-500 italic">
              Good to know: Your dashboard shows information specific to the
              division your player registered for.
            </p>
          </div>
        ),
      },
      {
        question: "Confirm",
        answer: (
          <div className="space-y-3">
            <p>
              Confirm your player&apos;s selection after being chosen for the
              All-Stars team.
            </p>
            <div>
              <p className="font-semibold text-charcoal mb-1">How to use it:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>
                  Review the selection details and division assignment
                </li>
                <li>
                  Confirm your family&apos;s availability and commitment
                </li>
                <li>Submit your confirmation</li>
              </ol>
            </div>
            <p className="text-sm text-gray-500 italic">
              Good to know: You must confirm within the deadline or the spot may
              be offered to an alternate.
            </p>
          </div>
        ),
      },
    ],
  },
  {
    title: "Documents & Forms",
    items: [
      {
        question: "Documents",
        answer: (
          <div className="space-y-3">
            <p>
              Download and review required policies, handbooks, and forms.
            </p>
            <div>
              <p className="font-semibold text-charcoal mb-1">How to use it:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>View the document list</li>
                <li>Click any document to read or download</li>
                <li>
                  Check which documents are required for your player
                </li>
              </ol>
            </div>
          </div>
        ),
      },
      {
        question: "Contract",
        answer: (
          <div className="space-y-3">
            <p>
              View and electronically sign your player&apos;s participation
              contract.
            </p>
            <div>
              <p className="font-semibold text-charcoal mb-1">How to use it:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Read the full contract carefully</li>
                <li>Scroll to the signature section</li>
                <li>Sign electronically and submit</li>
              </ol>
            </div>
            <p className="text-sm text-gray-500 italic">
              Good to know: The contract must be signed before your player can
              participate in practices or games.
            </p>
          </div>
        ),
      },
      {
        question: "Medical Release",
        answer: (
          <div className="space-y-3">
            <p>
              Submit your player&apos;s medical information and release form.
            </p>
            <div>
              <p className="font-semibold text-charcoal mb-1">How to use it:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Fill in your player&apos;s medical information</li>
                <li>List any allergies or conditions</li>
                <li>Sign the release and submit</li>
              </ol>
            </div>
            <p className="text-sm text-gray-500 italic">
              Good to know: Medical releases are required for player safety —
              keep this information up to date.
            </p>
          </div>
        ),
      },
      {
        question: "Tournaments",
        answer: (
          <div className="space-y-3">
            <p>
              View the tournament schedule for your player&apos;s division.
            </p>
            <div>
              <p className="font-semibold text-charcoal mb-1">How to use it:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Browse upcoming tournaments grouped by month</li>
                <li>View dates/locations/details</li>
                <li>Click flyer images for full-size view</li>
                <li>Use registration links if available</li>
              </ol>
            </div>
          </div>
        ),
      },
    ],
  },
];

export default function ParentHelpPage() {
  return (
    <div className="p-6 md:p-10 max-w-3xl">
      <p className="text-flag-red font-display text-sm font-semibold uppercase tracking-[3px] mb-1">
        Parent Portal
      </p>
      <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide mb-8">
        Help & Guides
      </h1>
      <FaqAccordion sections={helpSections} />
    </div>
  );
}

import type { Metadata } from "next";
import { FileText, Download } from "lucide-react";
import { StripeDivider } from "@/components/stripe-divider";

export const metadata: Metadata = {
  title: "Documents & Downloads",
  description:
    "Download All-Stars policies, forms, and rubrics. Coach selection, player tryout evaluation, and general documents for Irvine Pony Baseball All-Stars.",
};

const coachDocuments = [
  {
    title: "Coach Selection Policy",
    description: "Board-approved policy outlining the coach selection process, criteria, and timeline.",
  },
  {
    title: "Coach Application Form",
    description: "Printable application form for prospective All-Stars head coaches and assistants.",
  },
  {
    title: "Coach Scoring Rubric",
    description: "100-point evaluation criteria used by the selection committee to score coach applicants.",
  },
  {
    title: "Interview Question Pack",
    description: "Standardized interview questions asked of all coach candidates for consistency and fairness.",
  },
];

const playerDocuments = [
  {
    title: "Player Selection Policy",
    description: "Board-approved policy governing how All-Stars rosters are built across all ten divisions.",
  },
  {
    title: "Parent Information Packet",
    description: "Everything families need to know about tryouts, commitment expectations, and the summer schedule.",
  },
  {
    title: "Tryout Evaluation Rubric",
    description: "100-point scoring breakdown covering hitting, fielding, throwing, speed, and baseball IQ.",
  },
  {
    title: "Player Commitment Form",
    description: "Availability declaration and expectations agreement required before tryout registration.",
  },
];

const generalDocuments = [
  {
    title: "Code of Conduct",
    description: "Behavioral expectations for coaches, players, and parents throughout the All-Stars season.",
  },
  {
    title: "Background Check Information",
    description: "Requirements, process, and timeline for mandatory coaching staff background checks.",
  },
  {
    title: "Season Calendar",
    description: "Full timeline of All-Stars events from applications through tournaments.",
  },
];

function DocumentCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200 flex flex-col sm:flex-row sm:items-center gap-4 hover:-translate-y-0.5 hover:shadow-md transition-all">
      <div className="w-12 h-12 rounded-lg bg-flag-blue/10 flex items-center justify-center shrink-0">
        <FileText className="w-6 h-6 text-flag-blue" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-display text-lg font-semibold uppercase tracking-wide mb-1">
          {title}
        </h3>
        <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
      </div>
      <button
        className="inline-flex items-center gap-2 bg-flag-blue hover:bg-flag-blue/90 text-white px-5 py-2.5 rounded font-display text-xs font-semibold uppercase tracking-widest transition-colors shrink-0 cursor-not-allowed opacity-60"
        disabled
        title="Document coming soon"
      >
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">Download</span>
        <span className="sm:hidden">PDF</span>
      </button>
    </div>
  );
}

function DocumentSection({
  label,
  title,
  documents,
}: {
  label: string;
  title: string;
  documents: { title: string; description: string }[];
}) {
  return (
    <div className="mb-14 last:mb-0">
      <p className="font-display text-sm font-semibold text-flag-red uppercase tracking-[3px] mb-2">
        &#9733; {label}
      </p>
      <h2 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide mb-3">
        {title}
      </h2>
      <div className="grid grid-cols-1 gap-4 mt-8">
        {documents.map((doc) => (
          <DocumentCard key={doc.title} title={doc.title} description={doc.description} />
        ))}
      </div>
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-flag-blue pt-[98px] pb-14 px-6 md:px-10">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-star-gold-bright font-display text-sm font-semibold uppercase tracking-[3px] mb-4">
            &#9733; Resources
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white uppercase tracking-wide mb-4">
            Documents & Downloads
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto leading-relaxed">
            All the policies, forms, and rubrics you need for the All-Stars
            season. Download, print, and stay informed.
          </p>
        </div>
      </section>

      <StripeDivider />

      {/* Coach Selection Documents */}
      <section className="bg-off-white py-16 px-6 md:px-10">
        <div className="max-w-4xl mx-auto">
          <DocumentSection
            label="Coach Selection"
            title="Coach Documents"
            documents={coachDocuments}
          />
        </div>
      </section>

      {/* Player Selection Documents */}
      <section className="bg-cream py-16 px-6 md:px-10">
        <div className="max-w-4xl mx-auto">
          <DocumentSection
            label="Player Selection"
            title="Player & Tryout Documents"
            documents={playerDocuments}
          />
        </div>
      </section>

      {/* General Documents */}
      <section className="bg-off-white py-16 px-6 md:px-10">
        <div className="max-w-4xl mx-auto">
          <DocumentSection
            label="General"
            title="Policies & Calendars"
            documents={generalDocuments}
          />
        </div>
      </section>

      <StripeDivider />

      {/* Note */}
      <section className="bg-flag-blue py-12 px-6 md:px-10 text-center">
        <div className="max-w-2xl mx-auto">
          <p className="text-white/80 text-sm leading-relaxed">
            Documents are being finalized and will be available for download
            soon. Check back regularly or follow the{" "}
            <a href="/updates" className="text-star-gold-bright hover:underline">
              Updates
            </a>{" "}
            page for announcements.
          </p>
        </div>
      </section>
    </>
  );
}

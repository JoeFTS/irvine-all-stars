import type { Metadata } from "next";
import Link from "next/link";
import {
  FileText,
  ClipboardList,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { StripeDivider } from "@/components/stripe-divider";
import { documents } from "@/content/documents";

export const metadata: Metadata = {
  title: "Documents & Resources",
  description:
    "Policies, rubrics, and important information for Irvine Pony Baseball All-Stars parents, coaches, and volunteers.",
  openGraph: {
    title: "Documents & Resources",
    description:
      "Policies, rubrics, and important information for Irvine Pony Baseball All-Stars.",
  },
};

const iconMap: Record<string, React.ReactNode> = {
  "parent-info": <FileText className="w-6 h-6 text-flag-blue" />,
  "evaluation-rubric": <ClipboardList className="w-6 h-6 text-flag-blue" />,
  "code-of-conduct": <ShieldCheck className="w-6 h-6 text-flag-blue" />,
  "background-checks": <ShieldAlert className="w-6 h-6 text-flag-blue" />,
  "season-calendar": <Calendar className="w-6 h-6 text-flag-blue" />,
};

function DocumentCard({ slug, title, description }: { slug: string; title: string; description: string }) {
  return (
    <Link
      href={`/documents/${slug}`}
      className="group bg-white rounded-2xl p-6 border border-gray-200 flex flex-col sm:flex-row sm:items-center gap-4 hover:-translate-y-0.5 hover:shadow-md transition-all"
    >
      <div className="w-12 h-12 rounded-2xl bg-flag-blue/10 flex items-center justify-center shrink-0">
        {iconMap[slug] || <FileText className="w-6 h-6 text-flag-blue" />}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-display text-lg font-semibold uppercase tracking-wide mb-1 group-hover:text-flag-blue transition-colors">
          {title}
        </h3>
        <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
      </div>
      <span className="inline-flex items-center gap-1.5 text-flag-blue font-display text-xs font-semibold uppercase tracking-widest shrink-0 group-hover:gap-2.5 transition-all">
        View <ArrowRight className="w-4 h-4" />
      </span>
    </Link>
  );
}

const parentDocs = documents.filter(
  (d) => d.category === "parents" || d.slug === "code-of-conduct"
);
const coachDocs = documents.filter(
  (d) => d.category === "coaches" || d.slug === "code-of-conduct"
);

export default function DocumentsPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-flag-blue pt-16 pb-14 px-6 md:px-10">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-star-gold-bright font-display text-sm font-semibold uppercase tracking-[3px] mb-4">
            &#9733; Resources
          </p>
          <h1 className="font-hero text-4xl md:text-5xl font-bold text-white uppercase tracking-wide mb-4">
            Documents & Resources
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto leading-relaxed">
            Policies, evaluation rubrics, and important information for the
            All-Stars season. Click any document to view the full details.
          </p>
        </div>
      </section>

      <StripeDivider />

      {/* For Parents */}
      <section className="bg-off-white py-16 px-6 md:px-10">
        <div className="max-w-4xl mx-auto">
          <p className="font-display text-sm font-semibold text-flag-red uppercase tracking-[3px] mb-2">
            &#9733; For Parents
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide mb-3">
            Parent & Player Documents
          </h2>
          <p className="text-gray-600 leading-relaxed mb-8">
            Everything families need to know about tryouts, expectations, and
            the season ahead.
          </p>
          <div className="grid grid-cols-1 gap-4">
            {parentDocs.map((doc) => (
              <DocumentCard
                key={doc.slug}
                slug={doc.slug}
                title={doc.title}
                description={doc.description}
              />
            ))}
          </div>
        </div>
      </section>

      <div className="baseball-stitch relative py-4" />

      {/* For Coaches & Volunteers */}
      <section className="bg-cream py-16 px-6 md:px-10">
        <div className="max-w-4xl mx-auto">
          <p className="font-display text-sm font-semibold text-flag-red uppercase tracking-[3px] mb-2">
            &#9733; For Coaches & Volunteers
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide mb-3">
            Coach & Volunteer Documents
          </h2>
          <p className="text-gray-600 leading-relaxed mb-8">
            Background check requirements, conduct policies, and other
            information for coaching staff.
          </p>
          <div className="grid grid-cols-1 gap-4">
            {coachDocs.map((doc) => (
              <DocumentCard
                key={`coach-${doc.slug}`}
                slug={doc.slug}
                title={doc.title}
                description={doc.description}
              />
            ))}
          </div>
        </div>
      </section>

      <StripeDivider />

      {/* CTA */}
      <section className="bg-flag-blue py-12 px-6 md:px-10 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-white uppercase tracking-wide mb-3">
            Questions?
          </h2>
          <p className="text-white/60 mb-6 leading-relaxed">
            If you need clarification on any policy or document, reach out to
            the All-Stars coordinator.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <a
              href="mailto:allstars@irvinepony.com"
              className="bg-flag-red hover:bg-flag-red-dark text-white px-7 py-3 rounded-full font-display text-sm font-semibold uppercase tracking-widest transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              Email the Coordinator
            </a>
            <a
              href="/faq"
              className="bg-white hover:bg-cream text-flag-blue px-7 py-3 rounded-full font-display text-sm font-semibold uppercase tracking-widest transition-all hover:-translate-y-0.5"
            >
              View FAQ
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

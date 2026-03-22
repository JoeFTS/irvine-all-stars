import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import { StripeDivider } from "@/components/stripe-divider";
import { documents, getDocumentBySlug } from "@/content/documents";
import { PrintButton } from "./print-button";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return documents.map((doc) => ({ slug: doc.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const doc = getDocumentBySlug(slug);
  if (!doc) return {};

  return {
    title: doc.title,
    description: doc.description,
    openGraph: {
      title: doc.title,
      description: doc.description,
    },
  };
}

export default async function DocumentDetailPage({ params }: Props) {
  const { slug } = await params;
  const doc = getDocumentBySlug(slug);

  if (!doc) {
    notFound();
  }

  return (
    <>
      {/* Hero */}
      <section className="bg-flag-blue pt-[98px] pb-14 px-6 md:px-10">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-star-gold-bright font-display text-sm font-semibold uppercase tracking-[3px] mb-4">
            &#9733; Document
          </p>
          <h1 className="font-display text-3xl md:text-5xl font-bold text-white uppercase tracking-wide mb-4">
            {doc.title}
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto leading-relaxed">
            {doc.description}
          </p>
        </div>
      </section>

      <StripeDivider />

      {/* Document Content */}
      <section className="bg-off-white py-16 px-6 md:px-10 print:py-8 print:px-4">
        <div className="max-w-3xl mx-auto">
          {/* Print & Back controls */}
          <div className="flex items-center justify-between mb-10 no-print">
            <Link
              href="/documents"
              className="inline-flex items-center gap-2 text-flag-blue hover:text-flag-red font-display text-sm font-semibold uppercase tracking-widest transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Documents
            </Link>
            <PrintButton />
          </div>

          {/* Sections */}
          <div className="space-y-10">
            {doc.sections.map((section, i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 md:p-8 print:border-0 print:p-0 print:shadow-none">
                <h2 className="font-display text-xl md:text-2xl font-bold uppercase tracking-wide text-flag-blue mb-4">
                  {section.heading}
                </h2>
                <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {section.content}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom nav */}
          <div className="mt-12 flex items-center justify-between no-print">
            <Link
              href="/documents"
              className="inline-flex items-center gap-2 text-flag-blue hover:text-flag-red font-display text-sm font-semibold uppercase tracking-widest transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Documents
            </Link>
            <PrintButton />
          </div>
        </div>
      </section>

      <StripeDivider />

      {/* Footer CTA */}
      <section className="bg-flag-blue py-12 px-6 md:px-10 text-center no-print">
        <div className="max-w-2xl mx-auto">
          <p className="text-white/60 text-sm leading-relaxed">
            Questions about this document? Contact the All-Stars coordinator at{" "}
            <a
              href="mailto:allstars@irvinepony.com"
              className="text-star-gold-bright hover:underline"
            >
              allstars@irvinepony.com
            </a>
          </p>
        </div>
      </section>

      {/* Print styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              .no-print { display: none !important; }
              nav, aside, footer, header { display: none !important; }
              body { background: white !important; margin: 0; padding: 0; }
              * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              @page { margin: 0.75in; }
            }
          `,
        }}
      />
    </>
  );
}

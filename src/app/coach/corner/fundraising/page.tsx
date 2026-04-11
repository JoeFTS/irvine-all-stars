"use client";

import {
  DollarSign,
  Download,
  Target,
  Trophy,
  Handshake,
  Megaphone,
  Ticket,
  PartyPopper,
  CheckCircle2,
  Info,
} from "lucide-react";
import { fundraisingIdeas, type EffortLevel } from "@/content/fundraising-ideas";

const iconBySlug: Record<string, typeof DollarSign> = {
  "hit-a-thon": Target,
  "home-run-derby": Trophy,
  "sponsor-a-banner": Handshake,
  crowdfunding: Megaphone,
  "team-raffle": Ticket,
  "pie-the-coach": PartyPopper,
};

const effortClasses: Record<EffortLevel, string> = {
  Low: "bg-green-400/20 text-green-300 border-green-400/30",
  "Low-Medium": "bg-lime-400/20 text-lime-300 border-lime-400/30",
  Medium: "bg-star-gold-bright/20 text-star-gold-bright border-star-gold-bright/30",
  High: "bg-flag-red/20 text-flag-red border-flag-red/40",
};

export default function CornerFundraisingPage() {
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
            <DollarSign size={28} />
          </div>
          <div>
            <p className="font-display text-xs font-semibold text-star-gold-bright uppercase tracking-[3px] mb-1">
              &#9733; Coach&apos;s Corner
            </p>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-white uppercase tracking-wide leading-tight">
              Fundraising
            </h1>
            <p className="text-white/70 text-sm mt-1">
              Six proven ways to raise money for your team&apos;s season.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 flex items-start gap-4">
        <div className="bg-flag-blue/10 text-flag-blue p-2.5 rounded-lg shrink-0">
          <Info size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display text-xs font-bold uppercase tracking-[2px] text-flag-red mb-1">
            How to use these playbooks
          </p>
          <p className="text-sm text-charcoal leading-relaxed">
            Pick one or two fundraisers that fit your team&apos;s size and
            energy. Each card shows the quick steps. Download the full printable
            playbook PDF for a one-pager you can toss in your binder with
            scripts, timelines, and tips.
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {fundraisingIdeas.map((idea, index) => {
          const Icon = iconBySlug[idea.slug] ?? DollarSign;
          return (
            <article
              key={idea.slug}
              className="group relative overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-xl hover:shadow-flag-blue/10 transition-all duration-300"
            >
              {/* Navy header strip */}
              <div className="relative overflow-hidden bg-flag-blue p-5 sm:p-6">
                <div
                  aria-hidden
                  className="absolute inset-0 text-white/[0.05] text-lg leading-[2.4rem] tracking-widest overflow-hidden pointer-events-none p-2"
                >
                  {"\u2605 ".repeat(80)}
                </div>
                <div
                  aria-hidden
                  className="absolute top-0 left-0 w-20 h-1 bg-flag-red"
                />
                <div
                  aria-hidden
                  className="absolute top-0 left-0 w-1 h-20 bg-flag-red"
                />
                <div className="relative z-10 flex items-start gap-4">
                  <div className="bg-white/10 text-star-gold-bright p-3 rounded-xl shrink-0 border border-white/10 backdrop-blur-sm">
                    <Icon size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-flex items-center justify-center shrink-0 w-6 h-6 rounded-full bg-star-gold-bright text-flag-blue text-xs font-display font-bold">
                        {index + 1}
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-display font-semibold uppercase tracking-[1.5px] border ${effortClasses[idea.effort]}`}
                      >
                        {idea.effort} Effort
                      </span>
                    </div>
                    <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide text-white leading-tight">
                      {idea.name}
                    </h2>
                    <p className="text-star-gold-bright text-sm italic mt-1">
                      {idea.tagline}
                    </p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 sm:p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <StatChip label="Typical Yield" value={idea.typicalYield} />
                  <StatChip label="Timeline" value={idea.timeline} />
                  <StatChip label="People" value={idea.people} />
                </div>

                <p className="text-sm text-charcoal leading-relaxed">
                  {idea.description}
                </p>

                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                  <p className="font-display text-[11px] font-semibold uppercase tracking-[2px] text-flag-red mb-3">
                    &#9733; Quick Steps
                  </p>
                  <ul className="space-y-2">
                    {idea.quickSteps.map((step, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 text-sm text-charcoal"
                      >
                        <CheckCircle2
                          size={16}
                          className="text-flag-blue shrink-0 mt-0.5"
                        />
                        <span className="leading-snug">{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Footer CTA bar */}
              <div className="relative border-t border-gray-100 bg-gradient-to-r from-off-white to-gray-50 p-4 sm:px-6 sm:py-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="font-display text-[11px] font-semibold uppercase tracking-[2px] text-flag-blue mb-0.5">
                      Full Printable Playbook
                    </p>
                    <p className="text-xs text-gray-500">
                      Complete 8-12 step playbook with scripts, timelines, and
                      tips.
                    </p>
                  </div>
                  <PremiumDownloadButton
                    href={`/fundraising/${idea.slug}-playbook.pdf`}
                    filename={`${idea.slug}-playbook.pdf`}
                  />
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 sm:p-6 text-center">
        <p className="text-xs text-gray-500 leading-relaxed">
          All fundraising activity must be coordinated with your division
          coordinator and comply with Irvine PONY&apos;s fundraising policies.
          Contact{" "}
          <a
            href="mailto:AllStars@irvinepony.com"
            className="text-flag-blue hover:text-flag-red font-semibold"
          >
            AllStars@irvinepony.com
          </a>{" "}
          with questions.
        </p>
      </div>
    </>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-flag-blue/[0.03] border border-flag-blue/10 rounded-xl p-3">
      <p className="font-display text-[10px] font-semibold uppercase tracking-[2px] text-flag-red mb-0.5">
        {label}
      </p>
      <p className="text-xs text-charcoal leading-snug">{value}</p>
    </div>
  );
}

function PremiumDownloadButton({
  href,
  filename,
}: {
  href: string;
  filename: string;
}) {
  return (
    <a
      href={href}
      download={filename}
      className="relative inline-flex items-center gap-2.5 bg-flag-red text-white px-7 py-3.5 rounded-full font-display text-sm font-semibold uppercase tracking-[1.5px] transition-all hover:bg-flag-red-dark hover:-translate-y-0.5 hover:shadow-lg hover:shadow-flag-red/30 active:scale-[0.97] min-h-[48px] shrink-0 group/btn overflow-hidden"
    >
      {/* Gold top highlight line */}
      <span
        aria-hidden
        className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-star-gold-bright transition-all duration-300 group-hover/btn:w-2/3"
      />
      <Download size={16} className="relative" />
      <span className="relative">Download Playbook</span>
    </a>
  );
}

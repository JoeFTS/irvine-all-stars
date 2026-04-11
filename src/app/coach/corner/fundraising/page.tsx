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
  Low: "bg-green-50 text-green-700 border-green-200",
  "Low-Medium": "bg-lime-50 text-lime-700 border-lime-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  High: "bg-flag-red/10 text-flag-red border-flag-red/30",
};

export default function CornerFundraisingPage() {
  return (
    <>
      <div className="flex items-center gap-4">
        <div className="bg-flag-red/10 text-flag-red p-3 rounded-2xl">
          <DollarSign size={28} />
        </div>
        <div>
          <p className="font-display text-sm font-semibold text-flag-red uppercase tracking-[3px]">
            Coach&apos;s Corner
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide">
            Fundraising
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Six proven ways to raise money for your team&apos;s season.
          </p>
        </div>
      </div>

      <div className="bg-flag-blue/5 border border-flag-blue/15 rounded-2xl p-5 sm:p-6 flex items-start gap-4">
        <div className="bg-flag-blue/10 text-flag-blue p-2.5 rounded-lg shrink-0">
          <Info size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display text-sm font-bold uppercase tracking-wide text-flag-blue mb-1">
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
              className="bg-white border border-gray-200 rounded-2xl overflow-hidden"
            >
              <div className="p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-flag-red/10 text-flag-red p-3 rounded-xl shrink-0">
                    <Icon size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="inline-flex items-center justify-center shrink-0 w-5 h-5 rounded-full bg-flag-blue text-white text-[10px] font-bold">
                        {index + 1}
                      </span>
                      <h2 className="font-display text-xl md:text-2xl font-bold uppercase tracking-wide text-charcoal">
                        {idea.name}
                      </h2>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border ${effortClasses[idea.effort]}`}
                      >
                        {idea.effort} Effort
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 italic mb-3">
                      {idea.tagline}
                    </p>
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs mb-4">
                      <span>
                        <span className="font-display font-semibold uppercase tracking-wider text-flag-red">
                          Yield:
                        </span>{" "}
                        <span className="text-charcoal">
                          {idea.typicalYield}
                        </span>
                      </span>
                      <span>
                        <span className="font-display font-semibold uppercase tracking-wider text-flag-red">
                          Timeline:
                        </span>{" "}
                        <span className="text-charcoal">{idea.timeline}</span>
                      </span>
                      <span>
                        <span className="font-display font-semibold uppercase tracking-wider text-flag-red">
                          People:
                        </span>{" "}
                        <span className="text-charcoal">{idea.people}</span>
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed mb-4">
                      {idea.description}
                    </p>
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                      <p className="font-display text-[11px] font-semibold uppercase tracking-[1.5px] text-flag-blue mb-2">
                        Quick Steps
                      </p>
                      <ul className="space-y-1.5">
                        {idea.quickSteps.map((step, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-sm text-charcoal"
                          >
                            <CheckCircle2
                              size={14}
                              className="text-flag-blue shrink-0 mt-0.5"
                            />
                            <span className="leading-snug">{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-100 p-4 sm:px-6 sm:py-4 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs text-gray-500">
                  Complete 8-12 step playbook with scripts, timelines, and tips.
                </p>
                <a
                  href={`/fundraising/${idea.slug}-playbook.pdf`}
                  download={`${idea.slug}-playbook.pdf`}
                  className="inline-flex items-center gap-2 bg-flag-red hover:bg-flag-red-dark text-white px-5 py-2.5 rounded-full font-display text-xs font-semibold uppercase tracking-widest transition-colors min-h-[44px]"
                >
                  <Download size={14} />
                  Download Full Playbook
                </a>
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

"use client";

import { DollarSign } from "lucide-react";

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

      <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
        <DollarSign size={32} className="text-gray-300 mx-auto mb-3" />
        <p className="font-display text-lg font-bold uppercase tracking-wide text-gray-500 mb-1">
          Fundraising playbooks coming soon
        </p>
        <p className="text-gray-400 text-sm max-w-md mx-auto">
          Hit-a-Thon, Home Run Derby Night, Sponsor-a-Banner, Online
          Crowdfunding, Team Raffle, and Pie-the-Coach — each with a downloadable
          printable playbook.
        </p>
      </div>
    </>
  );
}

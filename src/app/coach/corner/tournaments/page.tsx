"use client";

import { Trophy } from "lucide-react";

export default function CornerTournamentsPage() {
  return (
    <>
      <div className="flex items-center gap-4">
        <div className="bg-flag-blue/10 text-flag-blue p-3 rounded-2xl">
          <Trophy size={28} />
        </div>
        <div>
          <p className="font-display text-sm font-semibold text-flag-red uppercase tracking-[3px]">
            Coach&apos;s Corner
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide">
            Tournaments
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Everything you need to prep for tournament play.
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
        <Trophy size={32} className="text-gray-300 mx-auto mb-3" />
        <p className="font-display text-lg font-bold uppercase tracking-wide text-gray-500 mb-1">
          Tournament resources coming soon
        </p>
        <p className="text-gray-400 text-sm max-w-md mx-auto">
          Division rules, the MDT schedule, entry forms, hotel blocks, and the
          upcoming tournament list will land here shortly.
        </p>
      </div>
    </>
  );
}

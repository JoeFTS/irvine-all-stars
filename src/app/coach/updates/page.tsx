"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Calendar, Shirt, AlertTriangle, Info } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Announcement {
  id: string;
  title: string;
  body: string;
  division: string | null;
  created_at: string;
}

export default function CoachUpdatesPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);

  useEffect(() => {
    async function fetchAnnouncements() {
      if (!supabase) {
        setLoadingAnnouncements(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("announcements")
          .select("id, title, body, division, created_at")
          .order("created_at", { ascending: false });

        if (!error && data) {
          setAnnouncements(data);
        }
      } catch {
        // silently fail
      } finally {
        setLoadingAnnouncements(false);
      }
    }
    fetchAnnouncements();
  }, []);

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl">
      {/* Header */}
      <p className="font-display text-sm font-semibold text-flag-red uppercase tracking-[3px] mb-1">
        Coach
      </p>
      <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide mb-2">
        Tournament Updates
      </h1>
      <p className="text-gray-600 mb-8">
        Important information, schedules, and announcements for the tournament season.
      </p>

      <div className="space-y-6">
        {/* Important Links */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6">
          <h2 className="font-display text-xl font-bold uppercase tracking-wide text-charcoal mb-4">
            Important Links
          </h2>
          <div className="space-y-3">
            <a
              href="https://west.pony.org"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-flag-blue font-semibold hover:underline py-2 min-h-[44px]"
            >
              All-Star Tournament Updates
              <ExternalLink size={16} />
            </a>
            <p className="text-sm text-gray-500 ml-0 -mt-1">
              west.pony.org &rarr; So Cal Baseball &rarr; Central Region &rarr; Tournaments
            </p>
            <a
              href="https://www.pony.org/rules"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-flag-blue font-semibold hover:underline py-2 min-h-[44px]"
            >
              PONY Baseball Rules
              <ExternalLink size={16} />
            </a>
          </div>
        </div>

        {/* Season Overview */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={20} className="text-flag-blue" />
            <h2 className="font-display text-xl font-bold uppercase tracking-wide text-charcoal">
              Season Overview
            </h2>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-charcoal mb-1">Schedule</h3>
              <p className="text-gray-600 text-sm">
                Track your team&apos;s path at all times at the tournament link above. Schedules come out Monday/Tuesday before each round.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-charcoal mb-1">Hosting</h3>
              <p className="text-gray-600 text-sm">
                Some teams will host rounds. The Red team hosts Regions. Entry fees are paid by Irvine Pony.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-charcoal mb-1">Scoring</h3>
              <p className="text-gray-600 text-sm">
                Scoreboard is a simple task done on any smart phone. Each team must sign up for scoring slots.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-charcoal mb-1">Manager Meeting</h3>
              <p className="text-gray-600 text-sm">
                Mandatory Pre-Tournament Manager Meeting with PONY Directors. Dates and locations between June 1-12 (TBA). Must bring your league-approved binder and affidavit.
              </p>
            </div>
          </div>
        </div>

        {/* Rules of Note */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={20} className="text-star-gold" />
            <h2 className="font-display text-xl font-bold uppercase tracking-wide text-charcoal">
              Rules of Note
            </h2>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-charcoal mb-1">Machine Pitch (Shetland/Pinto MP)</h3>
              <p className="text-gray-600 text-sm">
                Check the rules regarding balls in play hitting the machine or coach.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-charcoal mb-1">Kid Pitch (Pinto KP and up)</h3>
              <p className="text-gray-600 text-sm">
                Know by heart the bat 9 play 9 rules regarding substitutions, pitch counts, and rest day language.
              </p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3">
              <h3 className="font-semibold text-flag-red mb-1">All Divisions</h3>
              <p className="text-gray-700 text-sm">
                For Colts teams, take all of your USSSA bats out of your bags and store them until summer.
              </p>
            </div>
          </div>
        </div>

        {/* Uniform Info */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shirt size={20} className="text-flag-blue" />
            <h2 className="font-display text-xl font-bold uppercase tracking-wide text-charcoal">
              Uniform Info
            </h2>
          </div>
          <ul className="space-y-3 text-gray-600 text-sm">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-flag-blue shrink-0" />
              Most Rec All-Star based teams have striped gray jerseys and hats. Navy based jersey should be in shortly.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-flag-blue shrink-0" />
              If your jersey doesn&apos;t have a patch yet, you&apos;ll be getting a replacement.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-flag-blue shrink-0" />
              Teams will have uniforms in before your first round of All-Stars.
            </li>
          </ul>
        </div>

        {/* Announcements Feed */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Info size={20} className="text-flag-blue" />
            <h2 className="font-display text-xl font-bold uppercase tracking-wide text-charcoal">
              Announcements
            </h2>
          </div>

          {loadingAnnouncements ? (
            <p className="text-gray-400 text-sm">Loading announcements...</p>
          ) : announcements.length === 0 ? (
            <p className="text-gray-400 text-sm">No announcements yet.</p>
          ) : (
            <div className="space-y-4">
              {announcements.map((a) => (
                <div
                  key={a.id}
                  className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0"
                >
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-charcoal">{a.title}</h3>
                    {a.division && (
                      <span className="text-xs font-semibold uppercase tracking-wide bg-flag-blue/10 text-flag-blue px-2 py-0.5 rounded">
                        {a.division}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mb-2">{formatDate(a.created_at)}</p>
                  <p className="text-gray-600 text-sm whitespace-pre-line">{a.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

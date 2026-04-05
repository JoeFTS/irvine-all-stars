import { Metadata } from "next";
import { StripeDivider } from "@/components/stripe-divider";

export const metadata: Metadata = {
  title: "2026 Season Timeline",
  description:
    "The complete Irvine Pony Baseball All-Stars timeline — from pre-season planning through post-season celebration.",
  openGraph: {
    title: "2026 Season Timeline",
    description:
      "Key dates from coach applications through tournaments for the Irvine All-Stars season.",
  },
};

const phases = [
  {
    num: 1,
    title: "Pre-Season Planning",
    dates: "January \u2013 March",
    bg: "bg-flag-blue",
    current: false,
    items: [
      "Budget approved by the board",
      "Season calendar drafted and published",
      "Fields reserved for practices and tryouts",
      "Insurance coverage verified for all events",
    ],
  },
  {
    num: 2,
    title: "Coach Selection",
    dates: "March 22 \u2013 March 27",
    bg: "bg-flag-red",
    current: true,
    items: [
      "Coach candidacy deadline (March 23)",
      "Peer coach voting & player nominations (March 24\u201326)",
      "All-Star coaches named (March 27)",
      "Head coaches may select assistant coaches confidentially",
    ],
  },
  {
    num: 3,
    title: "Scouting & Player Nominations",
    dates: "March 28 \u2013 April 11",
    bg: "bg-flag-blue",
    current: false,
    items: [
      "Coaches scout players during regular-season games",
      "Each team nominates 3\u20134 players for All-Star tryouts",
      "Head coaches may invite additional players to tryouts",
      "Player registration finalized",
    ],
  },
  {
    num: 4,
    title: "All-Star Tryouts & Selection",
    dates: "April 12 \u2013 14",
    bg: "bg-flag-red",
    current: false,
    items: [
      "All-Star tryouts held (April 12)",
      "Players scored by evaluators and coaches",
      "All-Star players notified (April 14)",
      "Rosters finalized, documentation begins",
    ],
  },
  {
    num: 5,
    title: "Tournament Season",
    dates: "Late May \u2013 Early August",
    bg: "bg-flag-blue",
    current: false,
    items: [
      "Memorial Day Tournament (league-funded)",
      "District tournaments begin (June 11\u201318)",
      "Section & Region rounds through July",
      "National or Regional track \u2014 new format for 2026",
    ],
  },
  {
    num: 6,
    title: "Post-Season",
    dates: "August",
    bg: "bg-flag-red",
    current: false,
    items: [
      "Season budget reconciled and reported",
      "Coach and parent feedback collected",
      "Documents and records archived",
      "End-of-season celebration and awards",
    ],
  },
];

export default function TimelinePage() {
  return (
    <>
      {/* ===== HERO ===== */}
      <section className="grain-overlay relative bg-flag-blue pt-[98px] pb-16 px-6 md:px-10 text-center overflow-hidden">
        <div className="max-w-3xl mx-auto">
          <p className="text-star-gold-bright font-display text-sm font-semibold uppercase tracking-[3px] mb-3">
            &#9733; Season Roadmap
          </p>
          <h1 className="font-hero text-4xl md:text-5xl font-bold text-white uppercase tracking-wide mb-4">
            2026 Season Timeline
          </h1>
          <p className="text-white/60 text-lg leading-relaxed max-w-xl mx-auto">
            From January planning sessions to the July celebration, here&apos;s
            every phase of the All-Stars season at a glance.
          </p>
        </div>
      </section>

      <StripeDivider />

      <div className="baseball-stitch relative py-4" />

      {/* ===== TIMELINE ===== */}
      <section className="bg-off-white py-20 px-6 md:px-10">
        <div className="max-w-5xl mx-auto relative">
          {/* Vertical line — hidden on mobile, visible md+ */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-200 -translate-x-1/2" />

          <div className="flex flex-col gap-12 md:gap-16">
            {phases.map((phase, i) => {
              const isLeft = i % 2 === 0;

              return (
                <div
                  key={phase.num}
                  className="relative md:grid md:grid-cols-2 md:gap-10 items-start"
                >
                  {/* Dot on the center line — desktop only */}
                  <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 top-6 z-10 items-center justify-center">
                    <div
                      className={`w-5 h-5 rounded-full border-4 border-off-white ${
                        phase.current
                          ? "bg-star-gold-bright ring-4 ring-star-gold-bright/30"
                          : phase.bg
                      }`}
                    />
                  </div>

                  {/* Card — alternates sides on desktop */}
                  <div
                    className={`${
                      isLeft ? "md:col-start-1" : "md:col-start-2"
                    }`}
                  >
                    <div
                      className={`bg-white rounded-2xl p-6 border ${
                        phase.current
                          ? "border-star-gold-bright shadow-md ring-2 ring-star-gold-bright/20"
                          : "border-gray-200"
                      } relative`}
                    >
                      {/* Color bar top */}
                      <div
                        className={`absolute top-0 left-0 right-0 h-1 rounded-t-2xl ${
                          phase.current
                            ? "bg-star-gold-bright"
                            : phase.bg
                        }`}
                      />

                      {/* Mobile dot */}
                      <div className="md:hidden flex items-center gap-3 mb-3">
                        <div
                          className={`w-3.5 h-3.5 rounded-full shrink-0 ${
                            phase.current
                              ? "bg-star-gold-bright ring-4 ring-star-gold-bright/20"
                              : phase.bg
                          }`}
                        />
                        <span className="text-xs font-display font-semibold text-gray-400 uppercase tracking-widest">
                          Phase {phase.num}
                        </span>
                        {phase.current && (
                          <span className="text-[10px] font-semibold uppercase tracking-wider bg-star-gold-bright/15 text-star-gold px-2 py-0.5 rounded-full">
                            Current
                          </span>
                        )}
                      </div>

                      {/* Desktop phase number */}
                      <div className="hidden md:flex items-center gap-2 mb-1">
                        <span className="text-xs font-display font-semibold text-gray-400 uppercase tracking-widest">
                          Phase {phase.num}
                        </span>
                        {phase.current && (
                          <span className="text-[10px] font-semibold uppercase tracking-wider bg-star-gold-bright/15 text-star-gold px-2 py-0.5 rounded-full">
                            Current
                          </span>
                        )}
                      </div>

                      <h3 className="font-display text-xl font-bold uppercase tracking-wide mb-1">
                        {phase.title}
                      </h3>
                      <p
                        className={`text-sm font-semibold mb-4 ${
                          phase.current ? "text-star-gold" : "text-gray-400"
                        }`}
                      >
                        {phase.dates}
                      </p>

                      <ul className="space-y-2">
                        {phase.items.map((item) => (
                          <li
                            key={item}
                            className="flex items-start gap-2 text-sm text-gray-600 leading-relaxed"
                          >
                            <span
                              className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                                phase.current
                                  ? "bg-star-gold-bright"
                                  : phase.bg
                              }`}
                            />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Empty col for alternating layout */}
                  <div
                    className={`hidden md:block ${
                      isLeft ? "md:col-start-2" : "md:col-start-1 md:row-start-1"
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <StripeDivider />

      {/* ===== CTA ===== */}
      <section className="bg-flag-blue py-16 px-6 md:px-10 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-white uppercase tracking-wide mb-3">
            Don&apos;t Miss a Step
          </h2>
          <p className="text-white/60 mb-6 leading-relaxed">
            Applications are open now. Get ahead of the timeline and register
            today.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <a
              href="/auth/login"
              className="bg-flag-red hover:bg-flag-red-dark text-white px-7 py-3 rounded-full font-display text-sm font-semibold uppercase tracking-widest transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              Sign In
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

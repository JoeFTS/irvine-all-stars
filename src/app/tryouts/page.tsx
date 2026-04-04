import type { Metadata } from "next";
import Link from "next/link";
import { divisions } from "@/content/divisions";
import { StripeDivider } from "@/components/stripe-divider";

export const metadata: Metadata = {
  title: "All-Stars Tryouts",
  description:
    "Everything you need to know about Irvine Pony Baseball All-Stars tryouts. Schedule, scoring rubric, what to bring, and what to expect for all twelve divisions.",
  openGraph: {
    title: "All-Stars Tryouts",
    description:
      "Tryout schedule, scoring rubric, and what to expect for all twelve Irvine All-Stars divisions.",
  },
};

const rubricItems = [
  {
    category: "Hitting",
    points: 9,
    description:
      "Swing mechanics, bat speed, contact consistency, and ability to drive the ball. Evaluated through live batting practice and tee work.",
    color: "bg-flag-blue",
  },
  {
    category: "Fielding",
    points: 9,
    description:
      "Glove work, footwork, range, and ability to field ground balls and fly balls cleanly. Evaluated at multiple positions.",
    color: "bg-flag-red",
  },
  {
    category: "Throwing",
    points: 9,
    description:
      "Arm strength, accuracy, and proper throwing mechanics. Measured through distance throws and positional throwing drills.",
    color: "bg-flag-blue",
  },
  {
    category: "Running / Speed",
    points: 9,
    description:
      "Base running speed, agility, and instincts. Timed sprints and base-to-base running evaluated.",
    color: "bg-flag-red",
  },
  {
    category: "Effort",
    points: 9,
    description:
      "Hustle, intensity, and willingness to give 100% throughout the tryout. Players who compete hard on every play stand out.",
    color: "bg-flag-blue",
  },
  {
    category: "Attitude",
    points: 9,
    description:
      "Sportsmanship, coachability, and enthusiasm. How a player treats teammates, coaches, and the game matters.",
    color: "bg-flag-red",
  },
];

const whatToExpect = [
  {
    title: "Check-In & Jersey Numbers",
    description:
      "Players check in at the registration table, receive a numbered jersey for identification, and are assigned to their evaluation group.",
  },
  {
    title: "Station Rotations",
    description:
      "Players rotate through hitting, fielding, throwing, and running stations. Each station is run by trained evaluators who score every player independently.",
  },
  {
    title: "Independent Evaluators",
    description:
      "All scoring is done by independent evaluators — not the coaches selecting rosters. This ensures every player gets a fair, unbiased assessment.",
  },
  {
    title: "Water Breaks & Duration",
    description:
      "Tryouts last approximately 2 hours with scheduled water breaks. Players should arrive 15 minutes early and be ready to play.",
  },
];

const whatToBring = [
  {
    item: "Baseball glove",
    iconPath: "M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2M14 11V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7M10 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v5M6 11V9a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7a8 8 0 0 0 16 0v-1M18 11a2 2 0 1 0-4 0v1",
  },
  {
    item: "Cleats (no metal)",
    iconPath: "M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-5 4.5-5 2.4 0 3.9 1.55 4.5 3.03C12.6 4.55 14.1 3 16.5 3 19.51 3 20.97 5.28 21 8c.03 2.5-1 3.5-1 5.62V16M3 18h18M7 20h10",
  },
  {
    item: "Bat (optional -- bats provided)",
    iconPath: "M5 19L19 5M5 19l-2 2M19 5l1.5-1.5a1.5 1.5 0 0 0-2.12-2.12L17 2.88",
  },
  {
    item: "Water bottle",
    iconPath: "M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z",
  },
  {
    item: "Athletic clothes & cup",
    iconPath: "M20.38 3.46L16 2 12 5.5 8 2 3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z",
  },
  {
    item: "A positive attitude",
    iconPath: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  },
];

export default function TryoutsPage() {
  return (
    <>
      {/* ===== HERO ===== */}
      <section className="relative bg-flag-blue pt-[98px] pb-16 md:pb-20 px-6 md:px-10 overflow-hidden">
        <div className="absolute inset-0 text-white/[0.04] text-xl leading-[2.8rem] tracking-widest overflow-hidden pointer-events-none p-4">
          {"★ ".repeat(200)}
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center pt-10 md:pt-16">
          <p className="font-display text-sm font-semibold text-star-gold-bright uppercase tracking-[3px] mb-3">
            &#9733; Show What You&apos;ve Got
          </p>
          <h1 className="font-hero text-4xl md:text-6xl font-bold text-white uppercase tracking-wide mb-4">
            All-Stars Tryouts
          </h1>
          <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Every player gets a fair shot. Independent evaluators, a
            standardized 54-point rubric, and a process built on merit — not
            connections.
          </p>
        </div>
      </section>

      <StripeDivider />

      {/* ===== TRYOUT SCHEDULE ===== */}
      <section className="bg-off-white py-16 md:py-20 px-6 md:px-10">
        <div className="max-w-4xl mx-auto">
          <p className="font-display text-sm font-semibold text-flag-red uppercase tracking-[3px] mb-2">
            &#9733; Mark Your Calendar
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide mb-3">
            Tryout Schedule
          </h2>
          <p className="text-gray-600 text-lg max-w-xl mb-8 leading-relaxed">
            All twelve divisions have scheduled tryout dates. Find your
            player&apos;s division below.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {divisions.map((div, i) => {
              const tint = ["bg-tint-cream", "bg-tint-green", "bg-tint-leather"][i % 3];
              return (
              <div
                key={div.id}
                className={`${tint} rounded-2xl p-6 border border-gray-200 relative overflow-hidden`}
              >
                <div
                  className={`absolute top-0 left-0 right-0 h-1 ${
                    i % 2 === 0 ? "bg-flag-blue" : "bg-flag-red"
                  }`}
                />
                <div className="flex justify-between items-start mb-1">
                  <span className="font-display text-3xl font-bold uppercase">
                    {div.name}
                  </span>
                  <span className="text-star-gold text-xl">&#9733;</span>
                </div>
                <p className="text-gray-600 text-sm mb-3">
                  {div.ageGroup}
                  {div.ponyName ? ` \u2022 ${div.ponyName}` : ""}
                </p>
                <div className="bg-cream rounded px-3 py-2 text-center">
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-display font-semibold mb-0.5">
                    Tryout Date
                  </p>
                  <p className="font-display text-lg font-bold text-flag-blue uppercase">
                    {div.tryoutDate}
                  </p>
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  {div.rosterSize} roster spots available
                </p>
              </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="baseball-stitch relative py-4" />

      {/* ===== WHAT TO EXPECT ===== */}
      <section className="bg-white py-16 md:py-20 px-6 md:px-10">
        <div className="max-w-4xl mx-auto">
          <p className="font-display text-sm font-semibold text-flag-red uppercase tracking-[3px] mb-2">
            &#9733; Game Day
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide mb-3">
            What to Expect at Tryouts
          </h2>
          <p className="text-gray-600 text-lg max-w-xl mb-10 leading-relaxed">
            Here&apos;s a walkthrough of tryout day so your player arrives
            confident and ready.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {whatToExpect.map((item, i) => (
              <div
                key={item.title}
                className="bg-off-white rounded-2xl p-6 border border-gray-200 flex gap-4"
              >
                <div
                  className={`w-9 h-9 rounded-full ${
                    i % 2 === 0 ? "bg-flag-blue" : "bg-flag-red"
                  } text-white font-display text-sm font-bold flex items-center justify-center shrink-0 mt-0.5`}
                >
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-display text-base font-semibold uppercase tracking-wide mb-1">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SCORING RUBRIC ===== */}
      <section className="bg-cream py-16 md:py-20 px-6 md:px-10">
        <div className="max-w-4xl mx-auto">
          <p className="font-display text-sm font-semibold text-flag-red uppercase tracking-[3px] mb-2">
            &#9733; The Rubric
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide mb-3">
            How Players Are Scored
          </h2>
          <p className="text-gray-600 text-lg max-w-xl mb-10 leading-relaxed">
            Every player is evaluated on the same 54-point scale across 6
            categories. No subjectivity, no shortcuts — just skills.
          </p>

          <div className="space-y-4">
            {rubricItems.map((item) => (
              <div
                key={item.category}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row">
                  <div
                    className={`${item.color} text-white font-display text-2xl md:text-3xl font-bold flex items-center justify-center px-6 py-4 sm:py-0 sm:w-24 shrink-0`}
                  >
                    {item.points}
                  </div>
                  <div className="p-5 md:p-6 flex-1">
                    <h3 className="font-display text-lg font-semibold uppercase tracking-wide mb-1">
                      {item.category}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-6 bg-flag-blue rounded-2xl p-5 flex items-center justify-between">
            <span className="font-display text-lg font-semibold text-white uppercase tracking-wide">
              Total Points
            </span>
            <span className="font-display text-3xl md:text-4xl font-bold text-star-gold-bright">
              100
            </span>
          </div>
        </div>
      </section>

      <StripeDivider />

      {/* ===== WHAT TO BRING ===== */}
      <section className="bg-off-white py-16 md:py-20 px-6 md:px-10">
        <div className="max-w-4xl mx-auto">
          <p className="font-display text-sm font-semibold text-flag-red uppercase tracking-[3px] mb-2">
            &#9733; Be Prepared
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide mb-3">
            What to Bring
          </h2>
          <p className="text-gray-600 text-lg max-w-xl mb-8 leading-relaxed">
            Make sure your player shows up ready to compete.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {whatToBring.map((item, i) => {
              const tint = ["bg-tint-cream", "bg-tint-green", "bg-tint-leather"][i % 3];
              return (
              <div
                key={item.item}
                className={`${tint} rounded-2xl p-4 sm:p-5 border border-gray-200 text-center flex flex-col items-center`}
              >
                <div className="w-8 h-8 rounded-full bg-flag-blue/10 flex items-center justify-center shrink-0 mb-2">
                  <svg className="w-4 h-4 text-flag-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d={item.iconPath} />
                  </svg>
                </div>
                <p className="font-display text-sm font-semibold uppercase tracking-wide">
                  {item.item}
                </p>
              </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="baseball-stitch relative py-4" />

      {/* ===== FOR PARENTS ===== */}
      <section className="bg-white py-16 md:py-20 px-6 md:px-10">
        <div className="max-w-4xl mx-auto">
          <p className="font-display text-sm font-semibold text-flag-red uppercase tracking-[3px] mb-2">
            &#9733; For the Family
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide mb-3">
            What Parents Should Know
          </h2>
          <p className="text-gray-600 text-lg max-w-xl mb-10 leading-relaxed">
            All-Stars is a commitment for the whole family. Here&apos;s what to
            expect beyond the field.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-off-white rounded-2xl p-6 md:p-7 border border-gray-200">
              <div className="w-10 h-10 rounded-full bg-flag-blue/10 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-flag-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                </svg>
              </div>
              <h3 className="font-display text-lg font-semibold uppercase tracking-wide mb-2">
                Time Commitment
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Expect 3-4 practices per week plus weekend games and
                tournaments. The All-Stars season runs approximately 6-8 weeks
                through the summer. Full attendance is expected for all
                team activities.
              </p>
            </div>

            <div className="bg-off-white rounded-2xl p-6 md:p-7 border border-gray-200">
              <div className="w-10 h-10 rounded-full bg-flag-red/10 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-flag-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <h3 className="font-display text-lg font-semibold uppercase tracking-wide mb-2">
                Estimated Costs
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                All-Stars fees typically range from $200-$400 per player,
                covering tournament entry fees, uniforms, and umpire costs.
                Exact amounts vary by division and are communicated after
                roster selection.
              </p>
            </div>

            <div className="bg-off-white rounded-2xl p-6 md:p-7 border border-gray-200">
              <div className="w-10 h-10 rounded-full bg-flag-blue/10 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-flag-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h3 className="font-display text-lg font-semibold uppercase tracking-wide mb-2">
                Communication
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Coaches will use team communication tools (typically TeamSnap or
                similar) for schedules, updates, and announcements. Parents
                are expected to be responsive and check for updates regularly.
              </p>
            </div>

            <div className="bg-off-white rounded-2xl p-6 md:p-7 border border-gray-200">
              <div className="w-10 h-10 rounded-full bg-flag-red/10 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-flag-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </div>
              <h3 className="font-display text-lg font-semibold uppercase tracking-wide mb-2">
                Parent Conduct
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                We expect positive sideline behavior, respect for coaches and
                umpires, and support for all players — not just your own. Our
                program prioritizes sportsmanship from everyone involved.
              </p>
            </div>
          </div>
        </div>
      </section>

      <StripeDivider />

      {/* ===== CTA ===== */}
      <section className="bg-flag-blue py-16 md:py-20 px-6 md:px-10 text-center">
        <div className="max-w-2xl mx-auto">
          <p className="text-star-gold-bright font-display text-sm font-semibold uppercase tracking-[3px] mb-4">
            &#9733; Step Up to the Plate &#9733;
          </p>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-white uppercase tracking-wide mb-4">
            Register for Tryouts
          </h2>
          <p className="text-white/60 text-lg mb-8 leading-relaxed">
            Sign your player up today. Tryout spots are first-come,
            first-served, and every registered player is guaranteed an
            evaluation.
          </p>
          <Link
            href="/apply/player"
            className="inline-block bg-flag-red hover:bg-flag-red-dark text-white px-8 py-3.5 rounded-full font-display text-sm font-semibold uppercase tracking-widest transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            Register for Tryouts &#9733;
          </Link>
        </div>
      </section>
    </>
  );
}

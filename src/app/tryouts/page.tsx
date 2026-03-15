import type { Metadata } from "next";
import Link from "next/link";
import { divisions } from "@/content/divisions";
import { StripeDivider } from "@/components/stripe-divider";

export const metadata: Metadata = {
  title: "All-Stars Tryouts",
  description:
    "Everything you need to know about Irvine Pony Baseball All-Stars tryouts. Schedule, scoring rubric, what to bring, and what to expect for all ten divisions.",
};

const rubricItems = [
  {
    category: "Hitting",
    points: 20,
    description:
      "Swing mechanics, bat speed, contact consistency, and ability to drive the ball. Evaluated through live batting practice and tee work.",
    color: "bg-flag-blue",
  },
  {
    category: "Fielding",
    points: 20,
    description:
      "Glove work, footwork, range, and ability to field ground balls and fly balls cleanly. Evaluated at multiple positions.",
    color: "bg-flag-red",
  },
  {
    category: "Throwing",
    points: 15,
    description:
      "Arm strength, accuracy, and proper throwing mechanics. Measured through distance throws and positional throwing drills.",
    color: "bg-flag-blue",
  },
  {
    category: "Running / Speed",
    points: 15,
    description:
      "Base running speed, agility, and instincts. Timed sprints and base-to-base running evaluated.",
    color: "bg-flag-red",
  },
  {
    category: "Baseball IQ",
    points: 15,
    description:
      "Understanding of game situations, positioning, and decision-making. How well a player reads the game in real time.",
    color: "bg-flag-blue",
  },
  {
    category: "Effort & Attitude",
    points: 15,
    description:
      "Hustle, coachability, sportsmanship, and enthusiasm. Players who give 100% and support their teammates stand out.",
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
  { item: "Baseball glove", icon: "&#129354;" },
  { item: "Cleats (no metal)", icon: "&#128094;" },
  { item: "Bat (optional — bats provided)", icon: "&#127951;" },
  { item: "Water bottle", icon: "&#128167;" },
  { item: "Athletic clothes & cup", icon: "&#128085;" },
  { item: "A positive attitude", icon: "&#9733;" },
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
          <h1 className="font-display text-4xl md:text-6xl font-bold text-white uppercase tracking-wide mb-4">
            All-Stars Tryouts
          </h1>
          <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Every player gets a fair shot. Independent evaluators, a
            standardized 100-point rubric, and a process built on merit — not
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
            All ten divisions have dedicated tryout dates. Find your
            player&apos;s division below.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {divisions.map((div, i) => (
              <div
                key={div.id}
                className="bg-white rounded-lg p-6 border border-gray-200 relative overflow-hidden"
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
            ))}
          </div>
        </div>
      </section>

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
                className="bg-off-white rounded-lg p-6 border border-gray-200 flex gap-4"
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
            Every player is evaluated on the same 100-point scale. No
            subjectivity, no shortcuts — just skills.
          </p>

          <div className="space-y-4">
            {rubricItems.map((item) => (
              <div
                key={item.category}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden"
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
          <div className="mt-6 bg-flag-blue rounded-lg p-5 flex items-center justify-between">
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

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {whatToBring.map((item) => (
              <div
                key={item.item}
                className="bg-white rounded-lg p-5 border border-gray-200 text-center"
              >
                <div
                  className="text-3xl mb-2"
                  dangerouslySetInnerHTML={{ __html: item.icon }}
                />
                <p className="font-display text-sm font-semibold uppercase tracking-wide">
                  {item.item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

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
            <div className="bg-off-white rounded-lg p-6 md:p-7 border border-gray-200">
              <div className="w-10 h-10 rounded-full bg-flag-blue text-white font-display font-bold flex items-center justify-center mb-4 text-lg">
                &#128337;
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

            <div className="bg-off-white rounded-lg p-6 md:p-7 border border-gray-200">
              <div className="w-10 h-10 rounded-full bg-flag-red text-white font-display font-bold flex items-center justify-center mb-4 text-lg">
                &#128176;
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

            <div className="bg-off-white rounded-lg p-6 md:p-7 border border-gray-200">
              <div className="w-10 h-10 rounded-full bg-flag-blue text-white font-display font-bold flex items-center justify-center mb-4 text-lg">
                &#128172;
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

            <div className="bg-off-white rounded-lg p-6 md:p-7 border border-gray-200">
              <div className="w-10 h-10 rounded-full bg-flag-red text-white font-display font-bold flex items-center justify-center mb-4 text-lg">
                &#129309;
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
            className="inline-block bg-flag-red hover:bg-flag-red-dark text-white px-8 py-3.5 rounded font-display text-sm font-semibold uppercase tracking-widest transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            Register for Tryouts &#9733;
          </Link>
        </div>
      </section>
    </>
  );
}

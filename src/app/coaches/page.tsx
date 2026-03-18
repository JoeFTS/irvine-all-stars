import type { Metadata } from "next";
import Link from "next/link";
import { StripeDivider } from "@/components/stripe-divider";

export const metadata: Metadata = {
  title: "Coach Selection",
  description:
    "Learn about the Irvine All-Stars coach selection process. Fair, transparent, and based on a 100-point rubric covering player development, sportsmanship, and commitment.",
  openGraph: {
    title: "Coach Selection",
    description:
      "Apply to coach an Irvine All-Stars division. Fair, transparent selection based on a 100-point rubric.",
  },
};

const rubricItems = [
  {
    category: "Player Development Track Record",
    points: 30,
    description:
      "Demonstrated history of improving players' skills, knowledge of the game at the age-appropriate level, and ability to create meaningful practice plans.",
    color: "bg-flag-blue",
  },
  {
    category: "Sportsmanship & Reputation",
    points: 20,
    description:
      "Standing within the league community, interactions with umpires, opposing coaches, and parents. No disciplinary history.",
    color: "bg-flag-red",
  },
  {
    category: "Availability & Commitment",
    points: 20,
    description:
      "Full availability for the All-Stars season including practices, tournaments, and league events. No mid-season conflicts.",
    color: "bg-flag-blue",
  },
  {
    category: "Staff Quality & Readiness",
    points: 15,
    description:
      "Quality of proposed coaching staff, including assistant coaches and team parent. Background-checked and ready to go.",
    color: "bg-flag-red",
  },
  {
    category: "Administrative Reliability",
    points: 15,
    description:
      "Track record of timely communication, completed paperwork, roster management, and financial accountability.",
    color: "bg-flag-blue",
  },
];

const timelineSteps = [
  {
    step: "1",
    title: "Submit Application",
    date: "April 1 - April 21",
    description:
      "Complete the online coach application form. Include your coaching history, proposed staff, and division preference.",
  },
  {
    step: "2",
    title: "Committee Review",
    date: "April 22 - April 28",
    description:
      "The All-Stars Committee reviews all applications, checks references, and scores each candidate on the 100-point rubric.",
  },
  {
    step: "3",
    title: "Interview",
    date: "April 29 - May 3",
    description:
      "Top candidates are invited for a brief interview with the committee. Share your coaching philosophy and vision for the team.",
  },
  {
    step: "4",
    title: "Selection & Notification",
    date: "May 5",
    description:
      "Head coaches are selected and notified. Coaching staffs are finalized and announced to the league.",
  },
];

export default function CoachesPage() {
  return (
    <>
      {/* ===== HERO ===== */}
      <section className="relative bg-flag-blue pt-[98px] pb-16 md:pb-20 px-6 md:px-10 overflow-hidden">
        <div className="absolute inset-0 text-white/[0.04] text-xl leading-[2.8rem] tracking-widest overflow-hidden pointer-events-none p-4">
          {"★ ".repeat(200)}
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center pt-10 md:pt-16">
          <p className="font-display text-sm font-semibold text-star-gold-bright uppercase tracking-[3px] mb-3">
            &#9733; Lead the Team
          </p>
          <h1 className="font-display text-4xl md:text-6xl font-bold text-white uppercase tracking-wide mb-4">
            Coach Selection
          </h1>
          <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Every applicant is evaluated on the same 100-point rubric.
          </p>
        </div>
      </section>

      <StripeDivider />

      {/* ===== ELIGIBILITY ===== */}
      <section className="bg-off-white py-16 md:py-20 px-6 md:px-10">
        <div className="max-w-4xl mx-auto">
          <p className="font-display text-sm font-semibold text-flag-red uppercase tracking-[3px] mb-2">
            &#9733; Before You Apply
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide mb-3">
            Eligibility Requirements
          </h2>
          <p className="text-gray-600 text-lg max-w-xl mb-8 leading-relaxed">
            All head coach candidates must meet the following requirements
            before submitting an application.
          </p>
          <div className="bg-white rounded-lg p-6 md:p-8 border border-gray-200">
            <ul className="space-y-4">
              {[
                {
                  title: "Background Check",
                  desc: "Must pass a current background check through Irvine Pony Baseball. No exceptions.",
                },
                {
                  title: "Full Season Commitment",
                  desc: "Available for the entire All-Stars season — practices, games, and tournaments through July.",
                },
                {
                  title: "Good Standing with the League",
                  desc: "No disciplinary actions, unresolved complaints, or outstanding fees with Irvine Pony Baseball.",
                },
                {
                  title: "Coaching Experience",
                  desc: "Minimum one season of coaching experience within Irvine Pony Baseball or an equivalent youth baseball organization.",
                },
                {
                  title: "Complete Coaching Staff",
                  desc: "Must submit a proposed coaching staff (at least one assistant coach) with your application. All staff must also pass background checks.",
                },
                {
                  title: "Age-Appropriate Certification",
                  desc: "Completion of any required PONY-level coaching certifications or willingness to complete before the season starts.",
                },
              ].map((item) => (
                <li key={item.title} className="flex gap-3">
                  <span className="text-flag-red text-lg mt-0.5 shrink-0">
                    &#9733;
                  </span>
                  <div>
                    <span className="font-display font-semibold uppercase tracking-wide text-charcoal">
                      {item.title}
                    </span>
                    <p className="text-gray-600 text-sm mt-0.5 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ===== 100-POINT RUBRIC ===== */}
      <section className="bg-cream py-16 md:py-20 px-6 md:px-10">
        <div className="max-w-4xl mx-auto">
          <p className="font-display text-sm font-semibold text-flag-red uppercase tracking-[3px] mb-2">
            &#9733; The Rubric
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide mb-3">
            How Coaches Are Selected
          </h2>
          <p className="text-gray-600 text-lg max-w-xl mb-10 leading-relaxed">
            Every applicant is scored on the same 100-point rubric by the
            All-Stars Committee. Here&apos;s the breakdown.
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

      {/* ===== APPLICATION TIMELINE ===== */}
      <section className="bg-off-white py-16 md:py-20 px-6 md:px-10">
        <div className="max-w-4xl mx-auto">
          <p className="font-display text-sm font-semibold text-flag-red uppercase tracking-[3px] mb-2">
            &#9733; The Timeline
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide mb-3">
            Application Process
          </h2>
          <p className="text-gray-600 text-lg max-w-xl mb-10 leading-relaxed">
            From application to selection in about five weeks. Here&apos;s what
            to expect.
          </p>

          <div className="space-y-0">
            {timelineSteps.map((step, i) => (
              <div key={step.step} className="flex gap-4 md:gap-6">
                {/* Vertical line + dot */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 md:w-12 md:h-12 rounded-full ${
                      i % 2 === 0 ? "bg-flag-blue" : "bg-flag-red"
                    } text-white font-display text-lg font-bold flex items-center justify-center shrink-0`}
                  >
                    {step.step}
                  </div>
                  {i < timelineSteps.length - 1 && (
                    <div className="w-0.5 flex-1 bg-gray-200 my-1" />
                  )}
                </div>

                {/* Content */}
                <div className="pb-8 md:pb-10 flex-1">
                  <div className="bg-white rounded-lg p-5 md:p-6 border border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-2">
                      <h3 className="font-display text-lg font-semibold uppercase tracking-wide">
                        {step.title}
                      </h3>
                      <span className="text-flag-red font-display text-xs font-semibold uppercase tracking-wider">
                        {step.date}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== WHAT WE LOOK FOR ===== */}
      <section className="bg-white py-16 md:py-20 px-6 md:px-10">
        <div className="max-w-4xl mx-auto">
          <p className="font-display text-sm font-semibold text-flag-red uppercase tracking-[3px] mb-2">
            &#9733; Beyond the Numbers
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide mb-3">
            What We Look For
          </h2>
          <p className="text-gray-600 text-lg max-w-xl mb-10 leading-relaxed">
            Points tell part of the story. Here&apos;s what separates great
            All-Stars coaches from the rest.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                title: "Development Focus",
                description:
                  "The best All-Stars coaches prioritize player growth over wins. Teach fundamentals, build confidence, and make every kid better than when the season started.",
                iconPath: "M13 10V3L4 14h7v7l9-11h-7z",
              },
              {
                title: "Clear Communication",
                description:
                  "Parents need to know the plan. Players need to know expectations. Coaches who communicate proactively create the best team culture.",
                iconPath: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
              },
              {
                title: "Coaching Philosophy",
                description:
                  "We look for coaches who believe in fair playing time, positive reinforcement, and competitive excellence — not at the expense of the kids' experience.",
                iconPath: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-off-white rounded-lg p-6 md:p-7 border border-gray-200 text-center"
              >
                <div className="w-12 h-12 rounded-full bg-flag-blue/10 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-flag-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.iconPath} />
                  </svg>
                </div>
                <h3 className="font-display text-lg font-semibold uppercase tracking-wide mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <StripeDivider />

      {/* ===== CTA ===== */}
      <section className="bg-flag-blue py-16 md:py-20 px-6 md:px-10 text-center">
        <div className="max-w-2xl mx-auto">
          <p className="text-star-gold-bright font-display text-sm font-semibold uppercase tracking-[3px] mb-4">
            &#9733; Take the Field &#9733;
          </p>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-white uppercase tracking-wide mb-4">
            Ready to Apply?
          </h2>
          <p className="text-white/60 text-lg mb-8 leading-relaxed">
            If you&apos;ve got the experience, the commitment, and the passion
            for player development, we want to hear from you.
          </p>
          <Link
            href="/apply/coach"
            className="inline-block bg-flag-red hover:bg-flag-red-dark text-white px-8 py-3.5 rounded font-display text-sm font-semibold uppercase tracking-widest transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            Apply to Coach &#9733;
          </Link>
        </div>
      </section>
    </>
  );
}

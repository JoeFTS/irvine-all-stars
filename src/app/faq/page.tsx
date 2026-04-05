import { Metadata } from "next";
import { StripeDivider } from "@/components/stripe-divider";
import { FaqAccordion, FaqSection } from "@/components/faq-accordion";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Everything you need to know about Irvine Pony Baseball All-Stars — tryouts, selection, costs, coaching, and more.",
  openGraph: {
    title: "Frequently Asked Questions",
    description:
      "Everything parents and coaches need to know about Irvine All-Stars tryouts, selection, costs, and more.",
  },
};

const faqSections: FaqSection[] = [
  {
    title: "For Parents",
    items: [
      {
        question: "What is All-Stars?",
        answer: (
          <>
            All-Stars are post-season tournament teams that represent Irvine
            Pony Baseball in inter-league competition. Players are selected from
            across the league to form the best possible team in each age
            division. It&apos;s a chance for standout players to compete at a
            higher level during the summer months.
          </>
        ),
      },
      {
        question: "How are players selected?",
        answer: (
          <>
            Every player who tries out is evaluated by independent evaluators
            using a standardized 54-point rubric. The rubric covers hitting,
            fielding, throwing, running/speed, effort, and attitude — each
            scored 1–9. Scores are combined with regular-season performance
            data to build balanced, competitive rosters. The process is
            designed to be fair, transparent, and free from politics.
          </>
        ),
      },
      {
        question: "What is the time commitment?",
        answer: (
          <>
            All-Stars is a significant commitment. Expect practices 2&ndash;4
            times per week plus games and tournaments from late May through early August.
            Weeknight practices are typically 1.5&ndash;2 hours, and tournament
            weekends may involve multiple games per day. Families should be
            prepared for a busy summer schedule.
          </>
        ),
      },
      {
        question: "What does it cost?",
        answer: (
          <>
            Costs vary by division but typically include a uniform fee, tournament
            entry fees, and potential travel expenses for away tournaments. As a
            rough estimate, families should budget $200&ndash;$400 for the
            season. We&apos;re committed to being upfront about costs before
            rosters are finalized so there are no surprises.
          </>
        ),
      },
      {
        question: "What if my child isn't selected?",
        answer: (
          <>
            Not making the All-Stars roster is disappointing, but it&apos;s not
            the end of the road. We encourage players to keep developing their
            skills through summer camps, clinics, and fall ball. Coaches can
            provide feedback on areas for improvement. Many players who
            don&apos;t make it one year come back stronger the next.
          </>
        ),
      },
      {
        question: "Can my child play on their regular season team too?",
        answer: (
          <>
            Yes. Regular season always takes priority until it ends. Once the
            regular season wraps up, players transition fully to their All-Stars
            team. If there are scheduling conflicts during the overlap period,
            regular-season games come first.
          </>
        ),
      },
    ],
  },
  {
    title: "For Coaches",
    items: [
      {
        question: "How do I apply to coach?",
        answer: (
          <>
            Coach applications are handled by invitation. To get started,{" "}
            <a
              href="/auth/login"
              className="text-flag-blue underline underline-offset-2 hover:text-flag-red transition-colors"
            >
              sign in
            </a>{" "}
            to your account. You&apos;ll need to
            provide your coaching background, division preference, and
            availability.
          </>
        ),
      },
      {
        question: "What's the coach selection process?",
        answer: (
          <>
            Coaches are evaluated on a 100-point rubric that includes coaching
            experience, baseball knowledge, communication skills, and commitment
            level. The selection committee conducts interviews, and final
            appointments are approved by the board. All head coaches must pass a
            background check before being confirmed.
          </>
        ),
      },
      {
        question: "What's expected of a head coach?",
        answer: (
          <>
            Head coaches are responsible for planning and running practices,
            managing games and tournament play, communicating regularly with
            parents, and handling administrative tasks like roster paperwork and
            tournament registration. It&apos;s a rewarding but demanding role
            that requires strong leadership and organization.
          </>
        ),
      },
      {
        question: "Can I have assistant coaches?",
        answer: (
          <>
            Yes. Each head coach may have up to 3 assistant coaches on their
            staff. All assistant coaches must complete a background check and be
            approved by the coordinator before participating in any team
            activities.
          </>
        ),
      },
    ],
  },
  {
    title: "General",
    items: [
      {
        question: "Where are tryouts held?",
        answer: (
          <>
            Tryouts are held at Irvine Pony Baseball fields. Specific locations
            and field assignments for each division will be announced closer to
            tryout dates. Check the{" "}
            <a
              href="/timeline"
              className="text-flag-blue underline underline-offset-2 hover:text-flag-red transition-colors"
            >
              season timeline
            </a>{" "}
            for the latest schedule information.
          </>
        ),
      },
      {
        question: "What divisions are there?",
        answer: (
          <>
            Irvine All-Stars fields twelve divisions: 5U Shetland, 6U
            Shetland, 7U Pinto Machine Pitch, 7U Pinto Kid Pitch, 8U Pinto
            Machine Pitch, 8U Pinto Kid Pitch, 9U Mustang, 10U Mustang, 11U
            Bronco, 12U Bronco, 13U Pony, and 14U Pony. Each division has its
            own tryout schedule, coaching staff, and tournament calendar.
          </>
        ),
      },
      {
        question: "How do I contact the coordinator?",
        answer: (
          <>
            You can reach the All-Stars coordinator by email at{" "}
            <a
              href="mailto:allstars@irvinepony.com"
              className="text-flag-blue underline underline-offset-2 hover:text-flag-red transition-colors"
            >
              allstars@irvinepony.com
            </a>
            . We do our best to respond within 24 hours during the season.
          </>
        ),
      },
      {
        question: "When do applications open?",
        answer: (
          <>
            Registration for the 2026 season is by invitation.{" "}
            <a
              href="/auth/login"
              className="text-flag-blue underline underline-offset-2 hover:text-flag-red transition-colors"
            >
              Sign in
            </a>{" "}
            to your account to get started.
          </>
        ),
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <>
      {/* ===== HERO ===== */}
      <section className="grain-overlay relative bg-flag-blue pt-[98px] pb-16 px-6 md:px-10 text-center overflow-hidden">
        <div className="max-w-3xl mx-auto">
          <p className="text-star-gold-bright font-display text-sm font-semibold uppercase tracking-[3px] mb-3">
            &#9733; Questions & Answers
          </p>
          <h1 className="font-hero text-4xl md:text-5xl font-bold text-white uppercase tracking-wide mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-white/60 text-lg leading-relaxed max-w-xl mx-auto">
            Everything you need to know about Irvine All-Stars &mdash; from
            tryouts and selection to coaching and costs.
          </p>
        </div>
      </section>

      <StripeDivider />

      {/* ===== FAQ CONTENT ===== */}
      <section className="bg-off-white py-20 px-6 md:px-10">
        <div className="max-w-3xl mx-auto">
          <FaqAccordion sections={faqSections} />
        </div>
      </section>

      <div className="baseball-stitch relative py-4" />

      <StripeDivider />

      {/* ===== CTA ===== */}
      <section className="bg-flag-blue py-16 px-6 md:px-10 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-white uppercase tracking-wide mb-3">
            Still Have Questions?
          </h2>
          <p className="text-white/60 mb-6 leading-relaxed">
            Reach out to the All-Stars coordinator or browse the site for more
            details.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <a
              href="mailto:allstars@irvinepony.com"
              className="bg-flag-red hover:bg-flag-red-dark text-white px-7 py-3 rounded-full font-display text-sm font-semibold uppercase tracking-widest transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              Email the Coordinator
            </a>
            <a
              href="/timeline"
              className="bg-white hover:bg-cream text-flag-blue px-7 py-3 rounded-full font-display text-sm font-semibold uppercase tracking-widest transition-all hover:-translate-y-0.5"
            >
              View Timeline
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

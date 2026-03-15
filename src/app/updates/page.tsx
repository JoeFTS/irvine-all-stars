import type { Metadata } from "next";
import { StripeDivider } from "@/components/stripe-divider";

export const metadata: Metadata = {
  title: "Updates & Announcements",
  description:
    "Latest news and announcements for Irvine Pony Baseball All-Stars. Stay informed on tryout dates, coach applications, and important deadlines.",
};

const announcements = [
  {
    date: "March 13, 2026",
    tag: "Welcome",
    title: "2026 All-Stars Season Is Here!",
    body: "The 2026 Irvine Pony Baseball All-Stars season is officially underway. This summer, ten divisions of players will compete across Southern California in one of the most exciting youth baseball experiences available. Our commitment remains the same: fair tryouts, independent evaluation, and a transparent selection process from top to bottom. Stay tuned to this page for all the latest updates as the season unfolds.",
  },
  {
    date: "March 10, 2026",
    tag: "Coaches",
    title: "Coach Applications Now Open",
    body: "Are you ready to lead an All-Stars team this summer? Coach applications are now being accepted for all ten divisions. Head to the Coach Application page to submit your interest. All applicants will be evaluated using a standardized 100-point rubric and interviewed by the selection committee. The application deadline will be announced soon, so don\u2019t wait to get started.",
  },
  {
    date: "March 7, 2026",
    tag: "Tryouts",
    title: "Tryout Registration Coming Soon",
    body: "Tryout registration for the 2026 All-Stars season will open in the coming weeks. Tryouts are held separately for each division, with dates and locations to be announced. In the meantime, make sure your player\u2019s regular-season stats are up to date and review the Tryout Evaluation Rubric on our Documents page so you know exactly what evaluators are looking for.",
  },
  {
    date: "March 5, 2026",
    tag: "General",
    title: "New Website Launch",
    body: "Welcome to irvineallstars.com \u2014 the official home of Irvine Pony Baseball All-Stars. This site is your one-stop hub for everything All-Stars: coach applications, tryout registration, policies, documents, schedules, and announcements. We built this to make the process more transparent and accessible for every family in the league. Bookmark this page and check back often.",
  },
];

function tagColor(tag: string): string {
  switch (tag) {
    case "Coaches":
      return "bg-flag-red text-white";
    case "Tryouts":
      return "bg-flag-blue text-white";
    case "Welcome":
      return "bg-star-gold text-white";
    default:
      return "bg-gray-200 text-charcoal";
  }
}

export default function UpdatesPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-flag-blue pt-[98px] pb-14 px-6 md:px-10">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-star-gold-bright font-display text-sm font-semibold uppercase tracking-[3px] mb-4">
            &#9733; Stay Informed
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white uppercase tracking-wide mb-4">
            Updates & Announcements
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto leading-relaxed">
            Check back regularly for the latest All-Stars updates and
            announcements.
          </p>
        </div>
      </section>

      <StripeDivider />

      {/* Announcements */}
      <section className="bg-off-white py-16 px-6 md:px-10">
        <div className="max-w-3xl mx-auto">
          <div className="space-y-6">
            {announcements.map((item) => (
              <article
                key={item.title}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-6 md:p-8">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span
                      className={`inline-block px-3 py-1 rounded text-xs font-display font-semibold uppercase tracking-widest ${tagColor(item.tag)}`}
                    >
                      {item.tag}
                    </span>
                    <span className="text-gray-400 text-sm">{item.date}</span>
                  </div>
                  <h2 className="font-display text-xl md:text-2xl font-bold uppercase tracking-wide mb-3">
                    {item.title}
                  </h2>
                  <p className="text-gray-600 leading-relaxed">{item.body}</p>
                </div>
              </article>
            ))}
          </div>

          {/* Bottom note */}
          <div className="mt-12 text-center">
            <p className="text-gray-400 text-sm">
              More updates will be posted as the season progresses. Follow this
              page to stay in the loop.
            </p>
          </div>
        </div>
      </section>

      <StripeDivider />
    </>
  );
}

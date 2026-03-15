import Link from "next/link";
import { divisions } from "@/content/divisions";
import { StripeDivider } from "@/components/stripe-divider";

export default function Home() {
  return (
    <>
      {/* ===== HERO (Flag Layout) ===== */}
      <section className="relative min-h-screen flex items-center pt-[98px] pb-20 overflow-hidden bg-white">
        {/* Stars field - full width on mobile, angled on desktop */}
        <div
          className="absolute top-0 left-0 w-full h-full md:w-[48%] bg-flag-blue overflow-hidden md:[clip-path:polygon(0_0,100%_0,88%_100%,0_100%)]"
        >
          <div className="absolute inset-0 text-white/[0.06] text-xl leading-[2.8rem] tracking-widest overflow-hidden pointer-events-none p-4">
            {"★ ".repeat(200)}
          </div>
        </div>

        {/* Stripes - right side */}
        <div className="absolute top-0 right-0 w-[52%] h-full overflow-hidden hidden md:block">
          {Array.from({ length: 13 }).map((_, i) => (
            <div
              key={i}
              className="w-full"
              style={{
                height: `${100 / 13}%`,
                background: i % 2 === 0 ? "rgba(178,34,52,0.07)" : "transparent",
              }}
            />
          ))}
        </div>

        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 md:px-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* Left - headline */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-white/12 border border-white/20 rounded px-4 py-1.5 mb-6">
              <span className="text-star-gold-bright font-bold text-xs uppercase tracking-widest">
                &#127482;&#127480; Summer 2026
              </span>
            </div>
            <h1 className="font-display text-5xl md:text-7xl font-bold text-white uppercase leading-[0.95] tracking-wider mb-6">
              AMERICA&apos;S
              <br />
              GAME.
              <br />
              <span className="text-flag-red bg-white px-1 inline-block">
                YOUR SHOT.
              </span>
            </h1>
            <p className="text-white/70 text-lg leading-relaxed max-w-md mx-auto lg:mx-0 mb-8">
              Irvine Pony Baseball All-Stars. Six divisions of talent, one
              standard of excellence, and a summer your family will never forget.
            </p>
            <div className="flex gap-3 flex-wrap justify-center lg:justify-start">
              <Link
                href="/apply/coach"
                className="bg-flag-red hover:bg-flag-red-dark text-white px-6 py-3 rounded font-display text-sm font-semibold uppercase tracking-widest transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                Apply to Coach &#9733;
              </Link>
              <Link
                href="/tryouts"
                className="border-2 border-white/30 hover:border-white text-white px-6 py-3 rounded font-display text-sm font-semibold uppercase tracking-widest transition-all"
              >
                Tryout Info
              </Link>
            </div>
          </div>

          {/* Right - quick link cards */}
          <div className="hidden lg:flex flex-col gap-3">
            <Link
              href="/apply/coach"
              className="bg-white border border-gray-200 rounded-lg p-5 flex items-center gap-4 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 rounded-lg bg-flag-red/10 flex items-center justify-center text-xl shrink-0">
                &#128203;
              </div>
              <div className="flex-1">
                <h3 className="font-display text-lg font-semibold uppercase tracking-wide">
                  Coach Applications
                </h3>
                <p className="text-gray-600 text-sm">
                  Apply to lead an All-Stars division this summer
                </p>
              </div>
              <span className="text-gray-400 group-hover:text-flag-blue text-xl transition-colors">
                &rarr;
              </span>
            </Link>
            <Link
              href="/apply/player"
              className="bg-white border border-gray-200 rounded-lg p-5 flex items-center gap-4 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 rounded-lg bg-flag-blue/10 flex items-center justify-center text-xl shrink-0">
                &#9918;
              </div>
              <div className="flex-1">
                <h3 className="font-display text-lg font-semibold uppercase tracking-wide">
                  Tryout Registration
                </h3>
                <p className="text-gray-600 text-sm">
                  Register your player for 2026 tryouts
                </p>
              </div>
              <span className="text-gray-400 group-hover:text-flag-blue text-xl transition-colors">
                &rarr;
              </span>
            </Link>
            <Link
              href="/portal"
              className="bg-white border border-gray-200 rounded-lg p-5 flex items-center gap-4 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 rounded-lg bg-star-gold/15 flex items-center justify-center text-xl shrink-0">
                &#128100;
              </div>
              <div className="flex-1">
                <h3 className="font-display text-lg font-semibold uppercase tracking-wide">
                  Parent Portal
                </h3>
                <p className="text-gray-600 text-sm">
                  Check status, schedules & announcements
                </p>
              </div>
              <span className="text-gray-400 group-hover:text-flag-blue text-xl transition-colors">
                &rarr;
              </span>
            </Link>
          </div>
        </div>
      </section>

      <StripeDivider />

      {/* ===== DIVISIONS ===== */}
      <section className="bg-off-white py-20 px-6 md:px-10">
        <div className="max-w-6xl mx-auto">
          <p className="font-display text-sm font-semibold text-flag-red uppercase tracking-[3px] mb-2">
            &#9733; 2026 Divisions
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide mb-3">
            Six Divisions of All-Stars
          </h2>
          <p className="text-gray-600 text-lg max-w-xl mb-10 leading-relaxed">
            From Shetland to Pony, every division gets its own tryout schedule,
            coaching staff, and summer of competition.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {divisions.map((div, i) => (
              <div
                key={div.id}
                className="bg-white rounded-lg p-6 border border-gray-200 relative overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer group"
              >
                <div
                  className={`absolute top-0 left-0 right-0 h-1 transition-all group-hover:h-1.5 ${
                    i % 2 === 0 ? "bg-flag-blue" : "bg-flag-red"
                  }`}
                />
                <div className="flex justify-between items-start mb-2">
                  <span className="font-display text-4xl font-bold uppercase">
                    {div.name}
                  </span>
                  <span className="text-star-gold text-2xl">&#9733;</span>
                </div>
                <p className="text-gray-600 text-sm mb-3">
                  {div.ageGroup}
                  {div.ponyName ? ` \u2022 ${div.ponyName}` : ""}
                </p>
                <div className="flex gap-5 text-xs text-gray-400">
                  <span>{div.rosterSize} roster spots</span>
                  <span>Tryouts: {div.tryoutDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== STATS BAR ===== */}
      <section className="bg-flag-blue py-10 px-6 md:px-10">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { number: "10", label: "Divisions" },
            { number: "120", label: "Roster Spots" },
            { number: "100", label: "Point Rubric" },
            { number: "Fair", label: "& Transparent" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="font-display text-5xl font-bold text-star-gold-bright">
                {stat.number}
              </p>
              <p className="text-white/60 text-sm uppercase tracking-wider mt-1">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="bg-cream py-20 px-6 md:px-10">
        <div className="max-w-6xl mx-auto">
          <p className="font-display text-sm font-semibold text-flag-red uppercase tracking-[3px] mb-2">
            &#9733; The Process
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide mb-3">
            How All-Stars Works
          </h2>
          <p className="text-gray-600 text-lg max-w-xl mb-10">
            Four phases. Clear process from start to finish.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                num: 1,
                title: "Apply",
                desc: "Coaches submit applications. Parents register players. All online, all documented.",
                color: "bg-flag-blue",
              },
              {
                num: 2,
                title: "Evaluate",
                desc: "Independent evaluators score every player on a 100-point rubric. Fair and consistent.",
                color: "bg-flag-red",
              },
              {
                num: 3,
                title: "Select",
                desc: "Scores combined with season data. Rosters built for balance and competitiveness.",
                color: "bg-flag-blue",
              },
              {
                num: 4,
                title: "Compete",
                desc: "Practices start. Tournaments begin. An unforgettable summer of All-Stars baseball.",
                color: "bg-flag-red",
              },
            ].map((step) => (
              <div
                key={step.num}
                className="bg-white rounded-lg p-7 border border-gray-200 text-center hover:-translate-y-1 hover:shadow-md transition-all"
              >
                <div
                  className={`w-13 h-13 rounded-full ${step.color} text-white font-display text-xl font-bold flex items-center justify-center mx-auto mb-4`}
                >
                  {step.num}
                </div>
                <h3 className="font-display text-lg font-semibold uppercase tracking-wider mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <StripeDivider />

      {/* ===== CTA ===== */}
      <section className="bg-flag-blue py-20 px-6 md:px-10 text-center">
        <div className="max-w-2xl mx-auto">
          <p className="text-star-gold-bright font-display text-sm font-semibold uppercase tracking-[3px] mb-4">
            &#9733; Get Started &#9733;
          </p>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-white uppercase tracking-wide mb-4">
            Ready to Play Ball?
          </h2>
          <p className="text-white/60 text-lg mb-8 leading-relaxed">
            Whether you&apos;re a coach ready to lead or a family signing up for
            tryouts, everything starts here.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              href="/apply/coach"
              className="bg-flag-red hover:bg-flag-red-dark text-white px-8 py-3.5 rounded font-display text-sm font-semibold uppercase tracking-widest transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              Apply to Coach
            </Link>
            <Link
              href="/apply/player"
              className="bg-white hover:bg-cream text-flag-blue px-8 py-3.5 rounded font-display text-sm font-semibold uppercase tracking-widest transition-all hover:-translate-y-0.5"
            >
              Register for Tryouts
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

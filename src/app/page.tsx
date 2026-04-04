"use client";

import Link from "next/link";
import Image from "next/image";
import { divisions } from "@/content/divisions";
import { StripeDivider } from "@/components/stripe-divider";
import {
  RevealOnScroll,
  StaggerReveal,
  StaggerItem,
  HeroReveal,
  HeroItem,
} from "@/components/motion";

const cardTints = ["bg-tint-cream", "bg-tint-green", "bg-tint-leather"] as const;

export default function Home() {
  return (
    <>
      {/* ===== HERO ===== */}
      <section className="grain-overlay relative min-h-screen flex items-center pt-[98px] pb-20 overflow-hidden">
        {/* Background image */}
        <Image
          src="/images/hero-aerial.webp"
          alt="Aerial view of a baseball diamond at golden hour"
          fill
          className="object-cover"
          priority
          unoptimized
        />
        {/* Navy overlay */}
        <div className="absolute inset-0 bg-flag-blue/75" />

        {/* Baseball stitch circle decorations */}
        <div className="baseball-stitch-circle -top-20 -right-20 w-[400px] h-[400px] opacity-10" />
        <div className="baseball-stitch-circle bottom-10 -left-32 w-[250px] h-[250px] opacity-[0.07]" />

        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 md:px-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* Left - headline */}
          <HeroReveal className="text-center lg:text-left">
            <HeroItem>
              <div className="inline-flex items-center gap-2 border border-white/20 rounded px-4 py-1.5 mb-6">
                <span className="text-star-gold font-bold text-xs uppercase tracking-widest font-display">
                  &#9733; 2026 All-Stars Season &#9733;
                </span>
              </div>
            </HeroItem>
            <HeroItem>
              <h1 className="font-hero text-5xl md:text-7xl font-bold text-white uppercase leading-[0.95] tracking-wider mb-6">
                EARN
                <br />
                YOUR
                <br />
                <span className="text-flag-red">STARS.</span>
              </h1>
            </HeroItem>
            <HeroItem>
              <p className="text-white/70 text-lg leading-relaxed max-w-md mx-auto lg:mx-0 mb-8">
                Irvine PONY All-Stars develops confident, competitive young
                athletes through elite coaching, fair selection, and a
                family-first community.
              </p>
            </HeroItem>
            <HeroItem>
              <div className="flex gap-3 flex-wrap justify-center lg:justify-start">
                <Link
                  href="/auth/login"
                  className="bg-flag-red hover:bg-flag-red-dark text-white px-7 py-3.5 rounded-full font-display text-sm font-semibold uppercase tracking-widest transition-all hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.97]"
                >
                  Sign In
                </Link>
                <Link
                  href="/tryouts"
                  className="border-2 border-white/30 hover:border-white text-white px-7 py-3.5 rounded-full font-display text-sm font-semibold uppercase tracking-widest transition-all hover:-translate-y-0.5 active:scale-[0.97]"
                >
                  Learn More
                </Link>
              </div>
            </HeroItem>
          </HeroReveal>

          {/* Right - quick link cards */}
          <StaggerReveal className="hidden lg:flex flex-col gap-3" delay={0.5}>
            <StaggerItem>
              <Link
                href="/auth/login"
                className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-5 flex items-center gap-4 hover:-translate-y-0.5 hover:bg-white/15 transition-all group active:scale-[0.98]"
              >
                <div className="w-12 h-12 rounded-lg bg-star-gold/20 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-star-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-lg font-semibold uppercase tracking-wide text-white">
                    Sign In
                  </h3>
                  <p className="text-white/50 text-sm">
                    Coach dashboard, parent portal & more
                  </p>
                </div>
                <span className="text-white/30 group-hover:text-star-gold text-xl transition-colors">
                  &rarr;
                </span>
              </Link>
            </StaggerItem>
          </StaggerReveal>
        </div>
      </section>

      <StripeDivider />

      {/* ===== DIVISIONS ===== */}
      <section className="bg-cream py-20 px-6 md:px-10">
        <div className="max-w-6xl mx-auto">
          <RevealOnScroll>
            <p className="font-display text-sm font-semibold text-flag-red uppercase tracking-[3px] mb-2">
              <span className="text-star-gold">&#9733;</span> 2026 Divisions
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide text-flag-blue mb-3">
              Twelve Divisions of All-Stars
            </h2>
            <p className="text-gray-600 text-lg max-w-xl mb-10 leading-relaxed">
              From Shetland to Pony, every division gets its own tryout
              schedule, coaching staff, and summer of competition.
            </p>
          </RevealOnScroll>
          <StaggerReveal className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {divisions.map((div, i) => (
              <StaggerItem key={div.id}>
                <div className={`${cardTints[i % 3]} rounded-2xl p-6 border border-gray-200 relative overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer group active:scale-[0.98]`}>
                  <div
                    className={`absolute top-0 left-0 right-0 h-1 transition-all group-hover:h-1.5 ${
                      i % 2 === 0 ? "bg-flag-blue" : "bg-flag-red"
                    }`}
                  />
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-display text-3xl font-bold uppercase text-flag-blue">
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
              </StaggerItem>
            ))}
          </StaggerReveal>
        </div>
      </section>

      {/* ===== STATS BAR ===== */}
      <section className="bg-flag-blue py-10 px-6 md:px-10">
        <StaggerReveal className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { number: "12", label: "Divisions" },
            { number: "144", label: "Roster Spots" },
            { number: "100", label: "Point Rubric" },
            { number: "Fair", label: "& Transparent" },
          ].map((stat) => (
            <StaggerItem key={stat.label}>
              <p className="font-hero text-3xl md:text-5xl font-bold text-star-gold">
                {stat.number}
              </p>
              <p className="text-white/60 text-sm uppercase tracking-wider mt-1">
                {stat.label}
              </p>
            </StaggerItem>
          ))}
        </StaggerReveal>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="bg-white py-20 px-6 md:px-10">
        <div className="max-w-6xl mx-auto">
          <RevealOnScroll>
            <p className="font-display text-sm font-semibold text-flag-red uppercase tracking-[3px] mb-2">
              <span className="text-star-gold">&#9733;</span> The Process
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide text-flag-blue mb-3">
              How All-Stars Works
            </h2>
            <p className="text-gray-600 text-lg max-w-xl mb-10">
              Four phases. Clear process from start to finish.
            </p>
          </RevealOnScroll>
          <StaggerReveal className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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
                desc: "Independent evaluators score every player on a 54-point rubric across 6 categories. Fair and consistent.",
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
              <StaggerItem key={step.num}>
                <div className="bg-white rounded-2xl p-7 border border-gray-200 text-center hover:-translate-y-1 hover:shadow-md transition-all active:scale-[0.98] h-full">
                  <div
                    className={`w-13 h-13 rounded-full ${step.color} text-white font-display text-xl font-bold flex items-center justify-center mx-auto mb-4`}
                  >
                    {step.num}
                  </div>
                  <h3 className="font-display text-lg font-semibold uppercase tracking-wider mb-2 text-flag-blue">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerReveal>
        </div>
      </section>

      <StripeDivider />

      {/* ===== CTA ===== */}
      <section className="relative py-24 px-6 md:px-10 text-center overflow-hidden">
        <Image
          src="/images/hero-aerial.webp"
          alt=""
          fill
          className="object-cover"
          unoptimized
        />
        <div className="absolute inset-0 bg-flag-blue/85" />
        <RevealOnScroll className="relative z-10 max-w-2xl mx-auto">
          <p className="text-star-gold font-display text-sm font-semibold uppercase tracking-[3px] mb-4">
            &#9733; Get Started &#9733;
          </p>
          <h2 className="font-hero text-3xl md:text-5xl font-bold text-white uppercase tracking-wide mb-4">
            Ready to Play Ball?
          </h2>
          <p className="text-white/60 text-lg mb-8 leading-relaxed">
            Whether you&apos;re a coach ready to lead or a family signing up for
            tryouts, everything starts here.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              href="/auth/login"
              className="bg-flag-red hover:bg-flag-red-dark text-white px-8 py-3.5 rounded-full font-display text-sm font-semibold uppercase tracking-widest transition-all hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.97]"
            >
              Sign In
            </Link>
            <Link
              href="/tryouts"
              className="bg-white hover:bg-off-white text-flag-blue px-8 py-3.5 rounded-full font-display text-sm font-semibold uppercase tracking-widest transition-all hover:-translate-y-0.5 active:scale-[0.97]"
            >
              View Tryout Info
            </Link>
          </div>
        </RevealOnScroll>
      </section>
    </>
  );
}

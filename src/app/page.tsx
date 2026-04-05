"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef } from "react";
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
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let targetTime = 0;
    let currentTime = 0;
    let rafId: number;

    function lerp(a: number, b: number, t: number) {
      return a + (b - a) * t;
    }

    // Smooth animation loop — eases toward target time
    function animate() {
      if (!video) return;
      currentTime = lerp(currentTime, targetTime, 0.04);
      // Avoid tiny updates
      if (Math.abs(currentTime - video.currentTime) > 0.01) {
        video.currentTime = currentTime;
      }
      rafId = requestAnimationFrame(animate);
    }

    function bindScroll() {
      if (!video) return;
      const duration = video.duration || 1;

      function handleScroll() {
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const progress = Math.min(window.scrollY / maxScroll, 1);
        targetTime = progress * duration;
      }

      window.addEventListener("scroll", handleScroll, { passive: true });
      handleScroll();
      rafId = requestAnimationFrame(animate);

      return () => {
        window.removeEventListener("scroll", handleScroll);
        cancelAnimationFrame(rafId);
      };
    }

    // Set to first frame immediately
    video.currentTime = 0;

    if (video.readyState >= 1) {
      const cleanup = bindScroll();
      return cleanup;
    } else {
      let cleanup: (() => void) | undefined;
      const onLoaded = () => {
        video.currentTime = 0;
        cleanup = bindScroll();
      };
      video.addEventListener("loadedmetadata", onLoaded);
      return () => {
        video.removeEventListener("loadedmetadata", onLoaded);
        cleanup?.();
      };
    }
  }, []);

  return (
    <>
      {/* ===== HERO ===== */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 pb-20 overflow-hidden bg-flag-blue">
        {/* Background video */}
        <video
          ref={videoRef}
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/videos/rotatingBaseball.mp4" type="video/mp4" />
        </video>
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-flag-blue/70" />
        {/* Inward gradient mask — fades edges to solid navy */}
        <div className="absolute inset-0" style={{
          background: `
            radial-gradient(ellipse 70% 65% at center, transparent 30%, var(--flag-blue) 100%)
          `,
        }} />
        {/* Center vignette — soft dark spotlight behind text */}
        <div className="absolute inset-0" style={{
          background: `radial-gradient(ellipse 50% 40% at center 45%, rgba(15,27,45,0.5) 0%, transparent 100%)`,
        }} />

        <div className="relative z-10 w-full max-w-3xl mx-auto px-6 md:px-10 text-center">
          {/* Centered headline */}
          <HeroReveal className="text-center">
            <HeroItem>
              <div className="inline-flex items-center gap-2 border border-white/20 rounded px-4 py-1.5 mb-6">
                <span className="text-star-gold font-bold text-xs uppercase tracking-widest font-display">
                  &#9733; 2026 All-Stars Season &#9733;
                </span>
              </div>
            </HeroItem>
            <HeroItem>
              <h1 className="font-hero text-5xl md:text-7xl font-bold text-white uppercase leading-[0.95] tracking-wider mb-6" style={{ textShadow: "0 2px 20px rgba(0,0,0,0.5), 0 4px 40px rgba(0,0,0,0.3)" }}>
                EARN
                <br />
                YOUR
                <br />
                <span className="text-flag-red">STARS.</span>
              </h1>
            </HeroItem>
            <HeroItem>
              <p className="text-white/80 text-lg leading-relaxed max-w-lg mx-auto mb-8" style={{ textShadow: "0 1px 10px rgba(0,0,0,0.4)" }}>
                Irvine PONY All-Stars develops confident, competitive young
                athletes through elite coaching, fair selection, and a
                family-first community.
              </p>
            </HeroItem>
            <HeroItem>
              <div className="flex gap-3 flex-wrap justify-center">
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
            { number: "54", label: "Point Rubric" },
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

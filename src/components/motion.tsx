"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef, type ReactNode } from "react";
import {
  easing,
  duration,
  stagger,
  fadeUp,
  fadeIn,
  hoverLift,
  hoverBounce,
  hoverCard,
  tapPress,
} from "@/lib/motion";

/* ─────────────────────────────────────────────────────────
 * RevealOnScroll
 * Reveals children when they enter the viewport.
 * Default: fade up. Triggers once.
 * ───────────────────────────────────────────────────────── */
interface RevealProps {
  children: ReactNode;
  className?: string;
  variant?: "fadeUp" | "fadeIn";
  delay?: number;
  /** Viewport margin — negative = trigger earlier */
  margin?: string;
}

export function RevealOnScroll({
  children,
  className,
  variant = "fadeUp",
  delay = 0,
  margin = "-80px",
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: margin as `${number}px` });
  const prefersReduced = useReducedMotion();

  const variants = variant === "fadeIn" ? fadeIn : fadeUp;

  if (prefersReduced) {
    return <div ref={ref} className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={false}
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: variants.hidden,
        visible: {
          ...variants.visible,
          transition: {
            ...variants.visible.transition,
            delay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
 * StaggerReveal
 * Staggers children reveal when parent enters viewport.
 * Wrap each child in a <StaggerItem>.
 * ───────────────────────────────────────────────────────── */
interface StaggerRevealProps {
  children: ReactNode;
  className?: string;
  /** Stagger delay between items (seconds) */
  staggerDelay?: number;
  /** Initial delay before first item (seconds) */
  delay?: number;
}

export function StaggerReveal({
  children,
  className,
  staggerDelay = stagger.normal,
  delay = 0,
}: StaggerRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" as `${number}px` });
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div ref={ref} className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={false}
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: delay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

/* StaggerItem — wrap each child inside StaggerReveal */
interface StaggerItemProps {
  children: ReactNode;
  className?: string;
}

export function StaggerItem({ children, className }: StaggerItemProps) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 16 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: duration.normal,
            ease: [0.22, 1, 0.36, 1],
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
 * HoverLiftCard
 * A div that lifts on hover and compresses on tap.
 * GPU-friendly: only transforms opacity/translate.
 * ───────────────────────────────────────────────────────── */
interface HoverLiftCardProps {
  children: ReactNode;
  className?: string;
  as?: "div" | "a";
  href?: string;
}

export function HoverLiftCard({
  children,
  className,
}: HoverLiftCardProps) {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      whileHover={hoverCard}
      whileTap={tapPress}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
 * AnimatedButton
 * Button with press feedback (scale down on click).
 * ───────────────────────────────────────────────────────── */
interface AnimatedButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}

export function AnimatedButton({
  children,
  className,
  onClick,
  type = "button",
  disabled,
}: AnimatedButtonProps) {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return (
      <button type={type} className={className} onClick={onClick} disabled={disabled}>
        {children}
      </button>
    );
  }

  return (
    <motion.button
      type={type}
      className={className}
      onClick={onClick}
      disabled={disabled}
      whileHover={hoverBounce}
      whileTap={tapPress}
    >
      {children}
    </motion.button>
  );
}

/* ─────────────────────────────────────────────────────────
 * HeroReveal
 * Specialized reveal for hero sections.
 * Staggers: badge → headline → subtext → CTA
 * ───────────────────────────────────────────────────────── */
interface HeroRevealProps {
  children: ReactNode;
  className?: string;
}

export function HeroReveal({ children, className }: HeroRevealProps) {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={false}
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: stagger.relaxed,
            delayChildren: 0.2,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function HeroItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 24 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: duration.slow,
            ease: [0.22, 1, 0.36, 1],
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
 * CountUp
 * Animates a number counting up when in view.
 * ───────────────────────────────────────────────────────── */
interface CountUpProps {
  value: number;
  className?: string;
  suffix?: string;
}

export function CountUp({ value, className, suffix = "" }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const prefersReduced = useReducedMotion();

  if (prefersReduced || !isInView) {
    return (
      <span ref={ref} className={className}>
        {isInView ? `${value}${suffix}` : "0"}
      </span>
    );
  }

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.span
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: duration.fast }}
      >
        {value}{suffix}
      </motion.span>
    </motion.span>
  );
}

/**
 * Motion Design Tokens
 *
 * Centralized timing, easing, and animation constants.
 * All motion across the site should reference these tokens.
 */

/* ─── Easing Curves ─── */
export const easing = {
  /** Smooth deceleration — default for most transitions */
  smoothOut: [0.22, 1, 0.36, 1] as const,
  /** Snappy entrance — for reveals and appearances */
  snappy: [0.16, 1, 0.3, 1] as const,
  /** Gentle — for hover states and micro-interactions */
  gentle: [0.4, 0, 0.2, 1] as const,
  /** Spring-like — for button feedback */
  bounce: [0.34, 1.56, 0.64, 1] as const,
} as const;

/* ─── Duration Tokens (seconds) ─── */
export const duration = {
  /** Instant feedback — button press, toggle */
  instant: 0.1,
  /** Micro — hover lifts, small state changes */
  micro: 0.2,
  /** Fast — card transitions, badge animations */
  fast: 0.3,
  /** Normal — page content reveals, section transitions */
  normal: 0.45,
  /** Slow — page transitions, hero reveals */
  slow: 0.6,
} as const;

/* ─── Stagger Tokens (seconds) ─── */
export const stagger = {
  /** Tight — for list items, badges */
  tight: 0.04,
  /** Normal — for cards, sections */
  normal: 0.08,
  /** Relaxed — for hero elements, large reveals */
  relaxed: 0.1,
} as const;

/* ─── Common Animation Variants ─── */
export const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.normal, ease: easing.smoothOut },
  },
} as const;

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: duration.normal, ease: easing.smoothOut },
  },
} as const;

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: duration.fast, ease: easing.snappy },
  },
} as const;

export const slideInLeft = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: duration.normal, ease: easing.smoothOut },
  },
} as const;

export const slideInRight = {
  hidden: { opacity: 0, x: 30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: duration.normal, ease: easing.smoothOut },
  },
} as const;

/* ─── Hover Presets ─── */
export const hoverLift = {
  y: -3,
  transition: { duration: duration.micro, ease: easing.gentle },
} as const;

export const hoverScale = {
  scale: 1.02,
  transition: { duration: duration.micro, ease: easing.gentle },
} as const;

export const tapPress = {
  scale: 0.97,
  transition: { duration: duration.instant, ease: easing.bounce },
} as const;

/* ─── Playful Hover Presets (public pages) ─── */
export const hoverBounce = {
  scale: 1.04,
  transition: { duration: duration.micro, ease: easing.bounce },
} as const;

export const hoverCard = {
  scale: 1.02,
  rotate: 1,
  transition: { duration: duration.fast, ease: easing.smoothOut },
} as const;

export const hoverStar = {
  rotate: 15,
  transition: { duration: duration.fast, ease: easing.gentle },
} as const;

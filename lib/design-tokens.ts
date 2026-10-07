/**
 * Recall design tokens — single source of truth.
 *
 * Visual concept: "preserved in amber." Recall keeps the thing AND the
 * thought you had about it, intact, the way amber holds what's inside it.
 * That's where the warm resin-gold accent against a near-black ground
 * comes from — it's not a generic dark-mode accent, it's the metaphor.
 *
 * Components should consume these tokens (via the CSS variables in
 * globals.css, or these exports directly in TS) rather than hardcoding
 * hex/px values.
 */

export const color = {
  bg: {
    0: "#0D0B09", // deepest layer — app shell background
    1: "#151109", // raised panels
    2: "#1C170F", // cards, popovers
    3: "#251E14", // highest elevation (modals, command palette)
  },
  surface: "#1A1510",
  border: {
    subtle: "rgba(245, 240, 232, 0.08)",
    default: "rgba(245, 240, 232, 0.14)",
    accent: "rgba(227, 165, 72, 0.35)",
  },
  text: {
    primary: "#F3EDE2",
    secondary: "#B7AA96",
    muted: "#7C7263",
    onAccent: "#1A1208",
  },
  accent: {
    DEFAULT: "#E3A548", // resin amber — the one signature accent
    dim: "#B5813A",
    glow: "rgba(227, 165, 72, 0.35)",
  },
  state: {
    success: "#7CAE8C",
    warning: "#D9C15A",
    danger: "#D9705C",
  },
} as const;

export const spacing = {
  0: "0px",
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  8: "32px",
  10: "40px",
  12: "48px",
  16: "64px",
  20: "80px",
  24: "96px",
} as const;

export const radius = {
  sm: "6px",
  md: "10px",
  lg: "16px",
  xl: "22px",
  full: "9999px",
} as const;

export const shadow = {
  ambient: "0 1px 2px rgba(0,0,0,0.4), 0 12px 32px -8px rgba(0,0,0,0.5)",
  elevated: "0 4px 12px rgba(0,0,0,0.5), 0 24px 48px -12px rgba(0,0,0,0.6)",
  glow: "0 0 0 1px rgba(227,165,72,0.25), 0 0 24px rgba(227,165,72,0.18)",
  focus: "0 0 0 2px #0D0B09, 0 0 0 4px #E3A548",
} as const;

export const type = {
  family: {
    display: "var(--font-display)", // Fraunces — editorial serif, the "amber" of the type system
    body: "var(--font-body)", // Inter — legible workhorse
  },
  scale: {
    xs: { size: "12px", line: "16px" },
    sm: { size: "14px", line: "20px" },
    base: { size: "16px", line: "24px" },
    lg: { size: "18px", line: "28px" },
    xl: { size: "22px", line: "30px" },
    "2xl": { size: "28px", line: "36px" },
    "3xl": { size: "36px", line: "42px" },
    "4xl": { size: "48px", line: "54px" },
    "5xl": { size: "64px", line: "68px" },
  },
} as const;

export const motion = {
  duration: {
    fast: "120ms",
    base: "220ms",
    slow: "420ms",
  },
  easing: {
    out: "cubic-bezier(0.16, 1, 0.3, 1)",
    inOut: "cubic-bezier(0.65, 0, 0.35, 1)",
    spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  },
} as const;

export const tokens = { color, spacing, radius, shadow, type, motion } as const;
export type Tokens = typeof tokens;

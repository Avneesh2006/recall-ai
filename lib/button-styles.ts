import { cva } from "class-variance-authority";

export const buttonStyles = cva(
  // No ring-offset: buttons render on many different surfaces (bg-0
  // through bg-3 depending on context — page, card, dialog), and an
  // offset ring's gap shows the *offset color*, which would mismatch
  // whatever surface the button actually sits on. A ring flush against
  // the button edge stays correct everywhere without knowing the
  // surface in advance (Section 21 — visible focus rings, never just
  // `outline: none`).
  "relative inline-flex items-center justify-center gap-2 rounded-md font-body font-medium transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-accent text-text-onaccent hover:bg-accent-dim",
        secondary: "border border-border bg-bg-2 text-text-primary hover:bg-bg-3",
        ghost: "text-text-secondary hover:bg-bg-2 hover:text-text-primary",
        danger: "bg-danger text-text-onaccent hover:brightness-90",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

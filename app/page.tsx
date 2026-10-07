import { buttonStyles } from "@/lib/button-styles";
import { Tilt3DCard } from "@/components/Tilt3DCard";
import { GlassPanel } from "@/components/GlassPanel";
import Link from "next/link";

const reasonChips = ["Inspiration", "Use in a Project", "Content Idea", "Reference"];

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col px-6">
      <header className="flex items-center justify-between py-6">
        <span className="font-display text-lg tracking-tight text-text-primary">Recall</span>
        <nav className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-md px-3 py-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
          >
            Log in
          </Link>
          <Link href="/signup" className={buttonStyles({ size: "sm" })}>
            Get started
          </Link>
        </nav>
      </header>

      <section className="grid flex-1 items-center gap-16 py-16 md:grid-cols-[1.1fr_0.9fr] md:py-24">
        <div>
          <h1 className="max-w-lg font-display text-4xl leading-[1.05] text-text-primary md:text-5xl">
            Don&apos;t just save what you found.
            <br />
            <span className="text-accent-text">Remember why you saved it.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-text-secondary">
            Recall keeps the reel, the repo, the reference image — and the thought you had when
            you saved it. Months later, find not just the item, but the memory.
          </p>
          <div className="mt-8 flex items-center gap-4">
            <Link href="/signup" className={buttonStyles({ size: "lg" })}>
              Start remembering
            </Link>
            <span className="text-sm text-text-muted">Free — no credit card</span>
          </div>
        </div>

        <Tilt3DCard className="p-6">
          <p className="text-xs uppercase tracking-wide text-text-muted">Saved 2 minutes ago</p>
          <h3 className="mt-2 font-display text-xl text-text-primary">
            Cinematic color-grading tutorial
          </h3>
          <GlassPanel className="mt-4 border-accent/30 bg-accent/10 p-4">
            <p className="text-xs font-medium text-accent-text">What was I thinking?</p>
            <p className="mt-1 text-sm italic text-text-primary">
              &ldquo;For the reel cut — that warm-shadow grade I keep meaning to try.&rdquo;
            </p>
          </GlassPanel>
          <div className="mt-4 flex flex-wrap gap-2">
            {reasonChips.map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-border px-3 py-1 text-xs text-text-secondary"
              >
                {chip}
              </span>
            ))}
          </div>
        </Tilt3DCard>
      </section>
    </main>
  );
}

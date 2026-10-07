"use client";

import { buttonStyles } from "@/lib/button-styles";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-display text-3xl text-text-primary">Something didn&apos;t load.</h1>
      <p className="max-w-sm text-text-secondary">
        This part of Recall hit a snag. Your saved items are safe — try again.
      </p>
      <button onClick={() => reset()} className={buttonStyles({ className: "mt-2" })}>
        Try again
      </button>
    </main>
  );
}

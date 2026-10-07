import { buttonStyles } from "@/lib/button-styles";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-display text-sm uppercase tracking-widest text-text-muted">404</p>
      <h1 className="font-display text-3xl text-text-primary">That memory doesn&apos;t exist.</h1>
      <p className="max-w-sm text-text-secondary">
        The page you&apos;re looking for isn&apos;t here. It might have been moved or deleted.
      </p>
      <Link href="/" className={buttonStyles({ variant: "secondary", className: "mt-2" })}>
        Back to Recall
      </Link>
    </main>
  );
}

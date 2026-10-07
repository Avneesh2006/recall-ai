import { GlassPanel } from "@/components/GlassPanel";
import Link from "next/link";
import type { ReactNode } from "react";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <Link href="/" className="mb-8 font-display text-xl text-text-primary">
        Recall
      </Link>
      <GlassPanel elevated className="w-full max-w-sm p-8">
        <h1 className="font-display text-2xl text-text-primary">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </GlassPanel>
      {footer && <div className="mt-6 text-sm text-text-secondary">{footer}</div>}
    </main>
  );
}

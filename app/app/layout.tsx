import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/auth/actions";
import { AnimatedButton } from "@/components/AnimatedButton";
import { AppSidebar } from "@/components/AppSidebar";
import { BottomTabBar } from "@/components/BottomTabBar";
import { SaveDialogProvider } from "@/components/SaveDialogProvider";
import { ToastProvider } from "@/components/ToastProvider";
import { CommandPaletteProvider, CommandPaletteTrigger } from "@/components/CommandPaletteProvider";
import { SaveTriggerButton } from "@/components/SaveTriggerButton";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Belt-and-suspenders: middleware already protects /app/*, but a Server
  // Component should never trust that alone.
  if (!user) redirect("/login");

  return (
    <Suspense>
      <ToastProvider>
      <SaveDialogProvider>
      <CommandPaletteProvider>
        {/* Section 22: a persistent sidebar on desktop/tablet (AppSidebar,
            self-hiding below `md`) and a distinct bottom-tab layout on
            mobile (BottomTabBar, self-hiding at `md` and up) — not the
            same nav just squeezed smaller. */}
        {/* Visually hidden until focused — the first Tab stop, so a keyboard
            user can jump past the sidebar/header straight to page content
            instead of tabbing through nav links on every single page load
            (Section 21). */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-text-onaccent"
        >
          Skip to content
        </a>
        <div className="flex min-h-dvh">
          <AppSidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <header className="flex items-center justify-between border-b border-border-subtle px-4 py-3 md:px-6 md:py-4">
              <Link href="/app" className="font-display text-lg text-text-primary md:hidden">
                Recall
              </Link>
              <span className="hidden md:block" aria-hidden="true" />
              <div className="flex items-center gap-2 md:gap-4">
                <CommandPaletteTrigger />
                <span className="hidden md:inline">
                  <SaveTriggerButton />
                </span>
                <span className="hidden text-sm text-text-secondary md:inline">{user.email}</span>
                <form action={signOut} className="hidden md:block">
                  <AnimatedButton variant="ghost" size="sm" type="submit">
                    Log out
                  </AnimatedButton>
                </form>
              </div>
            </header>
            {/* pb-24 clears the fixed BottomTabBar on mobile; md: reverts to normal padding. */}
            <main id="main-content" className="flex-1 px-4 py-6 pb-24 md:px-6 md:py-8 md:pb-8">{children}</main>
          </div>
          <BottomTabBar userEmail={user.email ?? ""} signOutAction={signOut} />
        </div>
      </CommandPaletteProvider>
      </SaveDialogProvider>
      </ToastProvider>
    </Suspense>
  );
}

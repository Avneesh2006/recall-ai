"use client";

import { AuthShell } from "@/components/AuthShell";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { FormError } from "@/components/FormError";
import { AnimatedButton } from "@/components/AnimatedButton";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Submits via the browser Supabase client, not a Server Action.
 *
 * Root cause this fixes: Supabase's password-recovery email commonly
 * delivers the session as a URL *hash fragment*
 * (#access_token=...&type=recovery) rather than a ?code= query param.
 * Hash fragments are never sent in HTTP requests — the server never
 * sees them — so a Server Action here had no session to act on no
 * matter how correctly /auth/callback was configured. The browser
 * client (lib/supabase/client.ts, via @supabase/ssr) auto-detects that
 * hash on load and establishes a session; submitting through that same
 * client is what actually sees it, regardless of whether the link used
 * a hash fragment or the ?code= flow through /auth/callback.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState<"checking" | "ready" | "invalid">("checking");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    // onAuthStateChange fires PASSWORD_RECOVERY once the client finishes
    // processing the link (hash fragment or an already-cookied session
    // from /auth/callback). getSession() covers the case where that
    // already happened before this listener was attached.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady("ready");
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady("ready");
    });
    // If neither fires quickly, the link is missing/invalid/expired.
    const timeout = setTimeout(() => setReady((r) => (r === "checking" ? "invalid" : r)), 2500);
    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  async function handleSubmit() {
    setError(null);
    if (password.length < 8) return setError("Password must be at least 8 characters");
    if (password !== confirmPassword) return setError("Passwords don't match");

    setSaving(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (updateError) return setError(updateError.message);
    router.push("/login");
  }

  if (ready === "checking") {
    return (
      <AuthShell title="Checking your link…">
        <p className="text-sm text-text-secondary">One moment.</p>
      </AuthShell>
    );
  }

  if (ready === "invalid") {
    return (
      <AuthShell title="This link isn't valid" subtitle="It may have expired, or already been used.">
        <AnimatedButton className="w-full" onClick={() => router.push("/forgot-password")}>
          Send a new link
        </AnimatedButton>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Set a new password">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit();
        }}
        className="flex flex-col gap-4"
      >
        <div>
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        <FormError message={error ?? undefined} />
        <AnimatedButton type="submit" disabled={saving} className="w-full">
          {saving ? "Saving…" : "Save new password"}
        </AnimatedButton>
      </form>
    </AuthShell>
  );
}

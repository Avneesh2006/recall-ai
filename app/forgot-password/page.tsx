"use client";

import { AuthShell } from "@/components/AuthShell";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { SubmitButton } from "@/components/SubmitButton";
import { FormError } from "@/components/FormError";
import { forgotPassword, type AuthActionState } from "@/lib/auth/actions";
import Link from "next/link";
import { useFormState } from "react-dom";

const initialState: AuthActionState = {};

export default function ForgotPasswordPage() {
  const [state, formAction] = useFormState(forgotPassword, initialState);

  if (state.success) {
    return (
      <AuthShell title="Check your email" subtitle="If that account exists, we've emailed it.">
        <p className="text-sm text-text-secondary">
          Follow the link in the email to set a new password.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll email you a reset link."
      footer={
        <Link href="/login" className="text-accent-text hover:underline">
          Back to log in
        </Link>
      }
    >
      <form action={formAction} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <FormError message={state.error} />
        <SubmitButton pendingLabel="Sending…">Send reset link</SubmitButton>
      </form>
    </AuthShell>
  );
}

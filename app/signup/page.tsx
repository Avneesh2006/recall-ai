"use client";

import { AuthShell } from "@/components/AuthShell";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { SubmitButton } from "@/components/SubmitButton";
import { FormError } from "@/components/FormError";
import { signUp, type AuthActionState } from "@/lib/auth/actions";
import Link from "next/link";
import { useFormState } from "react-dom";

const initialState: AuthActionState = {};

export default function SignupPage() {
  const [state, formAction] = useFormState(signUp, initialState);

  if (state.success) {
    return (
      <AuthShell title="Check your email" subtitle="Almost there.">
        <p className="text-sm text-text-secondary">
          We sent a confirmation link to your inbox. Click it to activate your account, then log
          in.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start remembering why you saved things."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-accent-text hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form action={formAction} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="displayName">Name</Label>
          <Input id="displayName" name="displayName" autoComplete="name" required />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
          />
        </div>
        <FormError message={state.error} />
        <SubmitButton pendingLabel="Creating account…">Create account</SubmitButton>
      </form>
    </AuthShell>
  );
}

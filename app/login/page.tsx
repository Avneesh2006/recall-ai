"use client";

import { AuthShell } from "@/components/AuthShell";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { SubmitButton } from "@/components/SubmitButton";
import { FormError } from "@/components/FormError";
import { signIn, type AuthActionState } from "@/lib/auth/actions";
import Link from "next/link";
import { useFormState } from "react-dom";

const initialState: AuthActionState = {};

export default function LoginPage() {
  const [state, formAction] = useFormState(signIn, initialState);

  return (
    <AuthShell
      title="Welcome back"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-accent-text hover:underline">
            Sign up
          </Link>
        </>
      }
    >
      <form action={formAction} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="mb-0">
              Password
            </Label>
            <Link href="/forgot-password" className="text-xs text-text-muted hover:text-accent-text">
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="mt-1.5"
          />
        </div>
        <FormError message={state.error} />
        <SubmitButton pendingLabel="Logging in…">Log in</SubmitButton>
      </form>
    </AuthShell>
  );
}

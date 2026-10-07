"use client";

import { AnimatedButton } from "@/components/AnimatedButton";
import { useFormStatus } from "react-dom";
import type { ComponentProps } from "react";

export function SubmitButton({
  children,
  pendingLabel,
  ...props
}: ComponentProps<typeof AnimatedButton> & { pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <AnimatedButton type="submit" disabled={pending} className="w-full" {...props}>
      {pending ? pendingLabel : children}
    </AnimatedButton>
  );
}

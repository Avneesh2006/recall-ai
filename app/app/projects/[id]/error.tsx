"use client";

import { ErrorState } from "@/components/LoadingErrorStates";
import { useEffect } from "react";

export default function ProjectDetailError({
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

  return <ErrorState message="Couldn't load this project." onRetry={reset} />;
}

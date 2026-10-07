"use client";

import { ErrorState } from "@/components/LoadingErrorStates";
import { useEffect } from "react";

export default function ItemDetailError({
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
    <ErrorState message="Couldn't load this memory. It might have been deleted." onRetry={reset} />
  );
}

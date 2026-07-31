"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-sm">
        <h2 className="text-lg font-bold">Coś poszło nie tak</h2>
        <p className="text-sm text-muted-foreground">
          Wystąpił nieoczekiwany błąd. Spróbuj ponownie.
        </p>
        <button
          onClick={reset}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400 transition-colors"
        >
          Spróbuj ponownie
        </button>
      </div>
    </div>
  );
}

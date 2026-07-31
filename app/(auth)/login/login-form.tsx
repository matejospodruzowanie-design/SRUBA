"use client";

import { useActionState } from "react";
import { login } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className="space-y-4">
      {state?.message && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {state.message}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-muted-foreground">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="twoj@email.com"
          required
          className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
        />
        {state?.errors?.email && (
          <p className="text-xs text-red-400">{state.errors.email[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-muted-foreground">
          Hasło
        </label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="Min. 8 znaków"
          required
          className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
        />
        {state?.errors?.password && (
          <p className="text-xs text-red-400">{state.errors.password[0]}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-50 transition-colors"
      >
        {pending ? "Logowanie..." : "Zaloguj się"}
      </button>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { register } from "./actions";

export function RegisterForm() {
  const [state, action, pending] = useActionState(register, undefined);

  return (
    <form action={action} className="space-y-4">
      {state?.message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            state.message.includes("sukces")
              ? "bg-green-500/10 border border-green-500/20 text-green-400"
              : "bg-red-500/10 border border-red-500/20 text-red-400"
          }`}
        >
          {state.message}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium text-muted-foreground">
          Imię
        </label>
        <input
          id="name"
          name="name"
          type="text"
          placeholder="Twoje imię"
          className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
        />
        {state?.errors?.name && (
          <p className="text-xs text-red-400">{state.errors.name[0]}</p>
        )}
      </div>

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
          placeholder="Minimum 8 znaków"
          required
          className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
        />
        {state?.errors?.password && (
          <div className="text-xs text-red-400">
            <p>Hasło musi:</p>
            <ul className="list-disc pl-4">
              {state.errors.password.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-50 transition-colors"
      >
        {pending ? "Tworzenie konta..." : "Zarejestruj się"}
      </button>
    </form>
  );
}

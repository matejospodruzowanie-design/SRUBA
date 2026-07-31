# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

ŚRUBA is a Polish-language fitness PWA built with Next.js 16 (App Router + Turbopack), React 19, Prisma 7 + SQLite/libSQL, and Tailwind CSS 4. It supports Capacitor (Android) and PWA installation.

## Commands

```bash
npm run dev           # Start dev server (Turbopack)
npm run build         # Production build + type check
npm run lint          # ESLint
npm run db:generate   # Regenerate Prisma client
npm run db:push       # Push schema to DB (no migrations)
npm run db:seed       # Seed local DB with ~40 exercises
npm run db:studio     # Open Prisma Studio
```

There are no tests yet.

## Architecture

### Route groups
- `app/(auth)/` — login, register. Public.
- `app/(dashboard)/` — all authenticated pages wrapped in sidebar + mobile nav layout.
- `app/api/` — REST endpoints (only `/api/exercises/search` currently).

### Auth
JWT stored in httpOnly cookie (`sruba-token`), signed with `jose` HS256. 30-day expiry.

- **`lib/auth.ts`** — `createToken`, `verifyToken`, `getSession()`, `setSessionCookie()`, `clearSessionCookie()`.
- **`lib/session.ts`** — `getUser()`: wraps `getSession()` in React `cache()`, calls `redirect("/login")` if unauthenticated. Use this in server components/pages. Returns full user with XP/level/rank/goal fields.
- **`getSession()`** — use in API routes where redirect is not appropriate (returns `null` instead).

### Database
Prisma 7 with `@prisma/adapter-libsql`. Dev uses local `file:./dev.db`; production uses Turso (`TURSO_URL` + `TURSO_AUTH_TOKEN` env vars). Singleton `prisma` client exported from `lib/db.ts`.

Key models: `User`, `Exercise`, `ExerciseMuscle`, `Workout`, `WorkoutSet`, `Routine`, `RoutineExercise`, `PersonalRecord`, `BodyMeasurement`, `MuscleFatigue`, `Achievement`, `UserAchievement`.

### Server Actions → data flow
All mutations use Server Actions (`"use server"` in `actions.ts` files). Pattern:
1. `getUser()` for auth
2. Zod `safeParse` for input validation → return `{ error: string }` on failure
3. Prisma mutation
4. `revalidatePath()` on all affected routes
5. Return `{ ok: true, data }` or `{ error }`

**Never throw from actions** — always return error objects. Clients check `"error" in result`.

### Client-side data flow
- **`useOptimistic`** — used in `set-logger.tsx` for instant set display before server confirms.
- **`startTransition`** — wraps all server action calls to keep UI responsive.
- **`sonner`** — `toast.error()` / `toast.success()` for all error feedback. Import from `"sonner"`.
- **`useState` + callback props** — parent components (`ActiveWorkout`) sync confirmed server state via `onSetConfirmed`, `onUpdateConfirmed`, `onDeleteConfirmed` callbacks.

### Reusable constants
`lib/constants.ts` exports: `MUSCLE_GROUPS`, `EQUIPMENT`, `CATEGORIES`, `GOALS`, `EXPERIENCE_LEVELS`, `RANKS`, `RANK_LABELS` (derived), `RANK_COLORS` (derived). **Always import `RANK_LABELS`/`RANK_COLORS` from here** — do not redefine them locally.

### Next.js 16 specifics
- `searchParams` and `params` in page components are **Promises** — must be awaited: `const { id } = await params`.
- The bundled docs are at `node_modules/next/dist/docs/` — read them before using unfamiliar APIs.
- No `cacheComponents` in next.config.ts.
- `turbopack.resolveAlias` needed for Prisma client resolution in dev.

## Key patterns

### Adding a server action
```typescript
// In actions.ts
"use server";
import { z } from "zod";
const schema = z.object({ ... });
export async function myAction(input: MyInput) {
  const user = await getUser();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: "Komunikat po polsku" };
  // ... mutation ...
  revalidatePath("/relevant-path");
  return { ok: true, data };
}
```

### Calling from a client component
```typescript
const [isPending, startTransition] = useTransition();
startTransition(async () => {
  try {
    const result = await myAction(input);
    if ("error" in result) { toast.error(result.error); return; }
    // handle success
  } catch { toast.error("Nie udało się..."); }
});
```

### Polish language rules
All user-facing strings are in Polish. Pluralization: `1 seria`, `2-4 serie`, `5+ serii`. Same for `ćwiczenie` (1), `ćwiczenia` (2-4), `ćwiczeń` (5+). Use explicit conditionals rather than a generic pluralize helper for consistency.

## Important gotchas

1. **SQLite has no `mode: "insensitive"`** — Prisma emulates it with `LOWER()` but only for ASCII. Polish diacritics (ś, ą, ę, ł, ń, ó, ż, ź, ć) won't match case-insensitively. Use `mode: "insensitive"` anyway as it helps for basic ASCII.
2. **`@@unique` constraints on SQLite are immediate** — reordering items with a `@@unique([parent, position])` constraint fails because temporary collisions can't be deferred. Use the two-phase pattern: shift positions by +10000, then set final positions.
3. **`weightKg` can be 0 for bodyweight exercises** — Zod schemas must use `.min(0)` not `.positive()`.
4. **Warmup sets should be excluded** from PR checks, progression suggestions, recovery fatigue, and exercise progress charts. Always add `isWarmup: false` filter when querying training data.
5. **`finishWorkout` must do side-effects BEFORE `isActive: false`** — if XP/streak writes fail, the workout stays active and retryable. The `isActive` flag update goes last.
6. **Optimistic set IDs** are `"optimistic-" + Date.now() + "-" + rowIndex`. Match them by `s.id.startsWith("optimistic") && s.exerciseId`, NOT by `s.id.includes(setNumber)` (digit-substring false positives).
7. **`startedAt` in ActiveWorkout** must be updated when the workout actually starts (in `handleStart`), not at page mount. Use `setStartedAt(new Date())`.
8. **Template plans must populate `RoutineExercise` entries** — use `createRoutineFromTemplate` which looks up exercises by name and creates slots. Plain `createRoutine` with `source: "template"` creates an empty plan.
9. **Exercise visibility**: authenticated users see built-in + their own custom exercises (`{ OR: [{ isCustom: false }, { userId }] }`). Unauthenticated users see only built-in.

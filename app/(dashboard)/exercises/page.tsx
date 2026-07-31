import { prisma } from "@/lib/db";
import { getUser } from "@/lib/session";
import { MUSCLE_GROUPS, EQUIPMENT } from "@/lib/constants";
import Link from "next/link";
import { Dumbbell, Search } from "lucide-react";
import { ExerciseListClient } from "@/components/exercises/exercise-list-client";

export default async function ExercisesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await getUser();
  const params = await searchParams;
  const muscle = typeof params.muscle === "string" ? params.muscle : undefined;
  const equipment = typeof params.equipment === "string" ? params.equipment : undefined;
  const query = typeof params.q === "string" ? params.q : undefined;

  // Privacy: show built-in exercises + user's own custom exercises
  const visibilityFilter = { OR: [{ isCustom: false }, { userId: user.id }] };

  const where: Record<string, unknown> = {
    AND: [visibilityFilter],
  };
  if (muscle) {
    where.muscles = { some: { muscleGroup: muscle } };
  }
  if (equipment) {
    where.equipment = equipment;
  }
  if (query) {
    where.name = { contains: query, mode: "insensitive" as const };
  }

  const exercises = await prisma.exercise.findMany({
    where,
    select: {
      id: true,
      name: true,
      equipment: true,
      isCustom: true,
      videoUrl: true,
      muscles: { select: { muscleGroup: true, isPrimary: true } },
    },
    take: 100,
    orderBy: { name: "asc" },
  });

  const muscleCounts = await prisma.exerciseMuscle.groupBy({
    by: ["muscleGroup"],
    _count: true,
  });

  // Helper: build filter URL preserving all current params
  const filterHref = (overrides: { muscle?: string | null; equipment?: string | null; q?: string | null }) => {
    const p = new URLSearchParams();
    const qVal = overrides.q !== undefined ? overrides.q : query;
    const mVal = overrides.muscle !== undefined ? overrides.muscle : muscle;
    const eVal = overrides.equipment !== undefined ? overrides.equipment : equipment;
    if (qVal) p.set("q", qVal);
    if (mVal) p.set("muscle", mVal);
    if (eVal) p.set("equipment", eVal);
    const qs = p.toString();
    return qs ? `/exercises?${qs}` : "/exercises";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Biblioteka ćwiczeń</h1>
        <p className="text-muted-foreground mt-1">
          Przeglądaj ćwiczenia z podziałem na partie mięśniowe
        </p>
      </div>

      {/* Search — preserves muscle & equipment via hidden inputs */}
      <form className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          name="q"
          type="text"
          placeholder="Szukaj ćwiczenia..."
          defaultValue={query}
          className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2.5 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-amber-500/50"
        />
        {muscle && <input type="hidden" name="muscle" value={muscle} />}
        {equipment && <input type="hidden" name="equipment" value={equipment} />}
      </form>

      {/* Muscle group filters */}
      <div className="flex flex-wrap gap-2">
        <Link
          href={filterHref({ muscle: null })}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            !muscle
              ? "bg-amber-500 text-black"
              : "bg-card border border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          Wszystkie
        </Link>
        {MUSCLE_GROUPS.map((m) => {
          const count = muscleCounts.find((mc) => mc.muscleGroup === m.id)?._count ?? 0;
          const isActive = muscle === m.id;
          return (
            <Link
              key={m.id}
              href={filterHref({ muscle: isActive ? null : m.id })}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-amber-500 text-black"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {m.label} ({count})
            </Link>
          );
        })}
      </div>

      {/* Equipment filters */}
      <div className="flex flex-wrap gap-2">
        {EQUIPMENT.map((eq) => {
          const isActive = equipment === eq.id;
          return (
            <Link
              key={eq.id}
              href={filterHref({ equipment: isActive ? null : eq.id })}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-amber-500 text-black"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {eq.label}
            </Link>
          );
        })}
      </div>

      {/* Exercise list — client component with modal and delete */}
      <ExerciseListClient exercises={exercises} />
    </div>
  );
}

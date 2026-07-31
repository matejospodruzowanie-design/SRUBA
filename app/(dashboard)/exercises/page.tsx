import { prisma } from "@/lib/db";
import { MUSCLE_GROUPS, EQUIPMENT } from "@/lib/constants";
import Link from "next/link";
import { Dumbbell, Search } from "lucide-react";

export default async function ExercisesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const muscle = typeof params.muscle === "string" ? params.muscle : undefined;
  const equipment = typeof params.equipment === "string" ? params.equipment : undefined;
  const query = typeof params.q === "string" ? params.q : undefined;

  const where: Record<string, unknown> = {};
  if (muscle) {
    where.muscles = { some: { muscleGroup: muscle } };
  }
  if (equipment) {
    where.equipment = equipment;
  }
  if (query) {
    where.name = { contains: query };
  }

  const exercises = await prisma.exercise.findMany({
    where,
    include: { muscles: true },
    take: 100,
    orderBy: { name: "asc" },
  });

  const muscleCounts = await prisma.exerciseMuscle.groupBy({
    by: ["muscleGroup"],
    _count: true,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Biblioteka ćwiczeń</h1>
        <p className="text-muted-foreground mt-1">
          Przeglądaj ćwiczenia z podziałem na partie mięśniowe
        </p>
      </div>

      {/* Search */}
      <form className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          name="q"
          type="text"
          placeholder="Szukaj ćwiczenia..."
          defaultValue={query}
          className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2.5 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-amber-500/50"
        />
      </form>

      {/* Muscle group filters */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/exercises"
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
              href={`/exercises?muscle=${m.id}`}
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
        {EQUIPMENT.map((eq) => (
          <Link
            key={eq.id}
            href={`/exercises?equipment=${eq.id}${muscle ? `&muscle=${muscle}` : ""}`}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              equipment === eq.id
                ? "bg-amber-500 text-black"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {eq.label}
          </Link>
        ))}
      </div>

      {/* Exercise list */}
      {exercises.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Dumbbell className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Brak ćwiczeń dla wybranych filtrów</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          {exercises.map((ex) => (
            <Link
              key={ex.id}
              href={`/exercises/${ex.id}`}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 hover:border-amber-500/20 transition-all"
            >
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <Dumbbell className="h-4 w-4 text-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{ex.name}</p>
                <p className="text-xs text-muted-foreground">
                  {ex.muscles.map((m) => m.muscleGroup).join(", ")}
                  {ex.equipment ? ` · ${EQUIPMENT.find((e) => e.id === ex.equipment)?.label || ex.equipment}` : ""}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

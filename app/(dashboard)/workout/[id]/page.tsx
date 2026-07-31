import { prisma } from "@/lib/db";
import { getUser } from "@/lib/session";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { ArrowLeft, Clock, Flame, Dumbbell } from "lucide-react";
import { formatDuration, setVolume } from "@/lib/fitness-utils";
import { EQUIPMENT } from "@/lib/constants";
import { getExerciseImage } from "@/lib/exercise-images";
import { SaveAsPlanButton } from "./save-as-plan-button";
import { DeleteWorkoutButton } from "./delete-workout-button";

export default async function WorkoutDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUser();

  const workout = await prisma.workout.findFirst({
    where: { id, userId: user.id },
    include: {
      sets: {
        include: { exercise: { include: { muscles: true } } },
        orderBy: [{ exerciseId: "asc" }, { setNumber: "asc" }],
      },
    },
  });

  if (!workout) notFound();

  // Group sets by exercise
  const exerciseGroups = new Map<string, typeof workout.sets>();
  for (const set of workout.sets) {
    const existing = exerciseGroups.get(set.exerciseId);
    if (existing) {
      existing.push(set);
    } else {
      exerciseGroups.set(set.exerciseId, [set]);
    }
  }

  const totalVolume = workout.sets.reduce(
    (sum, s) => sum + setVolume(s.weightKg, s.reps),
    0
  );
  const prCount = workout.sets.filter((s) => s.isPR).length;

  return (
    <div className="space-y-6 max-w-2xl">
      <Link
        href="/history"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Powrót do historii
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{workout.name}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
            <span>
              {format(new Date(workout.startedAt), "d MMMM yyyy, HH:mm", {
                locale: pl,
              })}
            </span>
            {workout.durationSeconds && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {formatDuration(workout.durationSeconds)}
              </span>
            )}
            {prCount > 0 && (
              <span className="flex items-center gap-1 text-amber-400">
                <Flame className="h-3.5 w-3.5" /> {prCount} rekordów
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <SaveAsPlanButton workoutId={workout.id} />
          <DeleteWorkoutButton workoutId={workout.id} />
        </div>
      </div>

      {/* Summary card */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-xs text-muted-foreground">Serii</p>
          <p className="text-xl font-bold mt-1">{workout.sets.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-xs text-muted-foreground">Objętość</p>
          <p className="text-xl font-bold mt-1">{Math.round(totalVolume)} kg</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-xs text-muted-foreground">Rekordów</p>
          <p className="text-xl font-bold mt-1 text-amber-400">{prCount}</p>
        </div>
      </div>

      {/* Exercises */}
      <div className="space-y-3">
        {Array.from(exerciseGroups.entries()).map(([exerciseId, sets]) => (
          <div
            key={exerciseId}
            className="rounded-xl border border-border bg-card overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-border flex items-center gap-3">
              {(() => {
                const ex = sets[0].exercise;
                const primaryMuscle = ex.muscles?.find((m: { isPrimary: boolean }) => m.isPrimary)?.muscleGroup;
                const img = getExerciseImage(ex.videoUrl, primaryMuscle);
                return (
                  <div className="h-10 w-16 rounded-md bg-zinc-900 flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {img.type === "youtube" ? (
                      <img src={img.src} alt="" className="h-full w-full object-cover" />
                    ) : img.type === "emoji" ? (
                      <span className="text-lg">{img.emoji}</span>
                    ) : (
                      <Dumbbell className="h-4 w-4 text-muted-foreground/40" />
                    )}
                  </div>
                );
              })()}
              <div>
                <p className="font-medium text-sm">{sets[0].exercise.name}</p>
                <p className="text-xs text-muted-foreground">
                  {sets.length} {sets.length === 1 ? "seria" : sets.length < 5 ? "serie" : "serii"}
                  {sets[0].exercise.equipment &&
                    ` · ${EQUIPMENT.find((e) => e.id === sets[0].exercise.equipment)?.label || sets[0].exercise.equipment}`}
                </p>
              </div>
            </div>
            <div className="p-3">
              <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground uppercase tracking-wider mb-2">
                <span>Seria</span>
                <span className="text-center">Ciężar</span>
                <span className="text-center">Powt.</span>
                <span className="text-center">RPE</span>
              </div>
              {sets.map((set) => (
                <div
                  key={set.id}
                  className={`grid grid-cols-4 gap-2 py-1.5 text-sm rounded-sm px-1 ${
                    set.isPR ? "text-amber-400 bg-amber-500/5" : ""
                  } ${
                    set.isWarmup && !set.isPR ? "text-orange-400/60 bg-orange-500/5" : ""
                  }`}
                >
                  <span className="flex items-center gap-1">
                    {set.isPR && <Flame className="h-3 w-3" />}
                    {set.isWarmup && !set.isPR && "🧪 "}
                    #{set.setNumber}
                  </span>
                  <span className="text-center tabular-nums">
                    {set.weightKg ? `${set.weightKg} kg` : "—"}
                  </span>
                  <span className="text-center tabular-nums font-medium">{set.reps}</span>
                  <span className="text-center tabular-nums text-muted-foreground">
                    {set.rpe ? `@${set.rpe}` : "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {workout.notes && (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Notatki</p>
          <p className="text-sm">{workout.notes}</p>
        </div>
      )}
    </div>
  );
}

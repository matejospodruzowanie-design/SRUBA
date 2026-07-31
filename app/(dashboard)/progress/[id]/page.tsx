import { getExerciseProgress } from "../exercise-actions";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, TrendingUp, Dumbbell, Weight, Flame } from "lucide-react";
import { MUSCLE_GROUPS, EQUIPMENT } from "@/lib/constants";
import { getExerciseImage } from "@/lib/exercise-images";
import { ExerciseChart } from "./exercise-chart";

export default async function ExerciseProgressPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getExerciseProgress(id).catch(() => null);
  if (!data) notFound();

  const { exercise, chartData, prs } = data;
  const primaryMuscle = exercise.muscles.find((m) => m.isPrimary)?.muscleGroup;
  const image = getExerciseImage(exercise.videoUrl, primaryMuscle);

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Back link */}
      <Link
        href="/progress"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Powrót do statystyk
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="h-16 w-24 rounded-lg bg-zinc-900 flex-shrink-0 overflow-hidden flex items-center justify-center">
          {image.type === "youtube" ? (
            <img src={image.src} alt="" className="h-full w-full object-cover" />
          ) : image.type === "emoji" ? (
            <span className="text-3xl">{image.emoji}</span>
          ) : (
            <Dumbbell className="h-6 w-6 text-muted-foreground/40" />
          )}
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">{exercise.name}</h1>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {primaryMuscle && (
              <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400">
                {MUSCLE_GROUPS.find((mg) => mg.id === primaryMuscle)?.label || primaryMuscle}
              </span>
            )}
            {exercise.equipment && (
              <span className="rounded-full bg-border/50 px-2.5 py-0.5 text-xs text-muted-foreground">
                {EQUIPMENT.find((e) => e.id === exercise.equipment)?.label || exercise.equipment}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="rounded-xl border border-border bg-card p-3 sm:p-4 text-center">
            <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">
              Max ciężar
            </p>
            <p className="text-lg sm:text-xl font-bold mt-1">
              {Math.max(...chartData.map((d) => d.maxWeight))} kg
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 sm:p-4 text-center">
            <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">
              Est. 1RM
            </p>
            <p className="text-lg sm:text-xl font-bold mt-1">
              {Math.round(Math.max(...chartData.map((d) => d.est1RM)))} kg
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 sm:p-4 text-center">
            <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">
              Treningów
            </p>
            <p className="text-lg sm:text-xl font-bold mt-1">{chartData.length}</p>
          </div>
        </div>
      )}

      {/* Charts */}
      {chartData.length > 1 ? (
        <ExerciseChart data={chartData} />
      ) : chartData.length === 1 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <TrendingUp className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Potrzeba więcej danych — na razie tylko jeden trening
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <Dumbbell className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Brak danych — wykonaj to ćwiczenie podczas treningu
          </p>
        </div>
      )}

      {/* PRs list */}
      {prs.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Flame className="h-4 w-4 text-amber-400" />
            Rekordy osobiste
          </h3>
          <div className="space-y-1.5">
            {prs.slice(0, 10).map((pr) => (
              <div
                key={pr.id}
                className="flex items-center justify-between rounded-lg px-3 py-2 bg-border/10 text-sm"
              >
                <span className="text-muted-foreground">
                  {pr.type === "weight"
                    ? "Max ciężar"
                    : pr.type === "est1rm"
                    ? "Est. 1RM"
                    : pr.type === "volume"
                    ? "Objętość"
                    : "Max powtórzeń"}
                </span>
                <span className="font-semibold tabular-nums text-amber-400">
                  {pr.value} {pr.type === "reps" ? "powt." : "kg"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History list */}
      {chartData.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Weight className="h-4 w-4 text-muted-foreground" />
            Historia
          </h3>
          <div className="space-y-1">
            {chartData
              .slice(-15)
              .reverse()
              .map((d) => (
                <Link
                  key={d.workoutId}
                  href={`/workout/${d.workoutId}`}
                  className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-amber-500/5 transition-colors text-sm"
                >
                  <span className="text-muted-foreground truncate mr-2">
                    {d.workoutName}
                  </span>
                  <span className="tabular-nums flex-shrink-0">
                    <span className="font-medium">{d.maxWeight} kg</span>
                    <span className="text-muted-foreground"> × {d.maxReps}</span>
                  </span>
                </Link>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

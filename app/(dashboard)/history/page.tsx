import { prisma } from "@/lib/db";
import { getUser } from "@/lib/session";
import Link from "next/link";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday } from "date-fns";
import { pl } from "date-fns/locale";
import { Dumbbell, Flame, Clock, ChevronRight } from "lucide-react";
import { formatDuration } from "@/lib/fitness-utils";

export default async function HistoryPage() {
  const user = await getUser();

  const workouts = await prisma.workout.findMany({
    where: { userId: user.id, isActive: false },
    include: {
      sets: {
        select: { id: true, isPR: true },
      },
    },
    orderBy: { startedAt: "desc" },
    take: 30,
  });

  // Generate current week days for mini calendar
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Historia treningów</h1>
        <p className="text-muted-foreground mt-1">Twoje dotychczasowe sesje</p>
      </div>

      {/* Mini week calendar */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">
          Ten tydzień
        </p>
        <div className="flex justify-between">
          {weekDays.map((day) => {
            const hasWorkout = workouts.some((w) =>
              isSameDay(new Date(w.startedAt), day)
            );
            return (
              <div
                key={day.toISOString()}
                className="flex flex-col items-center gap-1.5"
              >
                <span className="text-xs text-muted-foreground">
                  {format(day, "EEE", { locale: pl })}
                </span>
                <div
                  className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-medium ${
                    isToday(day)
                      ? "bg-amber-500 text-black"
                      : hasWorkout
                      ? "bg-green-500/20 text-green-400"
                      : "text-muted-foreground"
                  }`}
                >
                  {format(day, "d")}
                </div>
                {hasWorkout && (
                  <div className="h-1 w-1 rounded-full bg-green-400" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Workout list */}
      {workouts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Dumbbell className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">
            Brak treningów
          </h3>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Rozpocznij swój pierwszy trening!
          </p>
          <Link
            href="/workout"
            className="inline-flex items-center gap-1 mt-4 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400 transition-colors"
          >
            <Dumbbell className="h-4 w-4" /> Rozpocznij trening
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {workouts.map((workout) => (
            <Link
              key={workout.id}
              href={`/workout/${workout.id}`}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:border-amber-500/20 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Dumbbell className="h-4 w-4 text-amber-400" />
                </div>
                <div>
                  <p className="font-medium text-sm group-hover:text-amber-400 transition-colors">
                    {workout.name}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span>
                      {format(new Date(workout.startedAt), "d MMM yyyy, HH:mm", {
                        locale: pl,
                      })}
                    </span>
                    {workout.durationSeconds && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(workout.durationSeconds)}
                      </span>
                    )}
                    {workout.sets.filter((s) => s.isPR).length > 0 && (
                      <span className="flex items-center gap-1 text-amber-400">
                        <Flame className="h-3 w-3" />
                        {workout.sets.filter((s) => s.isPR).length} PR
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

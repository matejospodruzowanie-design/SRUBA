"use server";

import { prisma } from "@/lib/db";
import { getUser } from "@/lib/session";

export async function getExerciseProgress(exerciseId: string) {
  const user = await getUser();

  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId },
    include: { muscles: true },
  });
  if (!exercise) throw new Error("Nie znaleziono ćwiczenia");

  // All sets for this exercise, ordered by date
  const sets = await prisma.workoutSet.findMany({
    where: {
      exerciseId,
      workout: { userId: user.id, isActive: false, endedAt: { not: null } },
    },
    include: {
      workout: { select: { id: true, startedAt: true, name: true } },
    },
    orderBy: { completedAt: "asc" },
  });

  // PRs for this exercise
  const prs = await prisma.personalRecord.findMany({
    where: { userId: user.id, exerciseId },
    orderBy: { achievedAt: "desc" },
  });

  // Group sets by workout for chart data
  const workoutMap = new Map<
    string,
    {
      workoutId: string;
      workoutName: string;
      date: Date;
      maxWeight: number;
      maxReps: number;
      est1RM: number;
      totalVolume: number;
    }
  >();

  for (const set of sets) {
    const key = set.workout.id;
    if (!workoutMap.has(key)) {
      workoutMap.set(key, {
        workoutId: set.workout.id,
        workoutName: set.workout.name,
        date: set.completedAt,
        maxWeight: 0,
        maxReps: 0,
        est1RM: 0,
        totalVolume: 0,
      });
    }
    const entry = workoutMap.get(key)!;
    entry.maxWeight = Math.max(entry.maxWeight, set.weightKg ?? 0);
    entry.maxReps = Math.max(entry.maxReps, set.reps);
    // Epley 1RM: weight × (1 + reps/30)
    if (set.weightKg) {
      const epley = set.weightKg * (1 + set.reps / 30);
      entry.est1RM = Math.max(entry.est1RM, Math.round(epley * 10) / 10);
    }
    entry.totalVolume += (set.weightKg ?? 0) * set.reps;
    entry.date = set.completedAt; // Use latest set date for the workout
  }

  const chartData = Array.from(workoutMap.values()).sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  return { exercise, chartData, prs };
}

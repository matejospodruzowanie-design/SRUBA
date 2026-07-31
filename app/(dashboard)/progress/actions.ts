"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/session";
import { subWeeks, getISOWeek, getYear } from "date-fns";

// ─── Weekly volume (weight × reps summed per week) ───

export async function getWeeklyVolume(weeks = 8) {
  const user = await getUser();

  const sets = await prisma.workoutSet.findMany({
    where: {
      workout: { userId: user.id, isActive: false, endedAt: { not: null } },
      weightKg: { not: null },
    },
    include: { workout: { select: { endedAt: true } } },
    orderBy: { completedAt: "asc" },
  });

  // Group by ISO week
  const weekMap = new Map<string, number>();
  const today = new Date();

  // Initialize last N weeks with 0
  for (let i = weeks - 1; i >= 0; i--) {
    const d = subWeeks(today, i);
    const key = `${getYear(d)}-W${String(getISOWeek(d)).padStart(2, "0")}`;
    weekMap.set(key, 0);
  }

  for (const set of sets) {
    const d = new Date(set.completedAt);
    const key = `${getYear(d)}-W${String(getISOWeek(d)).padStart(2, "0")}`;
    if (weekMap.has(key)) {
      weekMap.set(key, (weekMap.get(key) ?? 0) + (set.weightKg ?? 0) * set.reps);
    }
  }

  return Array.from(weekMap.entries()).map(([week, volume]) => ({
    week,
    volume: Math.round(volume),
  }));
}

// ─── Workout frequency (workouts per week) ───

export async function getWorkoutFrequency(weeks = 8) {
  const user = await getUser();

  const workouts = await prisma.workout.findMany({
    where: { userId: user.id, isActive: false, endedAt: { not: null } },
    select: { endedAt: true },
    orderBy: { endedAt: "asc" },
  });

  const weekMap = new Map<string, number>();
  const today = new Date();

  for (let i = weeks - 1; i >= 0; i--) {
    const d = subWeeks(today, i);
    const key = `${getYear(d)}-W${String(getISOWeek(d)).padStart(2, "0")}`;
    weekMap.set(key, 0);
  }

  for (const w of workouts) {
    if (!w.endedAt) continue;
    const d = new Date(w.endedAt);
    const key = `${getYear(d)}-W${String(getISOWeek(d)).padStart(2, "0")}`;
    if (weekMap.has(key)) {
      weekMap.set(key, (weekMap.get(key) ?? 0) + 1);
    }
  }

  return Array.from(weekMap.entries()).map(([week, count]) => ({
    week,
    count,
  }));
}

// ─── All PRs ───

export async function getPRHistory() {
  const user = await getUser();

  return prisma.personalRecord.findMany({
    where: { userId: user.id },
    include: { exercise: { select: { id: true, name: true } } },
    orderBy: { achievedAt: "desc" },
    take: 50,
  });
}

// ─── Muscle group distribution (from last N weeks) ───

export async function getMuscleDistribution(weeks = 4) {
  const user = await getUser();
  const since = subWeeks(new Date(), weeks);

  const sets = await prisma.workoutSet.findMany({
    where: {
      workout: { userId: user.id, isActive: false },
      completedAt: { gte: since },
    },
    include: {
      exercise: {
        include: { muscles: { where: { isPrimary: true } } },
      },
    },
  });

  // Count sets per muscle group
  const muscleCounts = new Map<string, number>();
  for (const set of sets) {
    for (const muscle of set.exercise.muscles) {
      muscleCounts.set(
        muscle.muscleGroup,
        (muscleCounts.get(muscle.muscleGroup) ?? 0) + 1
      );
    }
  }

  return Array.from(muscleCounts.entries())
    .map(([group, count]) => ({ group, count }))
    .sort((a, b) => b.count - a.count);
}

// ─── Body measurements ───

export async function getBodyMeasurements(limit = 30) {
  const user = await getUser();

  return prisma.bodyMeasurement.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
    take: limit,
  });
}

// ─── All-time totals ───

export async function getTotalStats() {
  const user = await getUser();

  // Only count completed (non-abandoned) workouts
  const baseFilter = {
    workout: { userId: user.id, isActive: false, endedAt: { not: null } },
  };

  const [totalWorkouts, setAgg, allSets] = await Promise.all([
    prisma.workout.count({
      where: { userId: user.id, isActive: false, endedAt: { not: null } },
    }),
    prisma.workoutSet.aggregate({
      where: { ...baseFilter },
      _count: true,
    }),
    // Fetch all sets for volume calculation — typical fitness app scale is
    // hundreds to low thousands of sets per user, well within safe limits
    prisma.workoutSet.findMany({
      where: { ...baseFilter, weightKg: { not: null } },
      select: { weightKg: true, reps: true },
    }),
  ]);

  const totalVolumeKg = Math.round(
    allSets.reduce((sum, s) => sum + (s.weightKg ?? 0) * s.reps, 0)
  );

  return {
    totalWorkouts,
    totalSets: setAgg._count,
    totalVolumeKg,
  };
}

// ─── Add body measurement ───

export async function addBodyMeasurement(data: {
  weightKg?: number | null;
  bodyFatPct?: number | null;
  chestCm?: number | null;
  waistCm?: number | null;
  hipsCm?: number | null;
  armsCm?: number | null;
  thighsCm?: number | null;
  date?: string;
}) {
  const user = await getUser();

  const measurement = await prisma.bodyMeasurement.create({
    data: {
      userId: user.id,
      date: data.date ? new Date(data.date) : new Date(),
      weightKg: data.weightKg ?? null,
      bodyFatPct: data.bodyFatPct ?? null,
      chestCm: data.chestCm ?? null,
      waistCm: data.waistCm ?? null,
      hipsCm: data.hipsCm ?? null,
      armsCm: data.armsCm ?? null,
      thighsCm: data.thighsCm ?? null,
    },
  });

  // If weight is provided, also update the user's current weight
  if (data.weightKg != null) {
    await prisma.user.update({
      where: { id: user.id },
      data: { weightKg: data.weightKg },
    });
  }

  revalidatePath("/progress");
  revalidatePath("/dashboard");
  return measurement;
}

// ─── Delete body measurement ───

export async function deleteBodyMeasurement(id: string) {
  const user = await getUser();

  const measurement = await prisma.bodyMeasurement.findFirst({
    where: { id, userId: user.id },
  });
  if (!measurement) throw new Error("Nie znaleziono pomiaru");

  await prisma.bodyMeasurement.delete({ where: { id } });
  revalidatePath("/progress");
  revalidatePath("/dashboard");
}

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/session";
import { checkSetPrs } from "@/lib/prs";
import { applyXp, checkAchievements, updateStreak } from "@/lib/gamification";
import { workoutDuration, nextWeightSuggestion } from "@/lib/fitness-utils";

// ─── Active workout check ───

export async function getActiveWorkout() {
  const user = await getUser();
  const workout = await prisma.workout.findFirst({
    where: { userId: user.id, isActive: true },
    include: {
      sets: {
        include: { exercise: { include: { muscles: true } } },
        orderBy: [{ exerciseId: "asc" }, { setNumber: "asc" }],
      },
    },
    orderBy: { startedAt: "desc" },
  });
  return workout;
}

// ─── Start workout ───

export async function startWorkout(name: string, notes?: string, forceDiscard = false) {
  const user = await getUser();

  // Check for existing active workout with sets
  if (!forceDiscard) {
    const active = await prisma.workout.findFirst({
      where: { userId: user.id, isActive: true },
      include: { sets: { select: { id: true } } },
    });
    if (active && active.sets.length > 0) {
      return {
        conflict: true,
        existingWorkout: { id: active.id, name: active.name, setCount: active.sets.length },
      };
    }
  }

  // Cancel any existing active workout — also set endedAt so stats exclude it
  await prisma.workout.updateMany({
    where: { userId: user.id, isActive: true },
    data: { isActive: false, endedAt: new Date() },
  });

  const workout = await prisma.workout.create({
    data: {
      userId: user.id,
      name,
      notes: notes ?? null,
      isActive: true,
    },
  });

  revalidatePath("/workout");
  return workout;
}

// ─── Add set ───

export interface AddSetInput {
  workoutId: string;
  exerciseId: string;
  weightKg?: number;
  reps: number;
  rpe?: number;
  targetReps?: string;
  isWarmup?: boolean;
}

export async function addSet(input: AddSetInput) {
  const user = await getUser();

  const workout = await prisma.workout.findFirst({
    where: { id: input.workoutId, userId: user.id, isActive: true },
  });
  if (!workout) throw new Error("Brak aktywnego treningu");

  // Get the next set number for this exercise
  const lastSet = await prisma.workoutSet.findFirst({
    where: { workoutId: input.workoutId, exerciseId: input.exerciseId },
    orderBy: { setNumber: "desc" },
  });

  const setNumber = (lastSet?.setNumber ?? 0) + 1;

  // Get exercise name for PR context
  const exercise = await prisma.exercise.findUnique({
    where: { id: input.exerciseId },
    select: { name: true },
  });

  const workoutSet = await prisma.workoutSet.create({
    data: {
      workoutId: input.workoutId,
      exerciseId: input.exerciseId,
      setNumber,
      weightKg: input.weightKg ?? null,
      reps: input.reps,
      rpe: input.rpe ?? null,
      isWarmup: input.isWarmup ?? false,
    },
    include: { exercise: true },
  });

  // Check for PRs
  const prs = await checkSetPrs(
    user.id,
    input.exerciseId,
    exercise?.name ?? "Nieznane ćwiczenie",
    input.weightKg ?? null,
    input.reps,
    workout.id
  );

  if (prs.length > 0) {
    // Mark set as PR
    await prisma.workoutSet.update({
      where: { id: workoutSet.id },
      data: { isPR: true },
    });
  }

  // Calculate auto-progression suggestion
  const recentSets = await prisma.workoutSet.findMany({
    where: {
      exerciseId: input.exerciseId,
      workout: { userId: user.id, isActive: false },
    },
    orderBy: { completedAt: "desc" },
    take: 5,
    select: { weightKg: true, reps: true, rpe: true },
  });

  // Parse target reps from plan (e.g. "8-12" → [8, 12])
  let minReps = 8, maxReps = 12;
  if (input.targetReps) {
    const parts = input.targetReps.split("-").map(Number);
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      minReps = parts[0];
      maxReps = parts[1];
    } else if (!isNaN(parts[0])) {
      minReps = maxReps = parts[0];
    }
  }

  const suggestion = recentSets.length > 0
    ? nextWeightSuggestion(recentSets, minReps, maxReps)
    : null;

  revalidatePath("/workout");
  return { set: workoutSet, prs, suggestion };
}

// ─── Update set ───

export async function updateSet(
  setId: string,
  data: { weightKg?: number | null; reps?: number; rpe?: number | null }
) {
  const user = await getUser();

  const existing = await prisma.workoutSet.findFirst({
    where: { id: setId, workout: { userId: user.id, isActive: true } },
    include: { workout: true },
  });
  if (!existing) throw new Error("Nie znaleziono serii");

  const updated = await prisma.workoutSet.update({
    where: { id: setId },
    data,
  });

  revalidatePath("/workout");
  return updated;
}

// ─── Delete set ───

export async function deleteSet(setId: string) {
  const user = await getUser();
  const existing = await prisma.workoutSet.findFirst({
    where: { id: setId, workout: { userId: user.id, isActive: true } },
  });
  if (!existing) throw new Error("Nie znaleziono serii");

  await prisma.workoutSet.delete({ where: { id: setId } });
  revalidatePath("/workout");
}

// ─── Start workout from plan ───

export async function startWorkoutFromPlan(planId: string, forceDiscard = false) {
  const user = await getUser();

  const routine = await prisma.routine.findFirst({
    where: { id: planId, userId: user.id },
    include: {
      exercises: {
        include: { exercise: { include: { muscles: true } } },
        orderBy: { position: "asc" },
      },
    },
  });

  if (!routine) throw new Error("Nie znaleziono planu");

  // Check for existing active workout with sets
  if (!forceDiscard) {
    const active = await prisma.workout.findFirst({
      where: { userId: user.id, isActive: true },
      include: { sets: { select: { id: true } } },
    });
    if (active && active.sets.length > 0) {
      return {
        conflict: true,
        existingWorkout: { id: active.id, name: active.name, setCount: active.sets.length },
      };
    }
  }

  // Cancel any existing active workout — also set endedAt so stats exclude it
  await prisma.workout.updateMany({
    where: { userId: user.id, isActive: true },
    data: { isActive: false, endedAt: new Date() },
  });

  const workout = await prisma.workout.create({
    data: {
      userId: user.id,
      name: routine.name,
      isActive: true,
    },
  });

  revalidatePath("/workout");
  return {
    workout,
    planExercises: routine.exercises.map((slot) => ({
      id: slot.exercise.id,
      name: slot.exercise.name,
      equipment: slot.exercise.equipment,
      muscles: slot.exercise.muscles,
      targetSets: slot.targetSets,
      targetReps: slot.targetReps,
      restSeconds: slot.restSeconds,
    })),
  };
}

// ─── Get last sets for auto-fill ───

export async function getLastSets(exerciseId: string, limit = 5) {
  const user = await getUser();

  const sets = await prisma.workoutSet.findMany({
    where: {
      exerciseId,
      workout: { userId: user.id, isActive: false },
    },
    orderBy: { completedAt: "desc" },
    take: limit,
    select: { weightKg: true, reps: true, rpe: true, completedAt: true },
  });

  return sets;
}

// ─── Delete workout ───

export async function deleteWorkout(workoutId: string) {
  const user = await getUser();
  const workout = await prisma.workout.findFirst({
    where: { id: workoutId, userId: user.id },
  });
  if (!workout) throw new Error("Nie znaleziono treningu");

  await prisma.workout.delete({ where: { id: workoutId } });

  revalidatePath("/history");
  revalidatePath("/dashboard");
  revalidatePath("/progress");
  revalidatePath("/workout");
}

// ─── Remove all sets for an exercise ───

export async function removeExerciseFromWorkout(workoutId: string, exerciseId: string) {
  const user = await getUser();
  const workout = await prisma.workout.findFirst({
    where: { id: workoutId, userId: user.id, isActive: true },
  });
  if (!workout) throw new Error("Brak aktywnego treningu");

  await prisma.workoutSet.deleteMany({
    where: { workoutId, exerciseId },
  });

  revalidatePath("/workout");
}

// ─── Finish workout ───

export async function finishWorkout(workoutId: string) {
  const user = await getUser();

  const workout = await prisma.workout.findFirst({
    where: { id: workoutId, userId: user.id, isActive: true },
    include: { sets: true },
  });
  if (!workout) throw new Error("Brak aktywnego treningu");

  // Guard: don't finish empty workouts — delete them instead
  const realSets = workout.sets.filter((s) => s.id && !s.id.startsWith("optimistic"));
  if (realSets.length === 0) {
    await prisma.workout.delete({ where: { id: workoutId } });
    revalidatePath("/workout");
    revalidatePath("/dashboard");
    return { error: "Trening bez serii został usunięty" };
  }

  const endedAt = new Date();

  // Count unique PRs from this workout
  const prCount = workout.sets.filter((s) => s.isPR).length;

  // Update workout
  await prisma.workout.update({
    where: { id: workoutId },
    data: {
      isActive: false,
      endedAt,
      durationSeconds: workoutDuration(workout.startedAt, endedAt),
    },
  });

  // Update streak
  const newStreak = await updateStreak(user.id);

  // Apply XP
  const xpResult = await applyXp(user.id, workout.sets.length, prCount, newStreak);

  // Check achievements
  const newAchievements = await checkAchievements(user.id);

  revalidatePath("/workout");
  revalidatePath("/dashboard");
  revalidatePath("/history");
  revalidatePath("/profile");
  revalidatePath("/progress");

  return {
    workoutId,
    setCount: workout.sets.length,
    prCount,
    xpResult,
    newAchievements,
    durationSeconds: workoutDuration(workout.startedAt, endedAt),
  };
}

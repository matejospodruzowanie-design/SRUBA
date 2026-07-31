"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/session";
import { checkSetPrs } from "@/lib/prs";
import { applyXp, checkAchievements, updateStreak } from "@/lib/gamification";
import { workoutDuration, nextWeightSuggestion } from "@/lib/fitness-utils";
import { z } from "zod";

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

  // Delete any existing active workout (its sets cascade via schema)
  if (forceDiscard) {
    await prisma.workout.deleteMany({
      where: { userId: user.id, isActive: true },
    });
  }

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

const addSetSchema = z.object({
  workoutId: z.string().min(1),
  exerciseId: z.string().min(1),
  weightKg: z.number().min(0).optional(),
  reps: z.number().int().min(1).max(999),
  rpe: z.number().min(0).max(10).optional(),
  targetReps: z.string().optional(),
  isWarmup: z.boolean().optional(),
});

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

  // Validate input
  const parsed = addSetSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Nieprawidłowe dane serii" };
  }

  const workout = await prisma.workout.findFirst({
    where: { id: input.workoutId, userId: user.id, isActive: true },
  });
  if (!workout) return { error: "Brak aktywnego treningu" };

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

  // Check for PRs (skip for warmup sets)
  const isWarmup = input.isWarmup ?? false;
  let prs: Awaited<ReturnType<typeof checkSetPrs>> = [];
  if (!isWarmup) {
    prs = await checkSetPrs(
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
  }

  // Calculate auto-progression suggestion (exclude warmup sets)
  const recentSets = await prisma.workoutSet.findMany({
    where: {
      exerciseId: input.exerciseId,
      isWarmup: false,
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
  return { set: { ...workoutSet, isPR: prs.length > 0 }, prs, suggestion };
}

// ─── Update set ───

const updateSetSchema = z.object({
  weightKg: z.number().positive().nullable().optional(),
  reps: z.number().int().min(1).max(999).optional(),
  rpe: z.number().min(0).max(10).nullable().optional(),
});

export async function updateSet(
  setId: string,
  data: { weightKg?: number | null; reps?: number; rpe?: number | null }
) {
  const user = await getUser();

  const parsed = updateSetSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "Nieprawidłowe dane serii" };
  }

  const existing = await prisma.workoutSet.findFirst({
    where: { id: setId, workout: { userId: user.id, isActive: true } },
    include: { workout: true, exercise: true },
  });
  if (!existing) return { error: "Nie znaleziono serii" };

  const updated = await prisma.workoutSet.update({
    where: { id: setId },
    data: parsed.data,
  });

  // Recompute PRs for the updated set
  const prs = await checkSetPrs(
    user.id,
    existing.exerciseId,
    existing.exercise.name,
    updated.weightKg,
    updated.reps,
    existing.workout.id
  );

  const isPR = prs.length > 0;

  if (isPR !== existing.isPR) {
    await prisma.workoutSet.update({
      where: { id: setId },
      data: { isPR },
    });
  }

  revalidatePath("/workout");
  return { ...updated, isPR };
}

// ─── Delete set ───

export async function deleteSet(setId: string) {
  const user = await getUser();
  const existing = await prisma.workoutSet.findFirst({
    where: { id: setId, workout: { userId: user.id, isActive: true } },
  });
  if (!existing) return { error: "Nie znaleziono serii" };

  await prisma.workoutSet.delete({ where: { id: setId } });
  revalidatePath("/workout");
  return { ok: true };
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

  if (!routine) return { error: "Nie znaleziono planu" };

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

  // Delete any existing active workout (its sets cascade via schema)
  if (forceDiscard) {
    await prisma.workout.deleteMany({
      where: { userId: user.id, isActive: true },
    });
  }

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
      isWarmup: false,
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
  if (!workout) return { error: "Nie znaleziono treningu" };

  await prisma.workout.delete({ where: { id: workoutId } });

  revalidatePath("/history");
  revalidatePath("/dashboard");
  revalidatePath("/progress");
  revalidatePath("/workout");
  return { ok: true };
}

// ─── Remove all sets for an exercise ───

export async function removeExerciseFromWorkout(workoutId: string, exerciseId: string) {
  const user = await getUser();
  const workout = await prisma.workout.findFirst({
    where: { id: workoutId, userId: user.id, isActive: true },
  });
  if (!workout) return { error: "Brak aktywnego treningu" };

  await prisma.workoutSet.deleteMany({
    where: { workoutId, exerciseId },
  });

  revalidatePath("/workout");
  return { ok: true };
}

// ─── Finish workout ───

export async function finishWorkout(workoutId: string) {
  const user = await getUser();

  const workout = await prisma.workout.findFirst({
    where: { id: workoutId, userId: user.id, isActive: true },
    include: { sets: true },
  });
  if (!workout) return { error: "Trening już zakończony lub nie istnieje" };

  // Guard: don't finish empty workouts — delete them instead
  if (workout.sets.length === 0) {
    await prisma.workout.delete({ where: { id: workoutId } });
    revalidatePath("/workout");
    revalidatePath("/dashboard");
    return { error: "Trening bez serii został usunięty" };
  }

  const endedAt = new Date();

  // Count PRs from non-warmup sets
  const prCount = workout.sets.filter((s) => s.isPR && !s.isWarmup).length;

  // Perform all side effects FIRST: if any fail, the workout stays active (retryable).
  // The isActive=false update comes LAST — only after everything succeeds.
  const newStreak = await updateStreak(user.id);
  const xpResult = await applyXp(user.id, workout.sets.length, prCount, newStreak);
  const newAchievements = await checkAchievements(user.id);

  // Atomically mark workout as inactive (LAST — after all side effects succeed)
  const updated = await prisma.workout.updateMany({
    where: { id: workoutId, isActive: true },
    data: {
      isActive: false,
      endedAt,
      durationSeconds: workoutDuration(workout.startedAt, endedAt),
    },
  });
  if (updated.count === 0) {
    return { error: "Trening już zakończony" };
  }

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

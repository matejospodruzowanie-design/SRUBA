"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/session";
import { checkSetPrs } from "@/lib/prs";
import { workoutDuration } from "@/lib/fitness-utils";
import { z } from "zod";

const REVALIDATE_WORKOUT = (id: string) => [
  "/history",
  `/workout/${id}`,
  `/workout/${id}/edit`,
  "/dashboard",
  "/progress",
];

// ─── Meta: name / startedAt / endedAt (durationSeconds always recomputed) ───

const workoutMetaSchema = z.object({
  name: z.string().trim().min(1, "Nazwa treningu nie może być pusta").max(100).optional(),
  startedAt: z.coerce.date().optional(),
  endedAt: z.coerce.date().optional(),
});

export async function updateWorkoutMeta(
  workoutId: string,
  input: { name?: string; startedAt?: Date; endedAt?: Date }
) {
  const user = await getUser();
  const parsed = workoutMetaSchema.safeParse(input);
  if (!parsed.success) return { error: "Nieprawidłowe dane treningu" };

  const workout = await prisma.workout.findFirst({
    where: { id: workoutId, userId: user.id, isActive: false },
    select: { id: true, startedAt: true, endedAt: true },
  });
  if (!workout) return { error: "Nie znaleziono treningu" };

  const startedAt = parsed.data.startedAt ?? workout.startedAt;
  const endedAt = parsed.data.endedAt ?? workout.endedAt;
  if (endedAt && endedAt.getTime() <= startedAt.getTime()) {
    return { error: "Koniec treningu musi być po jego rozpoczęciu" };
  }

  await prisma.workout.update({
    where: { id: workoutId },
    data: {
      ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
      ...(parsed.data.startedAt !== undefined ? { startedAt: parsed.data.startedAt } : {}),
      ...(parsed.data.endedAt !== undefined ? { endedAt: parsed.data.endedAt } : {}),
      ...(endedAt ? { durationSeconds: workoutDuration(startedAt, endedAt) } : {}),
    },
  });

  for (const p of REVALIDATE_WORKOUT(workoutId)) revalidatePath(p);
  return { ok: true };
}

// ─── Add set to a finished workout ───

const workoutSetInputSchema = z.object({
  weightKg: z.number().min(0).nullable().optional(), // 0 valid — bodyweight
  reps: z.number().int().min(1).max(999),
  rpe: z.number().min(0).max(10).nullable().optional(),
  isWarmup: z.boolean().optional(),
});

export async function addWorkoutSet(
  workoutId: string,
  exerciseId: string,
  input: { weightKg?: number | null; reps: number; rpe?: number | null; isWarmup?: boolean }
) {
  const user = await getUser();
  const parsed = workoutSetInputSchema.safeParse(input);
  if (!parsed.success) return { error: "Nieprawidłowe dane serii" };

  const workout = await prisma.workout.findFirst({
    where: { id: workoutId, userId: user.id, isActive: false },
    select: { id: true },
  });
  if (!workout) return { error: "Nie znaleziono treningu" };

  const alreadyThere = await prisma.workoutSet.findFirst({
    where: { workoutId, exerciseId },
    select: { id: true },
  });
  if (alreadyThere) return { error: "Ćwiczenie jest już w tym treningu" };

  const lastSet = await prisma.workoutSet.findFirst({
    where: { workoutId, exerciseId },
    orderBy: { setNumber: "desc" },
  });
  const setNumber = (lastSet?.setNumber ?? 0) + 1;

  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId },
    select: { name: true },
  });
  if (!exercise) return { error: "Nie znaleziono ćwiczenia" };

  const workoutSet = await prisma.workoutSet.create({
    data: {
      workoutId,
      exerciseId,
      setNumber,
      weightKg: parsed.data.weightKg ?? null,
      reps: parsed.data.reps,
      rpe: parsed.data.rpe ?? null,
      isWarmup: parsed.data.isWarmup ?? false,
    },
  });

  // Re-check PRs (no-op unless the user genuinely beats the stored PR; warmups skipped)
  if (!(parsed.data.isWarmup ?? false)) {
    const prs = await checkSetPrs(
      user.id,
      exerciseId,
      exercise.name,
      parsed.data.weightKg ?? null,
      parsed.data.reps,
      workoutId
    );
    if (prs.length > 0) {
      await prisma.workoutSet.update({
        where: { id: workoutSet.id },
        data: { isPR: true },
      });
    }
  }

  for (const p of REVALIDATE_WORKOUT(workoutId)) revalidatePath(p);
  return { ok: true, set: workoutSet };
}

// ─── Update set in a finished workout ───

const workoutSetUpdateSchema = z.object({
  weightKg: z.number().min(0).nullable().optional(),
  reps: z.number().int().min(1).max(999).optional(),
  rpe: z.number().min(0).max(10).nullable().optional(),
  isWarmup: z.boolean().optional(),
});

export async function updateWorkoutSet(
  workoutId: string,
  setId: string,
  input: { weightKg?: number | null; reps?: number; rpe?: number | null; isWarmup?: boolean }
) {
  const user = await getUser();
  const parsed = workoutSetUpdateSchema.safeParse(input);
  if (!parsed.success) return { error: "Nieprawidłowe dane serii" };

  const existing = await prisma.workoutSet.findFirst({
    where: { id: setId, workout: { id: workoutId, userId: user.id, isActive: false } },
    include: { exercise: { select: { name: true } } },
  });
  if (!existing) return { error: "Nie znaleziono serii" };

  const updated = await prisma.workoutSet.update({ where: { id: setId }, data: parsed.data });

  const isWarmup = parsed.data.isWarmup ?? existing.isWarmup;
  if (isWarmup) {
    if (existing.isPR) {
      await prisma.workoutSet.update({ where: { id: setId }, data: { isPR: false } });
    }
  } else {
    const prs = await checkSetPrs(
      user.id,
      existing.exerciseId,
      existing.exercise.name,
      updated.weightKg,
      updated.reps,
      existing.workoutId
    );
    const isPR = prs.length > 0;
    if (isPR !== existing.isPR) {
      await prisma.workoutSet.update({ where: { id: setId }, data: { isPR } });
    }
  }

  for (const p of REVALIDATE_WORKOUT(workoutId)) revalidatePath(p);
  return { ok: true, set: updated };
}

// ─── Delete set from a finished workout (no renumbering — gaps are fine) ───

export async function deleteWorkoutSet(workoutId: string, setId: string) {
  const user = await getUser();
  const existing = await prisma.workoutSet.findFirst({
    where: { id: setId, workout: { id: workoutId, userId: user.id, isActive: false } },
  });
  if (!existing) return { error: "Nie znaleziono serii" };
  await prisma.workoutSet.delete({ where: { id: setId } });
  for (const p of REVALIDATE_WORKOUT(workoutId)) revalidatePath(p);
  return { ok: true };
}

// ─── Remove an exercise (all its sets) from a finished workout ───

export async function removeExerciseFromFinishedWorkout(workoutId: string, exerciseId: string) {
  const user = await getUser();
  const workout = await prisma.workout.findFirst({
    where: { id: workoutId, userId: user.id, isActive: false },
    select: { id: true },
  });
  if (!workout) return { error: "Nie znaleziono treningu" };
  await prisma.workoutSet.deleteMany({ where: { workoutId, exerciseId } });
  for (const p of REVALIDATE_WORKOUT(workoutId)) revalidatePath(p);
  return { ok: true };
}

// ─── Bulk delete from history ───

const deleteWorkoutsSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(100),
});

export async function deleteWorkouts(ids: string[]) {
  const user = await getUser();
  const parsed = deleteWorkoutsSchema.safeParse({ ids });
  if (!parsed.success) return { error: "Nieprawidłowe dane" };

  const result = await prisma.workout.deleteMany({
    where: { id: { in: parsed.data.ids }, userId: user.id, isActive: false },
  });

  revalidatePath("/history");
  revalidatePath("/dashboard");
  revalidatePath("/progress");
  revalidatePath("/workout");
  return { ok: true, deletedCount: result.count };
}

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/session";

// ─── List routines ───

export async function getUserRoutines() {
  const user = await getUser();
  return prisma.routine.findMany({
    where: { userId: user.id },
    include: {
      exercises: {
        include: { exercise: { include: { muscles: true } } },
        orderBy: { position: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });
}

// ─── Get single routine ───

export async function getRoutine(id: string) {
  const user = await getUser();
  return prisma.routine.findFirst({
    where: { id, userId: user.id },
    include: {
      exercises: {
        include: { exercise: { include: { muscles: true } } },
        orderBy: { position: "asc" },
      },
    },
  });
}

// ─── Create routine ───

export async function createRoutine(data: { name: string; description?: string }) {
  const user = await getUser();
  const routine = await prisma.routine.create({
    data: {
      userId: user.id,
      name: data.name,
      description: data.description ?? null,
    },
    include: {
      exercises: {
        include: { exercise: { include: { muscles: true } } },
        orderBy: { position: "asc" },
      },
    },
  });
  revalidatePath("/plans");
  return routine;
}

// ─── Update routine ───

export async function updateRoutine(
  id: string,
  data: { name?: string; description?: string }
) {
  const user = await getUser();
  const routine = await prisma.routine.findFirst({
    where: { id, userId: user.id },
  });
  if (!routine) throw new Error("Nie znaleziono planu");

  const updated = await prisma.routine.update({
    where: { id },
    data,
  });
  revalidatePath("/plans");
  revalidatePath(`/plans/${id}`);
  return updated;
}

// ─── Delete routine ───

export async function deleteRoutine(id: string) {
  const user = await getUser();
  const routine = await prisma.routine.findFirst({
    where: { id, userId: user.id },
  });
  if (!routine) throw new Error("Nie znaleziono planu");

  await prisma.routine.delete({ where: { id } });
  revalidatePath("/plans");
}

// ─── Add exercise to routine ───

export async function addExerciseToRoutine(
  routineId: string,
  exerciseId: string,
  data?: { targetSets?: number; targetReps?: string; restSeconds?: number }
) {
  const user = await getUser();
  const routine = await prisma.routine.findFirst({
    where: { id: routineId, userId: user.id },
  });
  if (!routine) throw new Error("Nie znaleziono planu");

  // Validate exercise exists
  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId },
    select: { id: true },
  });
  if (!exercise) throw new Error("Nie znaleziono ćwiczenia");

  // Get next position
  const last = await prisma.routineExercise.findFirst({
    where: { routineId },
    orderBy: { position: "desc" },
  });

  const slot = await prisma.routineExercise.create({
    data: {
      routineId,
      exerciseId,
      position: (last?.position ?? -1) + 1,
      targetSets: data?.targetSets ?? 3,
      targetReps: data?.targetReps ?? "8-12",
      restSeconds: data?.restSeconds ?? 90,
    },
    include: { exercise: { include: { muscles: true } } },
  });

  revalidatePath(`/plans/${routineId}`);
  return slot;
}

// ─── Update routine exercise config ───

export async function updateRoutineExercise(
  id: string,
  data: { targetSets?: number; targetReps?: string; restSeconds?: number }
) {
  const user = await getUser();
  // Verify ownership: check the slot belongs to a routine owned by this user
  const slot = await prisma.routineExercise.findFirst({
    where: { id, routine: { userId: user.id } },
  });
  if (!slot) throw new Error("Nie znaleziono ćwiczenia w planie");

  const updated = await prisma.routineExercise.update({
    where: { id },
    data,
    include: { exercise: { include: { muscles: true } } },
  });
  revalidatePath("/plans");
  return updated;
}

// ─── Remove exercise from routine ───

export async function removeRoutineExercise(id: string, routineId: string) {
  const user = await getUser();
  const routine = await prisma.routine.findFirst({
    where: { id: routineId, userId: user.id },
  });
  if (!routine) throw new Error("Nie znaleziono planu");

  // Verify the slot belongs to this routine
  const slot = await prisma.routineExercise.findFirst({
    where: { id, routineId },
  });
  if (!slot) throw new Error("Ćwiczenie nie należy do tego planu");

  await prisma.routineExercise.delete({ where: { id } });
  revalidatePath(`/plans/${routineId}`);
}

// ─── Reorder exercises ───

export async function reorderRoutineExercises(
  routineId: string,
  orderedIds: string[]
) {
  const user = await getUser();
  const routine = await prisma.routine.findFirst({
    where: { id: routineId, userId: user.id },
  });
  if (!routine) throw new Error("Nie znaleziono planu");

  // Verify all slot IDs belong to this routine
  const existingSlots = await prisma.routineExercise.findMany({
    where: { routineId },
    select: { id: true },
  });
  const existingIds = new Set(existingSlots.map((s) => s.id));

  // Reject if any id is foreign or if there are duplicates
  if (orderedIds.length !== new Set(orderedIds).size) {
    throw new Error("Zduplikowane identyfikatory ćwiczeń");
  }
  for (const id of orderedIds) {
    if (!existingIds.has(id)) {
      throw new Error("Ćwiczenie nie należy do tego planu");
    }
  }

  // Use a transaction to avoid partial updates on failure
  await prisma.$transaction(
    orderedIds.map((id, i) =>
      prisma.routineExercise.update({
        where: { id },
        data: { position: i },
      })
    )
  );

  revalidatePath(`/plans/${routineId}`);
}

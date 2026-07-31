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

export async function createRoutine(data: { name: string; description?: string; source?: string }) {
  const user = await getUser();
  const routine = await prisma.routine.create({
    data: {
      userId: user.id,
      name: data.name,
      description: data.description ?? null,
      source: data.source ?? "manual",
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

// ─── Create routine from template (with exercise lookup) ───

export async function createRoutineFromTemplate(data: {
  name: string;
  description?: string;
  exerciseNames: string[];
}) {
  const user = await getUser();

  // Create the routine
  const routine = await prisma.routine.create({
    data: {
      userId: user.id,
      name: data.name,
      description: data.description ?? null,
      source: "template",
    },
  });

  // Look up exercises by name and create RoutineExercise slots
  const foundExercises = await prisma.exercise.findMany({
    where: {
      name: { in: data.exerciseNames },
    },
    select: { id: true, name: true },
  });

  // Maintain template order — only include exercises that exist in DB
  const ordered = data.exerciseNames
    .map((name, i) => {
      const ex = foundExercises.find(
        (e) => e.name.toLowerCase() === name.toLowerCase()
      );
      return ex ? { exerciseId: ex.id, position: i } : null;
    })
    .filter(Boolean) as { exerciseId: string; position: number }[];

  if (ordered.length > 0) {
    await prisma.routineExercise.createMany({
      data: ordered.map(({ exerciseId, position }) => ({
        routineId: routine.id,
        exerciseId,
        position,
        targetSets: 3,
        targetReps: "8-12",
        restSeconds: 90,
      })),
    });
  }

  revalidatePath("/plans");
  revalidatePath(`/plans/${routine.id}`);

  // Return the full routine with exercises
  return prisma.routine.findFirst({
    where: { id: routine.id },
    include: {
      exercises: {
        include: { exercise: { include: { muscles: true } } },
        orderBy: { position: "asc" },
      },
    },
  });
}

// ─── Update routine ───

export async function updateRoutine(
  id: string,
  data: { name?: string; description?: string | null }
) {
  const user = await getUser();
  const routine = await prisma.routine.findFirst({
    where: { id, userId: user.id },
  });
  if (!routine) throw new Error("Nie znaleziono planu");

  // Explicitly set description to null when empty/undefined to allow clearing
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if ("description" in data) {
    updateData.description = data.description?.trim() || null;
  }

  const updated = await prisma.routine.update({
    where: { id },
    data: updateData,
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
  revalidatePath("/plans");
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
  revalidatePath("/plans");
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
    select: { id: true, position: true },
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

  // Two-phase position update to avoid unique-constraint collisions on SQLite.
  // Phase 1: shift all positions into a temporary range (current + 10000)
  // Phase 2: set final positions
  const OFFSET = 10000;
  await prisma.$transaction([
    ...existingSlots.map((s) =>
      prisma.routineExercise.update({
        where: { id: s.id },
        data: { position: s.position + OFFSET },
      })
    ),
  ]);
  await prisma.$transaction(
    orderedIds.map((id, i) =>
      prisma.routineExercise.update({
        where: { id },
        data: { position: i },
      })
    )
  );

  revalidatePath(`/plans/${routineId}`);
  revalidatePath("/plans");
}

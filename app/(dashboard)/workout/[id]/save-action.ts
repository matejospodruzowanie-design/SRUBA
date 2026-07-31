"use server";

import { prisma } from "@/lib/db";
import { getUser } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function saveWorkoutAsPlan(workoutId: string) {
  const user = await getUser();

  const workout = await prisma.workout.findFirst({
    where: { id: workoutId, userId: user.id },
    include: {
      sets: {
        include: { exercise: true },
        orderBy: [{ exerciseId: "asc" }, { setNumber: "asc" }],
      },
    },
  });

  if (!workout) return { error: "Nie znaleziono treningu" };

  // Collect unique exercises in order of appearance with their set stats
  const exerciseMap = new Map<
    string,
    { exercise: (typeof workout.sets)[number]["exercise"]; setCount: number; maxReps: number }
  >();

  for (const set of workout.sets) {
    const existing = exerciseMap.get(set.exerciseId);
    if (existing) {
      existing.setCount++;
      existing.maxReps = Math.max(existing.maxReps, set.reps);
    } else {
      exerciseMap.set(set.exerciseId, {
        exercise: set.exercise,
        setCount: 1,
        maxReps: set.reps,
      });
    }
  }

  const exercises = Array.from(exerciseMap.values());

  const routine = await prisma.routine.create({
    data: {
      userId: user.id,
      name: workout.name,
      source: "from_workout",
      exercises: {
        create: exercises.map((entry, index) => ({
          exerciseId: entry.exercise.id,
          position: index,
          targetSets: entry.setCount,
          targetReps: String(entry.maxReps),
          restSeconds: 90,
        })),
      },
    },
  });

  revalidatePath("/plans");
  revalidatePath(`/workout/${workoutId}`);
  return { success: true, routineId: routine.id };
}

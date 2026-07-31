"use server";

import { prisma } from "@/lib/db";
import { getUser } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createExerciseSchema = z.object({
  name: z.string().min(1, "Nazwa jest wymagana").max(100),
  muscleGroup: z.string().min(1, "Partia mięśniowa jest wymagana"),
  equipment: z.string().optional(),
  videoUrl: z.string().url("Nieprawidłowy URL").optional().or(z.literal("")),
  instructions: z.string().max(2000).optional(),
});

export async function createCustomExercise(formData: FormData) {
  const user = await getUser();
  const raw = Object.fromEntries(formData);
  const parsed = createExerciseSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { name, muscleGroup, equipment, videoUrl, instructions } = parsed.data;

  const exercise = await prisma.exercise.create({
    data: {
      name,
      equipment: equipment || null,
      videoUrl: videoUrl || null,
      instructions: instructions || null,
      isCustom: true,
      userId: user.id,
      muscles: {
        create: { muscleGroup, isPrimary: true },
      },
    },
  });

  revalidatePath("/exercises");
  return { success: true, exercise };
}

export async function deleteCustomExercise(exerciseId: string) {
  const user = await getUser();

  const exercise = await prisma.exercise.findFirst({
    where: { id: exerciseId, userId: user.id, isCustom: true },
  });
  if (!exercise) {
    return { error: "Nie znaleziono ćwiczenia" };
  }

  await prisma.exercise.delete({ where: { id: exerciseId } });
  revalidatePath("/exercises");
  return { success: true };
}

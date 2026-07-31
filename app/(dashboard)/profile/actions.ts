"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/session";
import { z } from "zod";

const updateProfileSchema = z.object({
  category: z.enum(["powerlifting", "calisthenics", "bodybuilding"]).optional(),
  goal: z.enum(["strength", "mass", "fat_loss", "general"]).optional(),
  experience: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  heightCm: z.number().min(50).max(300).nullable().optional(),
  weightKg: z.number().min(20).max(500).nullable().optional(),
});

export async function updateProfile(data: {
  category?: string;
  goal?: string;
  experience?: string;
  heightCm?: number | null;
  weightKg?: number | null;
}) {
  const user = await getUser();

  const parsed = updateProfileSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "Nieprawidłowe dane profilu" };
  }

  const d = parsed.data;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(d.category !== undefined && { category: d.category }),
      ...(d.goal !== undefined && { goal: d.goal }),
      ...(d.experience !== undefined && { experience: d.experience }),
      ...(d.heightCm !== undefined && { heightCm: d.heightCm }),
      ...(d.weightKg !== undefined && { weightKg: d.weightKg }),
    },
  });

  revalidatePath("/profile");
  revalidatePath("/dashboard");
}

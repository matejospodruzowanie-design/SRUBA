"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/session";

export async function updateProfile(data: {
  category?: string;
  goal?: string;
  experience?: string;
  heightCm?: number | null;
  weightKg?: number | null;
}) {
  const user = await getUser();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(data.category !== undefined && { category: data.category }),
      ...(data.goal !== undefined && { goal: data.goal }),
      ...(data.experience !== undefined && { experience: data.experience }),
      ...(data.heightCm !== undefined && { heightCm: data.heightCm }),
      ...(data.weightKg !== undefined && { weightKg: data.weightKg }),
    },
  });

  revalidatePath("/profile");
  revalidatePath("/dashboard");
}

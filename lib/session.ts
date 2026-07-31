import "server-only";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { cache } from "react";

export const getUser = cache(async () => {
  const session = await getSession();
  if (!session?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      xp: true,
      level: true,
      rank: true,
      category: true,
      goal: true,
      experience: true,
      heightCm: true,
      weightKg: true,
      streak: true,
      lastWorkoutAt: true,
      createdAt: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  return user;
});

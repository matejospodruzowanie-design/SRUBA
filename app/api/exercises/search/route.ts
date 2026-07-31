import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const query = params.get("q");
  const muscle = params.get("muscle");
  const limit = parseInt(params.get("limit") ?? "50");
  const recent = params.get("recent") === "true";

  const where: Record<string, unknown> = {};
  if (query) {
    where.name = { contains: query };
  }
  if (muscle) {
    where.muscles = { some: { muscleGroup: muscle } };
  }

  // "Recent" mode — find exercises ordered by most recently used in any workout
  if (recent) {
    const recentSets = await prisma.workoutSet.findMany({
      where: { workout: { isActive: false } },
      select: { exerciseId: true },
      orderBy: { completedAt: "desc" },
      take: 100,
    });
    const seenIds = new Set<string>();
    const recentIds: string[] = [];
    for (const s of recentSets) {
      if (!seenIds.has(s.exerciseId)) {
        seenIds.add(s.exerciseId);
        recentIds.push(s.exerciseId);
        if (recentIds.length >= limit) break;
      }
    }
    if (recentIds.length > 0) {
      const exercises = await prisma.exercise.findMany({
        where: { id: { in: recentIds } },
        select: {
          id: true,
          name: true,
          equipment: true,
          videoUrl: true,
          muscles: { select: { muscleGroup: true, isPrimary: true } },
        },
        take: Math.min(limit, 100),
      });
      // Sort by recency order (preserve the order from recentIds)
      const orderMap = new Map(recentIds.map((id, i) => [id, i]));
      exercises.sort((a, b) => (orderMap.get(a.id) ?? 99) - (orderMap.get(b.id) ?? 99));
      return Response.json(exercises);
    }
  }

  const exercises = await prisma.exercise.findMany({
    where,
    select: {
      id: true,
      name: true,
      equipment: true,
      videoUrl: true,
      muscles: { select: { muscleGroup: true, isPrimary: true } },
    },
    take: Math.min(limit, 100),
    orderBy: { name: "asc" },
  });

  return Response.json(exercises);
}

import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  const userId = session?.id;

  const params = req.nextUrl.searchParams;
  const query = params.get("q");
  const muscle = params.get("muscle");
  const rawLimit = parseInt(params.get("limit") ?? "50");
  const limit = isNaN(rawLimit) || rawLimit < 1 ? 50 : Math.min(rawLimit, 100);
  const recent = params.get("recent") === "true";

  const where: Record<string, unknown> = {};
  if (query) {
    where.name = { contains: query };
  }
  if (muscle) {
    where.muscles = { some: { muscleGroup: muscle } };
  }

  // "Recent" mode — find exercises ordered by most recently used by the current user
  if (recent) {
    const recentWhere: Record<string, unknown> = { workout: { isActive: false } };
    if (userId) {
      recentWhere.workout = { ...(recentWhere.workout as Record<string, unknown>), userId };
    }

    const recentSets = await prisma.workoutSet.findMany({
      where: recentWhere,
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
      // Apply query/muscle filters on top of recent IDs
      const exerciseWhere: Record<string, unknown> = { id: { in: recentIds } };
      if (query) exerciseWhere.name = { contains: query };
      if (muscle) exerciseWhere.muscles = { some: { muscleGroup: muscle } };

      const exercises = await prisma.exercise.findMany({
        where: exerciseWhere,
        select: {
          id: true,
          name: true,
          equipment: true,
          videoUrl: true,
          muscles: { select: { muscleGroup: true, isPrimary: true } },
        },
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
    take: limit,
    orderBy: { name: "asc" },
  });

  return Response.json(exercises);
}

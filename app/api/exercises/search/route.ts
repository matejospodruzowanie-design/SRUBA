import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const query = params.get("q");
  const muscle = params.get("muscle");
  const limit = parseInt(params.get("limit") ?? "50");

  const where: Record<string, unknown> = {};
  if (query) {
    where.name = { contains: query };
  }
  if (muscle) {
    where.muscles = { some: { muscleGroup: muscle } };
  }

  const exercises = await prisma.exercise.findMany({
    where,
    include: { muscles: { select: { muscleGroup: true, isPrimary: true } } },
    take: Math.min(limit, 100),
    orderBy: { name: "asc" },
  });

  return Response.json(exercises);
}

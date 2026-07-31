import { prisma } from "@/lib/db";
import { epley1RM } from "@/lib/fitness-utils";

export type PrType = "weight" | "est1rm" | "volume" | "reps";

export interface PrResult {
  isNew: boolean;
  type: PrType;
  exerciseName: string;
  newValue: number;
  previousValue: number | null;
}

/**
 * Check and upsert a personal record for a user+exercise+type combination.
 * Returns the PR result with comparison info.
 */
export async function checkAndUpsertPr(
  userId: string,
  exerciseId: string,
  exerciseName: string,
  type: PrType,
  value: number,
  workoutId: string
): Promise<PrResult | null> {
  if (value <= 0) return null;

  const existing = await prisma.personalRecord.findUnique({
    where: {
      userId_exerciseId_type: { userId, exerciseId, type },
    },
  });

  const isNew = !existing || value > existing.value;

  if (isNew) {
    await prisma.personalRecord.upsert({
      where: {
        userId_exerciseId_type: { userId, exerciseId, type },
      },
      create: {
        userId,
        exerciseId,
        type,
        value,
        workoutId,
      },
      update: {
        value,
        workoutId,
        achievedAt: new Date(),
      },
    });
  }

  return {
    isNew,
    type,
    exerciseName,
    newValue: value,
    previousValue: existing?.value ?? null,
  };
}

/**
 * Calculate all PR types for a completed set and check each.
 */
export async function checkSetPrs(
  userId: string,
  exerciseId: string,
  exerciseName: string,
  weightKg: number | null,
  reps: number,
  workoutId: string
): Promise<PrResult[]> {
  const results: PrResult[] = [];

  // Weight PR
  if (weightKg && weightKg > 0) {
    const weightPr = await checkAndUpsertPr(
      userId, exerciseId, exerciseName, "weight", weightKg, workoutId
    );
    if (weightPr) results.push(weightPr);

    // Estimated 1RM PR
    const est1rm = epley1RM(weightKg, reps);
    const est1rmPr = await checkAndUpsertPr(
      userId, exerciseId, exerciseName, "est1rm", est1rm, workoutId
    );
    if (est1rmPr) results.push(est1rmPr);

    // Volume PR (weight × reps)
    const volume = weightKg * reps;
    const volumePr = await checkAndUpsertPr(
      userId, exerciseId, exerciseName, "volume", volume, workoutId
    );
    if (volumePr) results.push(volumePr);
  }

  // Reps PR (most reps ever for this exercise)
  const repsPr = await checkAndUpsertPr(
    userId, exerciseId, exerciseName, "reps", reps, workoutId
  );
  if (repsPr) results.push(repsPr);

  return results.filter((r) => r.isNew);
}

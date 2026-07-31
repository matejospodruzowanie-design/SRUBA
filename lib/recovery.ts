/**
 * Muscle recovery server functions — uses Prisma to fetch training data.
 */
import { prisma } from "@/lib/db";
import {
  calculateFatiguePct,
  readinessPct,
  type TrainingStimulus,
} from "./recovery-utils";

export interface MuscleStimulus {
  muscleGroup: string;
  totalVolume: number;
  lastTrainedAt: Date;
  readiness: number;
}

/**
 * Fetch recent training stimuli and calculate recovery status per muscle group.
 */
export async function getMuscleRecovery(
  userId: string,
  hoursBack = 96
): Promise<MuscleStimulus[]> {
  const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

  const sets = await prisma.workoutSet.findMany({
    where: {
      workout: { userId, isActive: false },
      completedAt: { gte: since },
      weightKg: { not: null },
    },
    include: {
      exercise: {
        include: { muscles: { where: { isPrimary: true } } },
      },
    },
    orderBy: { completedAt: "asc" },
  });

  const perMuscle = new Map<
    string,
    { totalVolume: number; lastTrainedAt: Date }
  >();

  for (const set of sets) {
    const volume = (set.weightKg ?? 0) * set.reps;
    for (const muscle of set.exercise.muscles) {
      const existing = perMuscle.get(muscle.muscleGroup);
      if (existing) {
        existing.totalVolume += volume;
        if (set.completedAt > existing.lastTrainedAt) {
          existing.lastTrainedAt = set.completedAt;
        }
      } else {
        perMuscle.set(muscle.muscleGroup, {
          totalVolume: volume,
          lastTrainedAt: set.completedAt,
        });
      }
    }
  }

  const now = new Date();
  const result: MuscleStimulus[] = [];

  for (const [group, data] of perMuscle) {
    const stimuli: TrainingStimulus[] = [
      {
        muscleGroup: group,
        totalVolume: data.totalVolume,
        lastTrainedAt: data.lastTrainedAt,
      },
    ];
    const fatigueMap = calculateFatiguePct(stimuli, now);
    const fatigue = fatigueMap.get(group) ?? 0;
    const readiness = readinessPct(fatigue);

    result.push({
      muscleGroup: group,
      totalVolume: Math.round(data.totalVolume),
      lastTrainedAt: data.lastTrainedAt,
      readiness,
    });
  }

  result.sort((a, b) => a.readiness - b.readiness);
  return result;
}

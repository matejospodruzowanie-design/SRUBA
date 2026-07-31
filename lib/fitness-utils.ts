/**
 * Core fitness calculations — pure functions, no DB access.
 */

/** Epley formula for estimated 1-rep max */
export function epley1RM(weightKg: number, reps: number): number {
  if (reps <= 0) return 0;
  if (reps === 1) return weightKg;
  return Math.round(weightKg * (1 + reps / 30) * 10) / 10;
}

/** Total volume of a single set */
export function setVolume(weightKg: number | null, reps: number): number {
  return (weightKg ?? 0) * reps;
}

/**
 * Plate calculator — greedy algorithm.
 * Returns plates per side for a standard 20kg barbell.
 */
export function plateCalculator(
  targetKg: number,
  barWeight = 20
): { perSide: number[]; total: number } {
  const availablePlates = [25, 20, 15, 10, 5, 2.5, 1.25];
  let remaining = (targetKg - barWeight) / 2; // per side
  const perSide: number[] = [];

  for (const plate of availablePlates) {
    while (remaining >= plate) {
      perSide.push(plate);
      remaining = Math.round((remaining - plate) * 100) / 100;
    }
  }

  const total =
    barWeight + perSide.reduce((sum, p) => sum + p * 2, 0);
  return { perSide, total: Math.round(total * 100) / 100 };
}

/**
 * Recommended rest time between sets (seconds).
 * Heavy compound lifts need more rest.
 */
const COMPOUND_EXERCISES = [
  "przysiad", "squat", "martwy", "deadlift", "wyciskanie", "bench",
  "ohp", "wiosłowanie", "row", "podciąganie", "pull up", "dip",
];

export function recommendedRest(
  exerciseName: string,
  equipment: string | null,
  rpe: number | null
): number {
  const name = exerciseName.toLowerCase();
  const isCompound = COMPOUND_EXERCISES.some((c) => name.includes(c));
  const isBarbell = equipment === "barbell";

  let base = 90; // default 90s
  if (isCompound && isBarbell) base = 180;
  else if (isCompound) base = 120;
  else if (equipment === "machine") base = 60;

  // Scale up for high intensity
  if (rpe && rpe >= 9) base += 60;
  if (rpe && rpe >= 9.5) base += 30;

  return base;
}

/**
 * Auto-progression: suggest next weight based on last performance.
 * Returns null if no change is recommended.
 */
export interface SetHistory {
  weightKg: number | null;
  reps: number;
  rpe: number | null;
}

export function nextWeightSuggestion(
  lastSets: SetHistory[],
  targetRepsMin: number,
  targetRepsMax: number
): { weight: number; reason: string } | null {
  if (lastSets.length === 0) return null;

  const bestSet = lastSets.reduce((best, s) => {
    const vol = setVolume(s.weightKg, s.reps);
    const bestVol = setVolume(best.weightKg, best.reps);
    return vol > bestVol ? s : best;
  });

  const weight = bestSet.weightKg ?? 0;
  if (weight === 0) return null;

  // If reps exceeded target range, suggest increasing weight
  if (bestSet.reps > targetRepsMax) {
    const increment = weight >= 100 ? 5 : weight >= 50 ? 2.5 : 1.25;
    return {
      weight: Math.round((weight + increment) * 100) / 100,
      reason: `Ostatnio ${weight}kg × ${bestSet.reps} powt. (cel: ${targetRepsMin}-${targetRepsMax}). Spróbuj zwiększyć ciężar.`,
    };
  }

  // If reps within target range and RPE manageable, suggest small increase
  if (
    bestSet.reps >= targetRepsMin &&
    bestSet.reps <= targetRepsMax &&
    bestSet.rpe != null &&
    bestSet.rpe <= 7
  ) {
    return {
      weight: Math.round((weight + 2.5) * 100) / 100,
      reason: `RPE ${bestSet.rpe} przy ${weight}kg — jest zapas. Spróbuj +2.5kg.`,
    };
  }

  // If reps below target, suggest same weight
  if (bestSet.reps < targetRepsMin) {
    return {
      weight,
      reason: `Zostań przy ${weight}kg i spróbuj dobić do ${targetRepsMin} powtórzeń.`,
    };
  }

  return null;
}

/** Format seconds as mm:ss */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Calculate workout duration in seconds */
export function workoutDuration(
  startedAt: Date,
  endedAt: Date
): number {
  return Math.round((endedAt.getTime() - startedAt.getTime()) / 1000);
}

/** Format duration as human readable */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

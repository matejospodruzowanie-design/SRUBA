/**
 * Muscle recovery pure utility functions — safe for client components.
 */

export const MUSCLE_RECOVERY: Record<string, { tauHours: number; label: string }> = {
  // Primary keys
  quadriceps: { tauHours: 48, label: "Czworogłowe" },
  quads: { tauHours: 48, label: "Czworogłowe" },
  hamstrings: { tauHours: 48, label: "Dwugłowe" },
  glutes: { tauHours: 42, label: "Pośladki" },
  back: { tauHours: 48, label: "Plecy" },
  chest: { tauHours: 36, label: "Klatka" },
  shoulders: { tauHours: 30, label: "Barki" },
  triceps: { tauHours: 24, label: "Triceps" },
  biceps: { tauHours: 24, label: "Biceps" },
  forearms: { tauHours: 20, label: "Przedramiona" },
  calves: { tauHours: 24, label: "Łydki" },
  abdominals: { tauHours: 24, label: "Brzuch" },
  abs: { tauHours: 24, label: "Brzuch" },
  traps: { tauHours: 30, label: "Kaptury" },
  lower_back: { tauHours: 36, label: "Dolny odcinek pleców" },
  other: { tauHours: 24, label: "Inne" },
};

export interface TrainingStimulus {
  muscleGroup: string;
  totalVolume: number;
  lastTrainedAt: Date;
}

export function calculateFatiguePct(
  stimuli: TrainingStimulus[],
  now: Date = new Date()
): Map<string, number> {
  const result = new Map<string, number>();

  for (const s of stimuli) {
    const hoursSince =
      (now.getTime() - s.lastTrainedAt.getTime()) / (1000 * 60 * 60);
    const recovery = MUSCLE_RECOVERY[s.muscleGroup] ?? MUSCLE_RECOVERY.other;
    const tau = recovery.tauHours;
    const intensity = Math.min(1, s.totalVolume / 5000);
    const fatigue = Math.round(intensity * Math.exp(-hoursSince / tau) * 100);
    result.set(s.muscleGroup, fatigue);
  }

  return result;
}

export function readinessPct(fatiguePct: number): number {
  return Math.max(0, 100 - fatiguePct);
}

export function recoveryColor(readiness: number): string {
  if (readiness >= 80) return "#22c55e";
  if (readiness >= 50) return "#eab308";
  if (readiness >= 25) return "#f97316";
  return "#ef4444";
}

export function recoveryLabel(readiness: number): string {
  if (readiness >= 80) return "Gotowy";
  if (readiness >= 50) return "Regeneracja";
  if (readiness >= 25) return "Zmęczony";
  return "Przetrenowany";
}

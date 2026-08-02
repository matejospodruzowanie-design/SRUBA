import { getActiveWorkout, startWorkoutFromPlan, getLastSets } from "./actions";
import { getUser } from "@/lib/session";
import { ActiveWorkout } from "@/components/workout/active-workout";

interface Props {
  searchParams: Promise<{ planId?: string }>;
}

export default async function WorkoutPage({ searchParams }: Props) {
  const user = await getUser();

  // Check for active workout first
  const activeWorkout = await getActiveWorkout();

  if (activeWorkout) {
    // Extract unique exercises from sets to restore the exercise list
    // Preserve order of first appearance (not alphabetical)
    const seen = new Set<string>();
    const resumedExercises: Array<{
      id: string;
      name: string;
      equipment: string | null;
      muscles: { muscleGroup: string; isPrimary: boolean }[];
    }> = [];
    for (const s of activeWorkout.sets) {
      if (!seen.has(s.exercise.id)) {
        seen.add(s.exercise.id);
        resumedExercises.push({
          id: s.exercise.id,
          name: s.exercise.name,
          equipment: s.exercise.equipment,
          muscles: s.exercise.muscles,
        });
      }
    }

    // Fetch last sets for autofill (full previous session — Hevy/Strong-style)
    const lastExercises = await Promise.all(
      resumedExercises.map(async (ex) => {
        const lastSets = await getLastSets(ex.id, 5);
        const last = lastSets[0];
        return {
          exerciseId: ex.id,
          weightKg: last?.weightKg ?? null,
          reps: last?.reps ?? null,
          sets: lastSets.map((s) => ({ weightKg: s.weightKg, reps: s.reps })),
        };
      })
    );

    return (
      <ActiveWorkout
        initialWorkout={{
          id: activeWorkout.id,
          name: activeWorkout.name,
          startedAt: activeWorkout.startedAt,
          sets: activeWorkout.sets.map((s) => ({
            ...s,
            completedAt: s.completedAt,
            exercise: {
              id: s.exercise.id,
              name: s.exercise.name,
              equipment: s.exercise.equipment,
              muscles: s.exercise.muscles,
            },
          })),
        }}
        initialExercises={resumedExercises}
        lastExercises={lastExercises}
      />
    );
  }

  // Check if starting from a plan
  const { planId } = await searchParams;
  if (planId) {
    try {
      const result = await startWorkoutFromPlan(planId);

      if ("conflict" in result && result.conflict) {
        // Conflict detected — pass planId so the client can retry with forceDiscard
        // We need to re-fetch the plan exercises to display them
        const routine = await import("../plans/actions").then((m) =>
          m.getRoutine(planId)
        );
        const planExercises = routine?.exercises.map((slot) => ({
          id: slot.exercise.id,
          name: slot.exercise.name,
          equipment: slot.exercise.equipment,
          muscles: slot.exercise.muscles,
          targetSets: slot.targetSets,
          targetReps: slot.targetReps,
          restSeconds: slot.restSeconds,
        })) ?? [];

        return (
          <ActiveWorkout
            initialWorkout={null}
            initialExercises={planExercises}
            lastExercises={[]}
            planId={planId}
          />
        );
      }

      const { workout, planExercises } = result as { workout: { id: string; name: string; startedAt: Date }; planExercises: Array<{ id: string; name: string; equipment: string | null; muscles: Array<{ muscleGroup: string; isPrimary: boolean }>; targetSets?: number; targetReps?: string; restSeconds?: number }> };

      // Fetch last sets for autofill (full previous session — Hevy/Strong-style)
      const lastExercises = await Promise.all(
        planExercises.map(async (ex) => {
          const lastSets = await getLastSets(ex.id, 5);
          const last = lastSets[0];
          return {
            exerciseId: ex.id,
            weightKg: last?.weightKg ?? null,
            reps: last?.reps ?? null,
            sets: lastSets.map((s) => ({ weightKg: s.weightKg, reps: s.reps })),
          };
        })
      );

      return (
        <ActiveWorkout
          initialWorkout={{
            id: workout.id,
            name: workout.name,
            startedAt: workout.startedAt,
            sets: [],
          }}
          initialExercises={planExercises}
          lastExercises={lastExercises}
        />
      );
    } catch {
      // Plan not found — fall through to empty state
    }
  }

  return (
    <ActiveWorkout
      initialWorkout={null}
      initialExercises={[]}
      lastExercises={[]}
    />
  );
}

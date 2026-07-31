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

    // Fetch last sets for autofill
    const lastExercises = await Promise.all(
      resumedExercises.map(async (ex) => {
        const lastSets = await getLastSets(ex.id, 1);
        const last = lastSets[0];
        return {
          exerciseId: ex.id,
          weightKg: last?.weightKg ?? null,
          reps: last?.reps ?? null,
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
      const { workout, planExercises } = await startWorkoutFromPlan(planId);

      // Fetch last sets for autofill
      const lastExercises = await Promise.all(
        planExercises.map(async (ex) => {
          const lastSets = await getLastSets(ex.id, 1);
          const last = lastSets[0];
          return {
            exerciseId: ex.id,
            weightKg: last?.weightKg ?? null,
            reps: last?.reps ?? null,
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

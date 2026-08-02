import { prisma } from "@/lib/db";
import { getUser } from "@/lib/session";
import { notFound } from "next/navigation";
import { WorkoutEditor } from "@/components/workout/workout-editor";

export default async function EditWorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUser();

  // Editing is only supported for finished workouts (active ones live in /workout)
  const workout = await prisma.workout.findFirst({
    where: { id, userId: user.id, isActive: false },
    include: {
      sets: {
        include: { exercise: true },
        orderBy: [{ exerciseId: "asc" }, { setNumber: "asc" }],
      },
    },
  });

  if (!workout) notFound();

  return (
    <WorkoutEditor
      workout={{
        id: workout.id,
        name: workout.name,
        notes: workout.notes,
        startedAt: workout.startedAt,
        endedAt: workout.endedAt,
        durationSeconds: workout.durationSeconds,
        sets: workout.sets.map((s) => ({
          id: s.id,
          setNumber: s.setNumber,
          weightKg: s.weightKg,
          reps: s.reps,
          rpe: s.rpe,
          isWarmup: s.isWarmup,
          exercise: { id: s.exercise.id, name: s.exercise.name },
        })),
      }}
    />
  );
}

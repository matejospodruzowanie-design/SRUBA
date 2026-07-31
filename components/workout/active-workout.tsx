"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Flag, Dumbbell } from "lucide-react";
import { ExercisePicker } from "./exercise-picker";
import { SetLogger } from "./set-logger";
import { RestTimer } from "./rest-timer";
import { FinishModal } from "./finish-modal";
import { startWorkout } from "@/app/(dashboard)/workout/actions";
import { recommendedRest, formatTime } from "@/lib/fitness-utils";
import { toast } from "sonner";

interface Exercise {
  id: string;
  name: string;
  equipment: string | null;
  muscles: { muscleGroup: string; isPrimary: boolean }[];
}

interface SetWithExercise {
  id: string;
  workoutId: string;
  exerciseId: string;
  exercise: Exercise;
  setNumber: number;
  weightKg: number | null;
  reps: number;
  rpe: number | null;
  completedAt: Date;
  isPR: boolean;
}

interface PlanExercise {
  id: string;
  name: string;
  equipment: string | null;
  muscles: { muscleGroup: string; isPrimary: boolean }[];
  targetSets?: number;
  targetReps?: string;
  restSeconds?: number;
}

interface Props {
  initialWorkout: {
    id: string;
    name: string;
    startedAt: Date;
    sets: SetWithExercise[];
  } | null;
  initialExercises: PlanExercise[];
  lastExercises: { exerciseId: string; weightKg: number | null; reps: number }[];
}

export function ActiveWorkout({ initialWorkout, initialExercises, lastExercises }: Props) {
  const router = useRouter();
  const [workoutId, setWorkoutId] = useState<string | null>(initialWorkout?.id ?? null);
  const [workoutName, setWorkoutName] = useState(initialWorkout?.name ?? "");
  const [startedAt] = useState<Date>(
    initialWorkout?.startedAt ? new Date(initialWorkout.startedAt) : new Date()
  );
  const [exercises, setExercises] = useState<
    { id: string; name: string; equipment: string | null }[]
  >(initialExercises.map((e) => ({ id: e.id, name: e.name, equipment: e.equipment })));
  const [allSets, setAllSets] = useState<SetWithExercise[]>(initialWorkout?.sets ?? []);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(
    initialExercises.length > 0 ? initialExercises[0].id : null
  );
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restSeconds, setRestSeconds] = useState(
    initialExercises[0]?.restSeconds ?? 90
  );
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [workoutNotes, setWorkoutNotes] = useState("");
  const [elapsed, setElapsed] = useState(0);

  // Start the workout if not already started
  const handleStart = useCallback(async () => {
    const name = workoutName.trim() || `Trening ${new Date().toLocaleDateString("pl-PL")}`;
    const workout = await startWorkout(name, workoutNotes || undefined);
    setWorkoutId(workout.id);
    setWorkoutName(workout.name);
  }, [workoutName, workoutNotes]);

  // Timer that updates elapsed time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(
        Math.round((Date.now() - new Date(startedAt).getTime()) / 1000)
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  const handleAddExercise = (exercise: Exercise) => {
    if (!exercises.find((e) => e.id === exercise.id)) {
      setExercises([...exercises, { id: exercise.id, name: exercise.name, equipment: exercise.equipment }]);
      setSelectedExerciseId(exercise.id);
    }
    setPickerOpen(false);
  };

  const handleSetAdded = (prs: unknown[]) => {
    if (prs.length > 0) {
      prs.forEach((pr: unknown) => {
        const p = pr as { exerciseName: string; type: string; newValue: number };
        toast.success(`🔥 Nowy rekord: ${p.exerciseName} — ${p.type}: ${p.newValue}!`);
      });
    }
    // Show rest timer
    const currentExercise = exercises.find((e) => e.id === selectedExerciseId);
    if (currentExercise) {
      const rest = recommendedRest(
        currentExercise.name,
        currentExercise.equipment,
        null
      );
      setRestSeconds(rest);
      setShowRestTimer(true);
    }
  };

  const handleSkipRest = () => {
    setShowRestTimer(false);
  };

  const handleFinish = () => {
    setShowFinishModal(true);
  };

  const handleCloseFinish = () => {
    setShowFinishModal(false);
    router.push("/history");
    router.refresh();
  };

  // If no workout started yet, show name input
  if (!workoutId) {
    return (
      <div className="space-y-6 max-w-lg mx-auto">
        <div>
          <h1 className="text-2xl font-bold">Nowy trening</h1>
          <p className="text-muted-foreground mt-1">Nazwij swój trening i zacznij</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Nazwa treningu
            </label>
            <input
              type="text"
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              placeholder={`np. Push Day, Nogi, Pull...`}
              className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm mt-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              onKeyDown={(e) => e.key === "Enter" && handleStart()}
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {["Push", "Pull", "Nogi", "Full Body", "Upper", "Lower"].map((name) => (
              <button
                key={name}
                onClick={() => { setWorkoutName(name); }}
                className="rounded-full border border-border px-4 py-1.5 text-xs text-muted-foreground hover:border-amber-500/30 hover:text-amber-400 transition-colors"
              >
                {name}
              </button>
            ))}
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Notatki (opcjonalnie)</label>
            <textarea
              value={workoutNotes}
              onChange={(e) => setWorkoutNotes(e.target.value)}
              placeholder="np. Cel na dziś, samopoczucie..."
              rows={2}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
            />
          </div>

          <button
            onClick={handleStart}
            className="w-full rounded-lg bg-amber-500 py-3 text-sm font-semibold text-black hover:bg-amber-400 transition-colors"
          >
            Rozpocznij trening
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{workoutName}</h1>
          <p className="text-xs text-muted-foreground">
            ⏱ {formatTime(elapsed)} · {exercises.length} ćwiczeń · {allSets.length} serii
          </p>
        </div>
        <button
          onClick={handleFinish}
          className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400 transition-colors"
        >
          <Flag className="h-4 w-4" /> Zakończ
        </button>
      </div>

      {/* Exercise list */}
      {exercises.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Dumbbell className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-4">
            Dodaj pierwsze ćwiczenie do treningu
          </p>
          <button
            onClick={() => setPickerOpen(true)}
            className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400 transition-colors"
          >
            <Plus className="h-4 w-4" /> Dodaj ćwiczenie
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {exercises.map((exercise) => (
            <button
              key={exercise.id}
              onClick={() => {
                setSelectedExerciseId(exercise.id);
                setShowRestTimer(false);
              }}
              className={`w-full text-left rounded-xl border p-4 transition-colors ${
                selectedExerciseId === exercise.id
                  ? "border-amber-500/50 bg-amber-500/5"
                  : "border-border bg-card hover:border-amber-500/20"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{exercise.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span>
                      {allSets.filter((s) => s.exerciseId === exercise.id && !s.id.startsWith("optimistic")).length} serii
                    </span>
                    {allSets.filter((s) => s.exerciseId === exercise.id).length > 0 && (
                      <span className="text-amber-400/70 tabular-nums">
                        {allSets
                          .filter((s) => s.exerciseId === exercise.id)
                          .map((s) => (s.weightKg ? `${s.weightKg}×${s.reps}` : `${s.reps}`))
                          .join(" · ")}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-muted-foreground text-xs ml-2 flex-shrink-0">
                  {selectedExerciseId === exercise.id ? "▼" : "▶"}
                </span>
              </div>

              {selectedExerciseId === exercise.id && (
                <div className="mt-4">
                  <SetLogger
                    workoutId={workoutId}
                    exerciseId={exercise.id}
                    exerciseName={exercise.name}
                    sets={allSets as unknown as Array<{ id: string; workoutId: string; exerciseId: string; exercise: { id: string; name: string; equipment: string | null; muscles: Array<{ muscleGroup: string; isPrimary: boolean }> }; setNumber: number; weightKg: number | null; reps: number; rpe: number | null; completedAt: Date; isPR: boolean }>}
                    lastWeight={
                      lastExercises.find((le) => le.exerciseId === exercise.id)?.weightKg ?? null
                    }
                    lastReps={
                      lastExercises.find((le) => le.exerciseId === exercise.id)?.reps ?? null
                    }
                    onSetAdded={handleSetAdded}
                  />
                </div>
              )}
            </button>
          ))}

          <button
            onClick={() => setPickerOpen(true)}
            className="w-full rounded-lg border border-dashed border-border py-3 text-sm text-muted-foreground hover:border-amber-500/30 hover:text-amber-400 transition-colors"
          >
            <Plus className="h-4 w-4 inline mr-1" /> Dodaj ćwiczenie
          </button>
        </div>
      )}

      {/* Rest timer overlay */}
      {showRestTimer && (
        <div className="fixed bottom-20 left-4 right-4 z-40 lg:left-auto lg:right-4 lg:bottom-4 lg:w-80">
          <RestTimer
            defaultSeconds={restSeconds}
            onComplete={() => setShowRestTimer(false)}
            onSkip={handleSkipRest}
          />
        </div>
      )}

      {/* Exercise picker modal */}
      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleAddExercise}
        workoutExerciseIds={exercises.map((e) => e.id)}
      />

      {/* Finish modal */}
      {showFinishModal && (
        <FinishModal
          workoutId={workoutId}
          setCount={allSets.length}
          onClose={handleCloseFinish}
        />
      )}
    </div>
  );
}

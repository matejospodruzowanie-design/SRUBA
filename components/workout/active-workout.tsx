"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Flag, Dumbbell, Target, X } from "lucide-react";
import { ExercisePicker } from "./exercise-picker";
import { SetLogger } from "./set-logger";
import { RestTimer } from "./rest-timer";
import { FinishModal } from "./finish-modal";
import { startWorkout, removeExerciseFromWorkout } from "@/app/(dashboard)/workout/actions";
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
    { id: string; name: string; equipment: string | null; targetSets?: number; targetReps?: string; restSeconds?: number }[]
  >(initialExercises.map((e) => ({
    id: e.id, name: e.name, equipment: e.equipment,
    targetSets: e.targetSets, targetReps: e.targetReps, restSeconds: e.restSeconds,
  })));
  const [allSets, setAllSets] = useState<SetWithExercise[]>(initialWorkout?.sets ?? []);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restSeconds, setRestSeconds] = useState(initialExercises[0]?.restSeconds ?? 90);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [workoutNotes, setWorkoutNotes] = useState("");
  const [elapsed, setElapsed] = useState(0);

  // ─── Start workout ───
  const handleStart = useCallback(async (forceDiscard = false) => {
    const name = workoutName.trim() || `Trening ${new Date().toLocaleDateString("pl-PL")}`;
    const result = await startWorkout(name, workoutNotes || undefined, forceDiscard);

    if ("conflict" in result && result.conflict) {
      const existing = result.existingWorkout;
      if (confirm(`Masz aktywny trening "${existing.name}" z ${existing.setCount} seriami. Czy chcesz go porzucić i zacząć nowy?`)) {
        const forced = await startWorkout(name, workoutNotes || undefined, true);
        if ("id" in forced) {
          setWorkoutId(forced.id);
          setWorkoutName(forced.name);
        }
      }
      return;
    }

    if ("id" in result) {
      setWorkoutId(result.id);
      setWorkoutName(result.name);
    }
  }, [workoutName, workoutNotes]);

  // ─── Elapsed timer ───
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.round((Date.now() - new Date(startedAt).getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  // ─── Volume (kg) ───
  const totalVolume = allSets
    .filter((s) => !s.id.startsWith("optimistic"))
    .reduce((sum, s) => sum + (s.weightKg ?? 0) * s.reps, 0);

  // ─── Add exercise ───
  const handleAddExercise = (exercise: Exercise) => {
    if (!exercises.find((e) => e.id === exercise.id)) {
      setExercises([...exercises, { id: exercise.id, name: exercise.name, equipment: exercise.equipment, targetSets: undefined, targetReps: undefined, restSeconds: undefined }]);
    }
    setPickerOpen(false);
  };

  // ─── Remove exercise ───
  const handleRemoveExercise = (exerciseId: string, exerciseName: string) => {
    if (!workoutId) return;
    if (!confirm(`Usunąć "${exerciseName}" z treningu? Wszystkie jego serie zostaną utracone.`)) return;
    setExercises((prev) => prev.filter((e) => e.id !== exerciseId));
    setAllSets((prev) => prev.filter((s) => s.exerciseId !== exerciseId));
    removeExerciseFromWorkout(workoutId, exerciseId);
  };

  // ─── Set added → show rest timer ───
  const handleSetAdded = (exerciseId: string, exerciseName: string, equipment: string | null, prs: unknown[], setRpe?: number) => {
    if (prs.length > 0) {
      prs.forEach((pr: unknown) => {
        const p = pr as { exerciseName: string; type: string; newValue: number };
        toast.success(`🔥 Nowy rekord: ${p.exerciseName} — ${p.type}: ${p.newValue}!`);
      });
    }
    // Auto-start rest timer with recommended rest (using actual RPE from the set)
    const rest = recommendedRest(exerciseName, equipment, setRpe ?? null);
    setRestSeconds(rest);
    setShowRestTimer(true);
  };

  const handleSkipRest = () => setShowRestTimer(false);
  const handleFinish = () => setShowFinishModal(true);
  const handleCloseFinish = () => {
    setShowFinishModal(false);
    router.push("/history");
    router.refresh();
  };

  // ─── No workout yet ───
  if (!workoutId) {
    return (
      <div className="space-y-6 max-w-lg mx-auto">
        <div>
          <h1 className="text-2xl font-bold">Nowy trening</h1>
          <p className="text-muted-foreground mt-1">Nazwij swój trening i zacznij</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Nazwa treningu</label>
            <input
              type="text" value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              placeholder="np. Push Day, Nogi, Pull..."
              className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm mt-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              onKeyDown={(e) => e.key === "Enter" && handleStart()}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {["Push", "Pull", "Nogi", "Full Body", "Upper", "Lower"].map((name) => (
              <button key={name} onClick={() => setWorkoutName(name)}
                className="rounded-full border border-border px-4 py-1.5 text-xs text-muted-foreground hover:border-amber-500/30 hover:text-amber-400 transition-colors">
                {name}
              </button>
            ))}
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Notatki (opcjonalnie)</label>
            <textarea value={workoutNotes} onChange={(e) => setWorkoutNotes(e.target.value)}
              placeholder="np. Cel na dziś, samopoczucie..." rows={2}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none" />
          </div>
          <button onClick={() => handleStart()}
            className="w-full rounded-lg bg-amber-500 py-3 text-sm font-semibold text-black hover:bg-amber-400 transition-colors">
            Rozpocznij trening
          </button>
        </div>
      </div>
    );
  }

  // ─── Active workout ───
  return (
    <div className="space-y-3 max-w-2xl mx-auto pb-24">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 -mx-4 px-4 py-3 bg-[var(--background)]/95 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">{workoutName}</h1>
            <p className="text-[11px] text-muted-foreground flex items-center gap-2 flex-wrap">
              <span>⏱ {formatTime(elapsed)}</span>
              <span>·</span>
              <span>{exercises.length} ćw.</span>
              <span>·</span>
              <span>{allSets.filter((s) => !s.id.startsWith("optimistic")).length} serii</span>
              {totalVolume > 0 && (
                <>
                  <span>·</span>
                  <span className="text-amber-400/80">{Math.round(totalVolume).toLocaleString()} kg</span>
                </>
              )}
            </p>
          </div>
          <button onClick={handleFinish}
            className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-black hover:bg-amber-400 transition-colors flex-shrink-0">
            <Flag className="h-4 w-4" /> Zakończ
          </button>
        </div>
      </div>

      {/* Exercise list — all expanded */}
      {exercises.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Dumbbell className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-4">Dodaj pierwsze ćwiczenie do treningu</p>
          <button onClick={() => setPickerOpen(true)}
            className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400 transition-colors">
            <Plus className="h-4 w-4" /> Dodaj ćwiczenie
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {exercises.map((exercise) => {
            const exerciseSets = allSets.filter((s) => s.exerciseId === exercise.id);
            const completedSets = exerciseSets.filter((s) => !s.id.startsWith("optimistic")).length;
            const isComplete = exercise.targetSets ? completedSets >= exercise.targetSets : false;

            return (
              <div key={exercise.id}
                className={`rounded-xl border transition-colors ${
                  isComplete
                    ? "border-green-500/30 bg-green-500/5"
                    : "border-border bg-card"
                }`}>
                {/* Card header */}
                <div className="flex items-center justify-between px-4 pt-3 pb-1">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{exercise.name}</p>
                      {isComplete && (
                        <span className="flex-shrink-0 h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center">
                          <svg className="h-3 w-3 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span>{completedSets}{exercise.targetSets ? `/${exercise.targetSets}` : ""} serii</span>
                      {exerciseSets
                        .filter((s) => !s.id.startsWith("optimistic"))
                        .slice(-3)
                        .map((s, i) => (
                          <span key={i} className="tabular-nums text-amber-400/60">
                            {s.weightKg != null ? `${s.weightKg}×${s.reps}` : `${s.reps}`}
                          </span>
                        ))}
                    </div>
                  </div>
                  {/* Remove exercise button */}
                  <button
                    onClick={() => handleRemoveExercise(exercise.id, exercise.name)}
                    className="text-muted-foreground/30 hover:text-red-400 transition-colors p-1 flex-shrink-0 ml-1"
                    title="Usuń ćwiczenie z treningu"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Set logger — always visible */}
                <div className="px-4 pb-3">
                  <SetLogger
                    workoutId={workoutId}
                    exerciseId={exercise.id}
                    exerciseName={exercise.name}
                    sets={allSets as unknown as Array<{ id: string; workoutId: string; exerciseId: string; exercise: { id: string; name: string; equipment: string | null; muscles: Array<{ muscleGroup: string; isPrimary: boolean }> }; setNumber: number; weightKg: number | null; reps: number; rpe: number | null; completedAt: Date; isPR: boolean }>}
                    lastWeight={lastExercises.find((le) => le.exerciseId === exercise.id)?.weightKg ?? null}
                    lastReps={lastExercises.find((le) => le.exerciseId === exercise.id)?.reps ?? null}
                    onSetAdded={(prs) => handleSetAdded(exercise.id, exercise.name, exercise.equipment, prs)}
                  />
                </div>
              </div>
            );
          })}

          <button onClick={() => setPickerOpen(true)}
            className="w-full rounded-lg border border-dashed border-border py-3 text-sm text-muted-foreground hover:border-amber-500/30 hover:text-amber-400 transition-colors">
            <Plus className="h-4 w-4 inline mr-1" /> Dodaj ćwiczenie
          </button>
        </div>
      )}

      {/* Rest timer — bottom sheet, persists on exercise switch */}
      {showRestTimer && (
        <div className="fixed bottom-20 left-4 right-4 z-40 lg:left-auto lg:right-4 lg:bottom-4 lg:w-80">
          <RestTimer
            defaultSeconds={restSeconds}
            onComplete={() => setShowRestTimer(false)}
            onSkip={handleSkipRest}
          />
        </div>
      )}

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleAddExercise}
        workoutExerciseIds={exercises.map((e) => e.id)}
      />

      {showFinishModal && (
        <FinishModal
          workoutId={workoutId}
          setCount={allSets.filter((s) => !s.id.startsWith("optimistic")).length}
          onClose={handleCloseFinish}
        />
      )}
    </div>
  );
}

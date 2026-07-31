"use client";

import { useState, useOptimistic, useTransition } from "react";
import { Trash2, Flame, TrendingUp, Pencil, Check, X } from "lucide-react";
import { addSet, deleteSet, updateSet } from "@/app/(dashboard)/workout/actions";

interface ExerciseLite {
  id: string;
  name: string;
  equipment: string | null;
  muscles: Array<{ muscleGroup: string; isPrimary: boolean }>;
}

interface SetWithExercise {
  id: string;
  workoutId: string;
  exerciseId: string;
  exercise: ExerciseLite;
  setNumber: number;
  weightKg: number | null;
  reps: number;
  rpe: number | null;
  completedAt: Date;
  isPR: boolean;
}

interface Props {
  workoutId: string;
  exerciseId: string;
  exerciseName: string;
  sets: SetWithExercise[];
  lastWeight: number | null;
  lastReps: number | null;
  onSetAdded: (prs: unknown[]) => void;
}

export function SetLogger({
  workoutId,
  exerciseId,
  exerciseName,
  sets,
  lastWeight,
  lastReps,
  onSetAdded,
}: Props) {
  const [weight, setWeight] = useState(
    lastWeight ? String(lastWeight) : ""
  );
  const [reps, setReps] = useState(lastReps ? String(lastReps) : "");
  const [rpe, setRpe] = useState("");
  const [isPending, startTransition] = useTransition();
  const [suggestion, setSuggestion] = useState<{ weight: number; reason: string } | null>(null);
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [editWeight, setEditWeight] = useState("");
  const [editReps, setEditReps] = useState("");
  const [editRpe, setEditRpe] = useState("");
  const [optimisticSets, addOptimisticSet] = useOptimistic(
    sets,
    (state: SetWithExercise[], newSet: SetWithExercise) => [...state, newSet]
  );

  const exerciseSets = optimisticSets.filter((s) => s.exerciseId === exerciseId);

  const handleAddSet = () => {
    const repsNum = parseInt(reps);
    if (!repsNum || repsNum < 1) return;

    const weightNum = weight ? parseFloat(weight) : undefined;

    startTransition(async () => {
      // Optimistic update
      addOptimisticSet({
        id: "optimistic-" + Date.now(),
        workoutId,
        exerciseId,
        exercise: { id: exerciseId, name: exerciseName } as ExerciseLite,
        setNumber: exerciseSets.length + 1,
        weightKg: weightNum ?? null,
        reps: repsNum,
        rpe: rpe ? parseFloat(rpe) : null,
        completedAt: new Date(),
        isPR: false,
      } as SetWithExercise);

      const result = await addSet({
        workoutId,
        exerciseId,
        weightKg: weightNum,
        reps: repsNum,
        rpe: rpe ? parseFloat(rpe) : undefined,
      });

      if (result.prs.length > 0) {
        onSetAdded(result.prs);
      }
      if (result.suggestion) {
        setSuggestion(result.suggestion);
      } else {
        setSuggestion(null);
      }
    });

    // Keep weight, clear reps for next set
    setReps("");
    setRpe("");
  };

  const handleDelete = (setId: string) => {
    if (setId.startsWith("optimistic")) return;
    startTransition(() => deleteSet(setId));
  };

  const handleStartEdit = (set: SetWithExercise) => {
    if (set.id.startsWith("optimistic")) return;
    setEditingSetId(set.id);
    setEditWeight(set.weightKg != null ? String(set.weightKg) : "");
    setEditReps(String(set.reps));
    setEditRpe(set.rpe != null ? String(set.rpe) : "");
  };

  const handleSaveEdit = () => {
    if (!editingSetId) return;
    const repsNum = parseInt(editReps);
    if (!repsNum || repsNum < 1) return;

    startTransition(() => {
      updateSet(editingSetId, {
        weightKg: editWeight ? parseFloat(editWeight) : null,
        reps: repsNum,
        rpe: editRpe ? parseFloat(editRpe) : null,
      });
    });
    setEditingSetId(null);
  };

  const handleCancelEdit = () => {
    setEditingSetId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSet();
    }
  };

  return (
    <div className="space-y-3">
      {/* Table header */}
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 text-xs text-muted-foreground uppercase tracking-wider px-1">
        <span>Seria</span>
        <span className="w-20 text-center">Ciężar</span>
        <span className="w-14 text-center">Powt.</span>
        <span className="w-10 text-center">RPE</span>
      </div>

      {/* Existing sets */}
      {exerciseSets.map((set) => {
        const isEditing = editingSetId === set.id;
        return (
        <div
          key={set.id}
          className={`grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center rounded-lg px-3 py-2 text-sm ${
            set.isPR ? "bg-amber-500/10 border border-amber-500/20" : "bg-border/20"
          } ${isEditing ? "ring-1 ring-amber-500/30" : ""}`}
        >
          <div className="flex items-center gap-2">
            {set.isPR && <Flame className="h-3.5 w-3.5 text-amber-400" />}
            <span className="font-medium">#{set.setNumber}</span>
            {set.id.startsWith("optimistic") && (
              <span className="text-xs text-muted-foreground animate-pulse">zapisywanie...</span>
            )}
          </div>
          {isEditing ? (
            <>
              <input
                type="number"
                value={editWeight}
                onChange={(e) => setEditWeight(e.target.value)}
                placeholder="kg"
                step="2.5"
                inputMode="decimal"
                className="w-20 rounded border border-amber-500/30 bg-card px-2 py-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-amber-500/50"
              />
              <input
                type="number"
                value={editReps}
                onChange={(e) => setEditReps(e.target.value)}
                placeholder="0"
                min="1"
                inputMode="numeric"
                className="w-14 rounded border border-amber-500/30 bg-card px-2 py-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-amber-500/50"
              />
              <div className="w-10 flex items-center gap-0.5">
                <button onClick={handleSaveEdit} className="text-green-400 hover:text-green-300">
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button onClick={handleCancelEdit} className="text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => handleStartEdit(set)}
                className="w-20 text-center tabular-nums hover:text-amber-400 transition-colors cursor-pointer"
                title="Kliknij by edytować"
              >
                {set.weightKg ? `${set.weightKg} kg` : "—"}
              </button>
              <button
                onClick={() => handleStartEdit(set)}
                className="w-14 text-center tabular-nums font-medium hover:text-amber-400 transition-colors cursor-pointer"
                title="Kliknij by edytować"
              >
                {set.reps}
              </button>
              <div className="w-10 flex items-center justify-between">
                <button
                  onClick={() => handleStartEdit(set)}
                  className="tabular-nums text-xs text-muted-foreground hover:text-amber-400 transition-colors cursor-pointer"
                  title="Kliknij by edytować"
                >
                  {set.rpe ? `@${set.rpe}` : "—"}
                </button>
                {!set.id.startsWith("optimistic") && (
                  <button
                    onClick={() => handleDelete(set.id)}
                    className="text-muted-foreground/40 hover:text-red-400 transition-colors ml-1"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )})}

      {/* Input row */}
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center">
        <div className="flex items-center gap-2 px-1">
          <span className="text-sm text-muted-foreground">
            #{exerciseSets.length + 1}
          </span>
        </div>
        <input
          type="number"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="kg"
          step="2.5"
          inputMode="decimal"
          className="w-20 rounded-lg border border-border bg-card px-2 py-2.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-amber-500/50"
        />
        <input
          type="number"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="0"
          min="1"
          inputMode="numeric"
          className="w-14 rounded-lg border border-border bg-card px-2 py-2.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-amber-500/50"
        />
        <input
          type="number"
          value={rpe}
          onChange={(e) => setRpe(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="—"
          min="0"
          max="10"
          step="0.5"
          inputMode="decimal"
          className="w-10 rounded-lg border border-border bg-card px-1 py-2.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-amber-500/50"
        />
      </div>

      {/* Suggestion pill */}
      {suggestion && (
        <button
          onClick={() => setWeight(String(suggestion.weight))}
          className="flex items-center gap-1.5 text-xs text-amber-400/80 hover:text-amber-300 transition-colors px-1"
        >
          <TrendingUp className="h-3 w-3" />
          <span className="truncate">
            Progresja: spróbuj <strong>{suggestion.weight} kg</strong>
          </span>
          <span className="text-muted-foreground/50 ml-auto flex-shrink-0">
            (kliknij by ustawić)
          </span>
        </button>
      )}

      {/* Add button */}
      <button
        onClick={handleAddSet}
        disabled={isPending || !reps}
        className="w-full rounded-lg border border-dashed border-border py-2 text-sm text-muted-foreground hover:border-amber-500/30 hover:text-amber-400 disabled:opacity-40 transition-colors"
      >
        + Dodaj serię {lastWeight ? `(ostatnio: ${lastWeight}kg)` : ""}
      </button>
    </div>
  );
}

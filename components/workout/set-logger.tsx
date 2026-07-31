"use client";

import { useState, useEffect, useOptimistic, useTransition } from "react";
import { Trash2, Flame, TrendingUp, Pencil, Check, X, Plus, Undo2 } from "lucide-react";
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

const DEFAULT_ROWS = 3;

function emptyRow(index: number) {
  return {
    key: `empty-${index}`,
    weight: "",
    reps: "",
    rpe: "",
  };
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
  const [isPending, startTransition] = useTransition();
  const [suggestion, setSuggestion] = useState<{ weight: number; reason: string } | null>(null);
  const [lastLoggedSetId, setLastLoggedSetId] = useState<string | null>(null);
  const [undoCountdown, setUndoCountdown] = useState(0);

  // Inline edit state (for editing already-logged sets)
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [editWeight, setEditWeight] = useState("");
  const [editReps, setEditReps] = useState("");
  const [editRpe, setEditRpe] = useState("");

  // Pre-filled rows state — always starts with 3 empty input rows
  const [rows, setRows] = useState(() =>
    Array.from({ length: DEFAULT_ROWS }, (_, i) => emptyRow(i + 1))
  );

  const [optimisticSets, addOptimisticSet] = useOptimistic(
    sets,
    (state: SetWithExercise[], newSet: SetWithExercise) => [...state, newSet]
  );

  const exerciseSets = optimisticSets.filter((s) => s.exerciseId === exerciseId);
  const actualSetCount = exerciseSets.filter((s) => !s.id.startsWith("optimistic")).length;

  // Undo countdown
  useEffect(() => {
    if (undoCountdown <= 0 || !lastLoggedSetId) return;
    const timer = setInterval(() => {
      setUndoCountdown((prev) => {
        if (prev <= 1) {
          setLastLoggedSetId(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [undoCountdown, lastLoggedSetId]);

  const handleUndo = () => {
    if (!lastLoggedSetId) return;
    const setId = lastLoggedSetId;
    setLastLoggedSetId(null);
    setUndoCountdown(0);
    startTransition(() => deleteSet(setId));
  };

  const updateRow = (index: number, field: "weight" | "reps" | "rpe", value: string) => {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
  };

  const logRow = (index: number) => {
    const row = rows[index];
    const repsNum = parseInt(row.reps);
    if (!repsNum || repsNum < 1) return;

    const weightNum = row.weight ? parseFloat(row.weight) : undefined;

    startTransition(async () => {
      // Add optimistic set
      addOptimisticSet({
        id: "optimistic-" + Date.now() + "-" + index,
        workoutId,
        exerciseId,
        exercise: { id: exerciseId, name: exerciseName } as ExerciseLite,
        setNumber: exerciseSets.length + 1,
        weightKg: weightNum ?? null,
        reps: repsNum,
        rpe: row.rpe ? parseFloat(row.rpe) : null,
        completedAt: new Date(),
        isPR: false,
      } as SetWithExercise);

      const result = await addSet({
        workoutId,
        exerciseId,
        weightKg: weightNum,
        reps: repsNum,
        rpe: row.rpe ? parseFloat(row.rpe) : undefined,
      });

      if (result.prs.length > 0) {
        onSetAdded(result.prs);
      }
      if (result.suggestion) {
        setSuggestion(result.suggestion);
      } else {
        setSuggestion(null);
      }

      // Enable undo for the just-logged set
      setLastLoggedSetId(result.set.id);
      setUndoCountdown(5);
    });

    // Clear this row and shift others up, add fresh row at bottom
    setRows((prev) => {
      const next = prev.map((r, i) => {
        if (i === index) return emptyRow(i + 1);
        return r;
      });
      return next;
    });
  };

  const handleKeyDown = (index: number) => (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      logRow(index);
    }
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

  return (
    <div className="space-y-2">
      {/* Table header */}
      <div className="grid grid-cols-[36px_1fr_1fr_44px_32px] gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wider px-1">
        <span className="text-center">#</span>
        <span className="text-center">kg</span>
        <span className="text-center">Powt.</span>
        <span className="text-center">RPE</span>
        <span />
      </div>

      {/* Logged sets — read-only rows */}
      {exerciseSets.map((set) => {
        const isEditing = editingSetId === set.id;
        return (
          <div
            key={set.id}
            className={`grid grid-cols-[36px_1fr_1fr_44px_32px] gap-1.5 items-center rounded-md px-2 py-1.5 text-sm ${
              set.isPR
                ? "bg-amber-500/10 border border-amber-500/20"
                : "bg-zinc-900/30"
            } ${isEditing ? "ring-1 ring-amber-500/50" : ""}`}
          >
            {/* Set number */}
            <span className="text-center text-xs text-muted-foreground font-medium tabular-nums">
              {set.isPR ? <Flame className="h-3 w-3 text-amber-400 inline mr-0.5" /> : null}
              {set.setNumber}
            </span>

            {isEditing ? (
              <>
                <input
                  type="number"
                  value={editWeight}
                  onChange={(e) => setEditWeight(e.target.value)}
                  step="2.5"
                  inputMode="decimal"
                  className="w-full rounded border border-amber-500/30 bg-card px-1 py-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                />
                <input
                  type="number"
                  value={editReps}
                  onChange={(e) => setEditReps(e.target.value)}
                  min="1"
                  inputMode="numeric"
                  className="w-full rounded border border-amber-500/30 bg-card px-1 py-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                />
                <input
                  type="number"
                  value={editRpe}
                  onChange={(e) => setEditRpe(e.target.value)}
                  placeholder="-"
                  min="0"
                  max="10"
                  step="0.5"
                  inputMode="decimal"
                  className="w-full rounded border border-amber-500/30 bg-card px-1 py-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                />
                <div className="flex items-center justify-center gap-0.5">
                  <button onClick={handleSaveEdit} className="text-green-400 hover:text-green-300">
                    <Check className="h-3.5 w-3.5" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleStartEdit(set)}
                  className="text-center tabular-nums hover:text-amber-400 transition-colors cursor-pointer text-sm"
                >
                  {set.weightKg != null ? `${set.weightKg}` : "—"}
                </button>
                <button
                  onClick={() => handleStartEdit(set)}
                  className="text-center tabular-nums font-medium hover:text-amber-400 transition-colors cursor-pointer"
                >
                  {set.reps}
                </button>
                <button
                  onClick={() => handleStartEdit(set)}
                  className="text-center tabular-nums text-xs text-muted-foreground hover:text-amber-400 transition-colors cursor-pointer"
                >
                  {set.rpe != null ? set.rpe : "—"}
                </button>
                <div className="flex justify-center">
                  {set.id.startsWith("optimistic") ? (
                    <span className="text-[10px] text-muted-foreground animate-pulse">...</span>
                  ) : (
                    <button
                      onClick={() => handleDelete(set.id)}
                      className="text-muted-foreground/30 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        );
      })}

      {/* Pre-filled empty input rows — Lyfta-style */}
      {rows.map((row, index) => (
        <div
          key={row.key}
          className="grid grid-cols-[36px_1fr_1fr_44px_32px] gap-1.5 items-center rounded-md px-2 py-1"
        >
          <span className="text-center text-xs text-muted-foreground tabular-nums">
            {actualSetCount + index + 1}
          </span>
          <input
            type="number"
            value={row.weight}
            onChange={(e) => updateRow(index, "weight", e.target.value)}
            onKeyDown={handleKeyDown(index)}
            placeholder={(lastWeight && index === 0) ? String(lastWeight) : "kg"}
            step="2.5"
            inputMode="decimal"
            className="w-full rounded border border-border bg-transparent px-2 py-2 text-sm text-center focus:outline-none focus:ring-1 focus:ring-amber-500/50 placeholder:text-muted-foreground/40"
          />
          <input
            type="number"
            value={row.reps}
            onChange={(e) => updateRow(index, "reps", e.target.value)}
            onKeyDown={handleKeyDown(index)}
            placeholder={(lastReps && index === 0) ? String(lastReps) : "0"}
            min="1"
            inputMode="numeric"
            className="w-full rounded border border-border bg-transparent px-2 py-2 text-sm text-center focus:outline-none focus:ring-1 focus:ring-amber-500/50 placeholder:text-muted-foreground/40"
          />
          <input
            type="number"
            value={row.rpe}
            onChange={(e) => updateRow(index, "rpe", e.target.value)}
            onKeyDown={handleKeyDown(index)}
            placeholder="-"
            min="0"
            max="10"
            step="0.5"
            inputMode="decimal"
            className="w-full rounded border border-border bg-transparent px-1 py-2 text-sm text-center focus:outline-none focus:ring-1 focus:ring-amber-500/50 placeholder:text-muted-foreground/40"
          />
          <button
            onClick={() => logRow(index)}
            disabled={isPending || !row.reps}
            className="flex items-center justify-center h-8 w-8 rounded-md bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}

      {/* Undo bar */}
      {lastLoggedSetId && undoCountdown > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-sm">
          <span className="text-amber-400/80 text-xs">
            Seria zapisana — {undoCountdown}s
          </span>
          <button
            onClick={handleUndo}
            className="flex items-center gap-1 text-amber-400 hover:text-amber-300 font-medium text-xs transition-colors"
          >
            <Undo2 className="h-3.5 w-3.5" /> Cofnij
          </button>
        </div>
      )}

      {/* Suggestion pill */}
      {suggestion && (
        <button
          onClick={() => {
            setRows((prev) => {
              const next = [...prev];
              // Fill first empty row's weight with suggestion
              for (let i = 0; i < next.length; i++) {
                if (!next[i].weight) {
                  next[i] = { ...next[i], weight: String(suggestion.weight) };
                  break;
                }
              }
              return next;
            });
          }}
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

      {/* Add more rows button */}
      <button
        onClick={() => {
          setRows((prev) => [...prev, emptyRow(prev.length + 1)]);
        }}
        className="w-full rounded-lg border border-dashed border-border py-1.5 text-xs text-muted-foreground hover:border-amber-500/30 hover:text-amber-400 transition-colors"
      >
        <Plus className="h-3 w-3 inline mr-1" />
        Dodaj serię {lastWeight && actualSetCount === 0 ? `(ostatnio: ${lastWeight}kg)` : ""}
      </button>
    </div>
  );
}

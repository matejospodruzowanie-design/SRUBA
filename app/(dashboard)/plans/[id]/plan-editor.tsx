"use client";

import { useState, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Play,
  ChevronUp,
  ChevronDown,
  Save,
  Check,
  Pencil,
} from "lucide-react";
import {
  updateRoutine,
  deleteRoutine,
  addExerciseToRoutine,
  updateRoutineExercise,
  removeRoutineExercise,
  reorderRoutineExercises,
} from "../actions";
import { ExercisePicker } from "@/components/workout/exercise-picker";
import { MUSCLE_GROUPS } from "@/lib/constants";

// ─── Types ───

interface RoutineExercise {
  id: string;
  exerciseId: string;
  exercise: {
    id: string;
    name: string;
    equipment: string | null;
    muscles: { muscleGroup: string; isPrimary: boolean }[];
  };
  position: number;
  targetSets: number;
  targetReps: string;
  restSeconds: number;
}

interface Routine {
  id: string;
  name: string;
  description: string | null;
  source: string;
  exercises: RoutineExercise[];
}

interface Props {
  routine: Routine;
}

// ─── Presets ───

const REST_PRESETS = [30, 60, 90, 120, 180];

// ─── Exercise row component ───

function ExerciseRow({
  slot,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onUpdate,
  onRemove,
}: {
  slot: RoutineExercise;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onUpdate: (data: {
    targetSets?: number;
    targetReps?: string;
    restSeconds?: number;
  }) => void;
  onRemove: () => void;
}) {
  const primaryMuscle = slot.exercise.muscles.find((m) => m.isPrimary);
  const muscleLabel = primaryMuscle
    ? MUSCLE_GROUPS.find((mg) => mg.id === primaryMuscle.muscleGroup)?.label
    : null;

  return (
    <div className="rounded-xl border border-border bg-card hover:border-zinc-700 transition-colors overflow-hidden">
      {/* Header: exercise name + muscle + reorder */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className="flex flex-col gap-0.5">
          <button
            onClick={onMoveUp}
            disabled={isFirst}
            className="text-muted-foreground/40 hover:text-amber-400 disabled:opacity-20 disabled:cursor-default transition-colors leading-none"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={isLast}
            className="text-muted-foreground/40 hover:text-amber-400 disabled:opacity-20 disabled:cursor-default transition-colors leading-none"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{slot.exercise.name}</p>
          {muscleLabel && (
            <p className="text-[10px] text-muted-foreground">{muscleLabel}</p>
          )}
        </div>

        <button
          onClick={onRemove}
          className="text-muted-foreground/30 hover:text-red-400 transition-colors p-1"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Config row */}
      <div className="grid grid-cols-3 gap-2 px-3 pb-3">
        <div>
          <label className="text-[10px] text-muted-foreground block mb-0.5">
            Serie
          </label>
          <input
            type="number"
            value={slot.targetSets}
            onChange={(e) =>
              onUpdate({ targetSets: parseInt(e.target.value) || 0 })
            }
            min={1}
            max={10}
            className="w-full rounded-md border border-border bg-zinc-900 px-2 py-1.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-amber-500/50"
          />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground block mb-0.5">
            Powtórzenia
          </label>
          <input
            type="text"
            value={slot.targetReps}
            onChange={(e) => onUpdate({ targetReps: e.target.value })}
            placeholder="8-12"
            className="w-full rounded-md border border-border bg-zinc-900 px-2 py-1.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-amber-500/50"
          />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground block mb-0.5">
            Przerwa (s)
          </label>
          <div className="flex gap-1">
            <select
              value={slot.restSeconds}
              onChange={(e) =>
                onUpdate({ restSeconds: parseInt(e.target.value) })
              }
              className="flex-1 rounded-md border border-border bg-zinc-900 px-1 py-1.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-amber-500/50 appearance-none cursor-pointer"
            >
              {REST_PRESETS.map((s) => (
                <option key={s} value={s}>
                  {s}s
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main editor component ───

export function PlanEditor({ routine }: Props) {
  const router = useRouter();

  // Plan metadata state
  const [name, setName] = useState(routine.name);
  const [description, setDescription] = useState(routine.description ?? "");
  const [editingName, setEditingName] = useState(false);
  const [saved, setSaved] = useState(false);

  // Exercises state
  const [exercises, setExercises] = useState<RoutineExercise[]>(
    routine.exercises
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // ─── Save plan metadata ───

  const handleSaveMeta = useCallback(async () => {
    await updateRoutine(routine.id, {
      name: name.trim() || routine.name,
      description: description.trim() || undefined,
    });
    setEditingName(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }, [routine.id, routine.name, name, description]);

  // ─── Add exercise ───

  const handleAddExercise = useCallback(
    async (exercise: {
      id: string;
      name: string;
      equipment: string | null;
      muscles: { muscleGroup: string; isPrimary: boolean }[];
    }) => {
      setPickerOpen(false);
      const slot = await addExerciseToRoutine(routine.id, exercise.id);
      setExercises((prev) => [...prev, slot]);
    },
    [routine.id]
  );

  // ─── Update exercise config ───

  const handleUpdateSlot = useCallback(
    (slotId: string, data: { targetSets?: number; targetReps?: string; restSeconds?: number }) => {
      startTransition(() => {
        setExercises((prev) =>
          prev.map((s) => (s.id === slotId ? { ...s, ...data } : s))
        );
        updateRoutineExercise(slotId, data);
      });
    },
    []
  );

  // ─── Remove exercise ───

  const handleRemoveSlot = useCallback(
    (slotId: string) => {
      setExercises((prev) => prev.filter((s) => s.id !== slotId));
      removeRoutineExercise(slotId, routine.id);
    },
    [routine.id]
  );

  // ─── Reorder ───

  const handleMoveUp = useCallback(
    (idx: number) => {
      if (idx === 0) return;
      const updated = [...exercises];
      [updated[idx - 1], updated[idx]] = [updated[idx], updated[idx - 1]];
      setExercises(updated);
      reorderRoutineExercises(
        routine.id,
        updated.map((e) => e.id)
      );
    },
    [exercises, routine.id]
  );

  const handleMoveDown = useCallback(
    (idx: number) => {
      if (idx === exercises.length - 1) return;
      const updated = [...exercises];
      [updated[idx], updated[idx + 1]] = [updated[idx + 1], updated[idx]];
      setExercises(updated);
      reorderRoutineExercises(
        routine.id,
        updated.map((e) => e.id)
      );
    },
    [exercises, routine.id]
  );

  // ─── Delete plan ───

  const handleDelete = useCallback(async () => {
    if (!confirm("Na pewno usunąć ten plan?")) return;
    await deleteRoutine(routine.id);
    router.push("/plans");
    router.refresh();
  }, [routine.id, router]);

  return (
    <div className="space-y-5 sm:space-y-6 max-w-2xl mx-auto pb-8">
      {/* Back + actions */}
      <div className="flex items-center gap-3">
        <Link
          href="/plans"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Plany
        </Link>
        <div className="flex-1" />
        <button
          onClick={handleDelete}
          className="flex items-center gap-1 rounded-lg border border-red-500/20 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" /> Usuń plan
        </button>
      </div>

      {/* Plan name + description */}
      <div className="space-y-3">
        {editingName ? (
          <div className="space-y-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleSaveMeta()}
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Dodaj opis planu..."
              rows={2}
              className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveMeta}
                className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400 transition-colors"
              >
                {saved ? (
                  <>
                    <Check className="h-4 w-4" /> Zapisano
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Zapisz
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setName(routine.name);
                  setDescription(routine.description ?? "");
                  setEditingName(false);
                }}
                className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Anuluj
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-start gap-2 group">
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl font-bold">{name}</h1>
                {description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {description}
                  </p>
                )}
              </div>
              <button
                onClick={() => setEditingName(true)}
                className="text-muted-foreground/40 hover:text-amber-400 transition-colors p-1 opacity-0 group-hover:opacity-100"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {exercises.length} ćwicze
              {exercises.length === 1
                ? "nie"
                : exercises.length < 5
                  ? "nia"
                  : "ń"}
            </p>
          </div>
        )}
      </div>

      {/* Start workout button */}
      {exercises.length > 0 && (
        <Link
          href={`/workout?planId=${routine.id}`}
          className="flex items-center gap-3 rounded-xl bg-amber-500 hover:bg-amber-400 transition-colors p-4 text-black group"
        >
          <div className="h-10 w-10 rounded-lg bg-black/20 flex items-center justify-center flex-shrink-0">
            <Play className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm">Rozpocznij trening z planu</h3>
            <p className="text-xs text-black/60">
              {exercises.length} ćwiczeń ·{" "}
              {exercises.reduce((s, e) => s + e.targetSets, 0)} serii
            </p>
          </div>
        </Link>
      )}

      {/* Exercises section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Ćwiczenia
          </h2>
          <button
            onClick={() => setPickerOpen(true)}
            className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Dodaj
          </button>
        </div>

        {exercises.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center">
            <p className="text-sm text-zinc-500">
              Dodaj ćwiczenia do planu — kliknij &quot;Dodaj&quot; powyżej
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {exercises.map((slot, idx) => (
              <ExerciseRow
                key={slot.id}
                slot={slot}
                isFirst={idx === 0}
                isLast={idx === exercises.length - 1}
                onMoveUp={() => handleMoveUp(idx)}
                onMoveDown={() => handleMoveDown(idx)}
                onUpdate={(data) => handleUpdateSlot(slot.id, data)}
                onRemove={() => handleRemoveSlot(slot.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Exercise picker modal */}
      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleAddExercise}
        workoutExerciseIds={exercises.map((e) => e.exerciseId)}
      />
    </div>
  );
}

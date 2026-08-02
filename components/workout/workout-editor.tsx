"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft,
  Check,
  Plus,
  Trash2,
  Pencil,
  X,
  Thermometer,
  Dumbbell,
} from "lucide-react";
import { toast } from "sonner";
import {
  updateWorkoutMeta,
  addWorkoutSet,
  updateWorkoutSet,
  deleteWorkoutSet,
  removeExerciseFromFinishedWorkout,
} from "@/app/(dashboard)/workout/history-actions";
import { DeleteWorkoutButton } from "@/app/(dashboard)/workout/[id]/delete-workout-button";
import { ExercisePicker } from "@/components/workout/exercise-picker";
import { formatDuration, workoutDuration } from "@/lib/fitness-utils";

interface EditorSet {
  id: string;
  setNumber: number;
  weightKg: number | null;
  reps: number;
  rpe: number | null;
  isWarmup: boolean;
  exercise: { id: string; name: string };
}

interface EditorWorkout {
  id: string;
  name: string;
  notes: string | null;
  startedAt: Date;
  endedAt: Date | null;
  durationSeconds: number | null;
  sets: EditorSet[];
}

interface Props {
  workout: EditorWorkout;
}

function pluralExercises(n: number) {
  if (n === 1) return "ćwiczenie";
  if (n >= 2 && n <= 4) return "ćwiczenia";
  return "ćwiczeń";
}

export function WorkoutEditor({ workout }: Props) {
  const router = useRouter();

  // ─── Meta (name / start / end — duration is always derived) ───

  const [name, setName] = useState(workout.name);
  const [startedAtStr, setStartedAtStr] = useState(() =>
    format(new Date(workout.startedAt), "yyyy-MM-dd'T'HH:mm")
  );
  const [endedAtStr, setEndedAtStr] = useState(() =>
    workout.endedAt ? format(new Date(workout.endedAt), "yyyy-MM-dd'T'HH:mm") : ""
  );
  const [savingMeta, setSavingMeta] = useState(false);

  const startedAt = new Date(startedAtStr);
  const endedAt = endedAtStr ? new Date(endedAtStr) : null;
  const metaValid = !!endedAt && endedAt.getTime() > startedAt.getTime();
  const durationPreview =
    metaValid && endedAt ? workoutDuration(startedAt, endedAt) : null;

  const handleSaveMeta = async () => {
    if (!metaValid) {
      toast.error("Koniec treningu musi być po jego rozpoczęciu");
      return;
    }
    setSavingMeta(true);
    try {
      const res = await updateWorkoutMeta(workout.id, {
        name: name.trim() || undefined,
        startedAt,
        endedAt: endedAt ?? undefined,
      });
      if (res && "error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Zapisano zmiany");
      router.refresh();
    } catch {
      toast.error("Nie udało się zapisać zmian");
    } finally {
      setSavingMeta(false);
    }
  };

  // ─── Sets (local state — server responses drive updates) ───

  const [sets, setSets] = useState<EditorSet[]>(workout.sets);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    weight: "",
    reps: "",
    rpe: "",
    warmup: false,
  });
  const [pickerOpen, setPickerOpen] = useState(false);

  const groups = useMemo(() => {
    const map = new Map<
      string,
      { exercise: { id: string; name: string }; sets: EditorSet[] }
    >();
    for (const s of sets) {
      if (!map.has(s.exercise.id)) {
        map.set(s.exercise.id, { exercise: s.exercise, sets: [] });
      }
      map.get(s.exercise.id)!.sets.push(s);
    }
    return Array.from(map.values());
  }, [sets]);

  const startEdit = (s: EditorSet) => {
    setEditingId(s.id);
    setEditForm({
      weight: s.weightKg != null ? String(s.weightKg) : "",
      reps: String(s.reps),
      rpe: s.rpe != null ? String(s.rpe) : "",
      warmup: s.isWarmup,
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const reps = parseInt(editForm.reps);
    if (!reps || reps < 1) {
      toast.error("Podaj poprawne powtórzenia");
      return;
    }
    try {
      const res = await updateWorkoutSet(workout.id, editingId, {
        weightKg: editForm.weight ? parseFloat(editForm.weight) : null,
        reps,
        rpe: editForm.rpe ? parseFloat(editForm.rpe) : null,
        isWarmup: editForm.warmup,
      });
      if (res && "error" in res) {
        toast.error(res.error);
        return;
      }
      setSets((prev) =>
        prev.map((s) =>
          s.id === editingId
            ? { ...s, ...res.set, exercise: s.exercise }
            : s
        )
      );
      setEditingId(null);
      toast.success("Zapisano serię");
      router.refresh();
    } catch {
      toast.error("Nie udało się zapisać serii");
    }
  };

  const removeSet = async (setId: string) => {
    if (!confirm("Na pewno usunąć tę serię?")) return;
    try {
      const res = await deleteWorkoutSet(workout.id, setId);
      if (res && "error" in res) {
        toast.error(res.error);
        return;
      }
      setSets((prev) => prev.filter((s) => s.id !== setId));
      router.refresh();
    } catch {
      toast.error("Nie udało się usunąć serii");
    }
  };

  const addSetFor = async (exerciseId: string, exerciseName: string) => {
    try {
      const res = await addWorkoutSet(workout.id, exerciseId, {
        weightKg: null,
        reps: 10,
        rpe: null,
        isWarmup: false,
      });
      if (res && "error" in res) {
        toast.error(res.error);
        return;
      }
      setSets((prev) => [
        ...prev,
        { ...res.set, exercise: { id: exerciseId, name: exerciseName } },
      ]);
      router.refresh();
    } catch {
      toast.error("Nie udało się dodać serii");
    }
  };

  const handleAddExercises = async (
    exercises: {
      id: string;
      name: string;
      equipment: string | null;
      muscles: { muscleGroup: string; isPrimary: boolean }[];
    }[]
  ) => {
    setPickerOpen(false);
    const existingIds = new Set(groups.map((g) => g.exercise.id));
    const fresh = exercises.filter((e) => !existingIds.has(e.id));
    if (fresh.length === 0) return;
    for (const ex of fresh) {
      await addSetFor(ex.id, ex.name);
    }
    toast.success(`Dodano ${fresh.length} ${pluralExercises(fresh.length)}`);
  };

  const removeExercise = async (exerciseId: string, exerciseName: string) => {
    if (!confirm(`Usunąć "${exerciseName}" z treningu? Wszystkie jego serie zostaną usunięte.`)) return;
    try {
      const res = await removeExerciseFromFinishedWorkout(workout.id, exerciseId);
      if (res && "error" in res) {
        toast.error(res.error);
        return;
      }
      setSets((prev) => prev.filter((s) => s.exercise.id !== exerciseId));
      router.refresh();
    } catch {
      toast.error("Nie udało się usunąć ćwiczenia");
    }
  };

  return (
    <div className="space-y-6 max-w-2xl pb-24">
      <Link
        href={`/workout/${workout.id}`}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Powrót do treningu
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Edytuj trening</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Nazwa, czas trwania, ćwiczenia i serie
          </p>
        </div>
        <DeleteWorkoutButton workoutId={workout.id} />
      </div>

      {/* Meta card */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Nazwa treningu</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Początek</label>
            <input
              type="datetime-local"
              value={startedAtStr}
              onChange={(e) => setStartedAtStr(e.target.value)}
              className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Koniec</label>
            <input
              type="datetime-local"
              value={endedAtStr}
              onChange={(e) => setEndedAtStr(e.target.value)}
              className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            Czas trwania:{" "}
            <span className={metaValid ? "text-amber-400 font-medium" : "text-red-400"}>
              {durationPreview ? formatDuration(durationPreview) : "—"}
            </span>
          </p>
          <button
            onClick={handleSaveMeta}
            disabled={savingMeta || !metaValid}
            className="flex items-center gap-1 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-40 transition-colors"
          >
            <Check className="h-3.5 w-3.5" />
            {savingMeta ? "Zapisywanie..." : "Zapisz"}
          </button>
        </div>
      </div>

      {/* Exercises + sets */}
      {groups.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <Dumbbell className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Brak ćwiczeń w tym treningu</p>
        </div>
      )}

      {groups.map((group) => (
        <div key={group.exercise.id} className="rounded-xl border border-border bg-card overflow-hidden">
          {/* Group header */}
          <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-2">
            <p className="font-medium text-sm truncate">{group.exercise.name}</p>
            <button
              onClick={() => removeExercise(group.exercise.id, group.exercise.name)}
              className="flex-shrink-0 text-xs text-muted-foreground/60 hover:text-red-400 transition-colors"
            >
              Usuń ćwiczenie
            </button>
          </div>

          {/* Set rows */}
          <div className="p-3 space-y-1.5">
            <div className="grid grid-cols-[28px_1fr_1fr_44px_64px] gap-1 text-[10px] text-muted-foreground uppercase tracking-wider px-1">
              <span className="text-center">#</span>
              <span className="text-center">kg</span>
              <span className="text-center">Powt.</span>
              <span className="text-center">RPE</span>
              <span />
            </div>

            {group.sets.map((s) => (
              <div
                key={s.id}
                className="grid grid-cols-[28px_1fr_1fr_44px_64px] gap-1 items-center rounded-md bg-zinc-900/30 px-1.5 py-1.5 text-sm"
              >
                {editingId === s.id ? (
                  <>
                    {/* Warmup toggle */}
                    <span className="flex justify-center">
                      <button
                        onClick={() => setEditForm((f) => ({ ...f, warmup: !f.warmup }))}
                        className={editForm.warmup ? "text-orange-400" : "text-muted-foreground/30 hover:text-muted-foreground/60"}
                        title={editForm.warmup ? "Seria rozgrzewkowa" : "Oznacz jako rozgrzewkową"}
                        aria-label="Przełącz rozgrzewkę"
                      >
                        <Thermometer className="h-3.5 w-3.5" />
                      </button>
                    </span>
                    <input
                      type="number"
                      value={editForm.weight}
                      onChange={(e) => setEditForm((f) => ({ ...f, weight: e.target.value }))}
                      step="2.5"
                      inputMode="decimal"
                      className="w-full rounded border border-amber-500/30 bg-card px-1 py-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                    />
                    <input
                      type="number"
                      value={editForm.reps}
                      onChange={(e) => setEditForm((f) => ({ ...f, reps: e.target.value }))}
                      min="1"
                      inputMode="numeric"
                      className="w-full rounded border border-amber-500/30 bg-card px-1 py-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                    />
                    <input
                      type="number"
                      value={editForm.rpe}
                      onChange={(e) => setEditForm((f) => ({ ...f, rpe: e.target.value }))}
                      placeholder="-"
                      min="0"
                      max="10"
                      step="0.5"
                      inputMode="decimal"
                      className="w-full rounded border border-amber-500/30 bg-card px-1 py-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                    />
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={saveEdit} className="text-green-400 hover:text-green-300" aria-label="Zapisz serię">
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-muted-foreground hover:text-foreground" aria-label="Anuluj edycję">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className={`text-center text-xs font-medium tabular-nums ${s.isWarmup ? "text-orange-400/60" : "text-muted-foreground"}`}>
                      {s.isWarmup && <Thermometer className="h-3 w-3 inline mr-0.5 text-orange-400/60" />}
                      {s.setNumber}
                    </span>
                    <button onClick={() => startEdit(s)} className="text-center tabular-nums hover:text-amber-400 transition-colors">
                      {s.weightKg != null ? `${s.weightKg}` : "—"}
                    </button>
                    <button onClick={() => startEdit(s)} className="text-center tabular-nums font-medium hover:text-amber-400 transition-colors">
                      {s.reps}
                    </button>
                    <button onClick={() => startEdit(s)} className="text-center tabular-nums text-xs text-muted-foreground hover:text-amber-400 transition-colors">
                      {s.rpe != null ? s.rpe : "—"}
                    </button>
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => startEdit(s)} className="text-muted-foreground/40 hover:text-amber-400 transition-colors" aria-label={`Edytuj serię ${s.setNumber}`}>
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button onClick={() => removeSet(s.id)} className="text-muted-foreground/30 hover:text-red-400 transition-colors" aria-label={`Usuń serię ${s.setNumber}`}>
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}

            {/* Add set */}
            <button
              onClick={() => addSetFor(group.exercise.id, group.exercise.name)}
              className="w-full rounded-lg border border-dashed border-border py-1.5 text-xs text-muted-foreground hover:border-amber-500/30 hover:text-amber-400 transition-colors"
            >
              <Plus className="h-3 w-3 inline mr-1" /> Dodaj serię
            </button>
          </div>
        </div>
      ))}

      {/* Add exercise */}
      <button
        onClick={() => setPickerOpen(true)}
        className="w-full rounded-xl border border-dashed border-border py-3 text-sm text-muted-foreground hover:border-amber-500/30 hover:text-amber-400 transition-colors"
      >
        <Plus className="h-4 w-4 inline mr-1" /> Dodaj ćwiczenie
      </button>

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onAdd={handleAddExercises}
        workoutExerciseIds={groups.map((g) => g.exercise.id)}
      />
    </div>
  );
}

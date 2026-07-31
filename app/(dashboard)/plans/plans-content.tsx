"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Dumbbell,
  Trash2,
  Play,
  Calendar,
  ChevronRight,
  X,
} from "lucide-react";
import { createRoutine, deleteRoutine } from "./actions";
import { WeekStrip } from "./week-strip";
import { toast } from "sonner";

interface RoutineExercise {
  id: string;
  exerciseId: string;
  exercise: { id: string; name: string; equipment: string | null };
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
  initialRoutines: Routine[];
}

export function PlansContent({ initialRoutines }: Props) {
  const router = useRouter();
  const [routines, setRoutines] = useState<Routine[]>(initialRoutines);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = useCallback(async () => {
    const name = newName.trim();
    if (!name || creating) return;
    setCreating(true);
    try {
      const routine = await createRoutine({
        name,
        description: newDesc.trim() || undefined,
      });
      setRoutines((prev) => [...prev, routine]);
      setNewName("");
      setNewDesc("");
      setShowCreate(false);
      router.push(`/plans/${routine.id}`);
    } catch {
      toast.error("Nie udało się utworzyć planu");
    } finally {
      setCreating(false);
    }
  }, [newName, newDesc, creating, router]);

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm("Na pewno usunąć ten plan?")) return;
      try {
        await deleteRoutine(id);
        setRoutines((prev) => prev.filter((r) => r.id !== id));
      } catch {
        toast.error("Nie udało się usunąć planu");
      }
    },
    []
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Plany treningowe</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {routines.length === 0
              ? "Stwórz swój pierwszy plan"
              : `${routines.length} ${routines.length === 1 ? "plan" : routines.length < 5 ? "plany" : "planów"}`}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2 text-sm font-semibold text-black hover:bg-amber-400 transition-colors"
        >
          <Plus className="h-4 w-4" /> Nowy plan
        </button>
      </div>

      {/* Week strip */}
      <WeekStrip />

      {/* Templates — quick-start plans */}
      {routines.length === 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Gotowe szablony
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                name: "Push/Pull/Legs",
                desc: "Klasyczny split 3-dniowy. Push (klatka+barki+triceps), Pull (plecy+biceps), Legs (nogi).",
                exercises: ["Wyciskanie sztangi", "Wiosłowanie", "Przysiad", "Wyciskanie hantli", "Podciąganie", "Martwy ciąg"],
              },
              {
                name: "Full Body 3x",
                desc: "Trening całego ciała 3 razy w tygodniu. Idealny dla początkujących.",
                exercises: ["Przysiad", "Martwy ciąg", "Wiosłowanie", "Wyciskanie sztangi", "Plank"],
              },
              {
                name: "Upper/Lower",
                desc: "Split 4-dniowy: góra/dół. Większa objętość dla średniozaawansowanych.",
                exercises: ["Wyciskanie sztangi", "Podciąganie", "Uginanie ramion", "Przysiad", "Wspięcia na palce"],
              },
            ].map((tpl) => (
              <button
                key={tpl.name}
                disabled={creating}
                onClick={async () => {
                  try {
                    const routine = await createRoutine({
                      name: tpl.name,
                      description: tpl.desc,
                      source: "template",
                    });
                    setRoutines((prev) => [...prev, routine]);
                    router.push(`/plans/${routine.id}`);
                  } catch {
                    toast.error("Nie udało się utworzyć planu");
                  }
                }}
                className="rounded-xl border border-border bg-card hover:border-amber-500/20 transition-all p-4 text-left group"
              >
                <h3 className="font-semibold text-sm group-hover:text-amber-400 transition-colors">
                  {tpl.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{tpl.desc}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {tpl.exercises.slice(0, 4).map((ex) => (
                    <span key={ex} className="inline-block rounded-md bg-zinc-800/60 px-2 py-0.5 text-[10px] text-zinc-400">
                      {ex}
                    </span>
                  ))}
                  {tpl.exercises.length > 4 && (
                    <span className="text-[10px] text-zinc-500">+{tpl.exercises.length - 4}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Plans grid */}
      {routines.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 p-10 sm:p-16 text-center">
          <div className="h-14 w-14 rounded-full bg-zinc-900 flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-6 w-6 text-zinc-600" />
          </div>
          <h3 className="text-base font-medium text-zinc-500">
            Brak planów treningowych
          </h3>
          <p className="text-sm text-zinc-600 mt-1 max-w-sm mx-auto">
            Stwórz własny plan — dodaj ćwiczenia, ustal serie i powtórzenia, a
            potem rozpocznij trening jednym kliknięciem.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 mt-4 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-black hover:bg-amber-400 transition-colors"
          >
            <Plus className="h-4 w-4" /> Stwórz pierwszy plan
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {routines.map((routine) => (
            <div
              key={routine.id}
              className="group rounded-xl border border-border bg-card hover:border-amber-500/20 transition-all overflow-hidden"
            >
              {/* Main content — links to detail */}
              <Link
                href={`/plans/${routine.id}`}
                className="block p-4 hover:bg-amber-500/[0.02] transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm truncate">
                      {routine.name}
                    </h3>
                    {routine.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {routine.description}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40 flex-shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform" />
                </div>

                {/* Exercise count */}
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Dumbbell className="h-3 w-3" />
                    {routine.exercises.length} ćwicze
                    {routine.exercises.length === 1
                      ? "nie"
                      : routine.exercises.length < 5
                        ? "nia"
                        : "ń"}
                  </div>
                </div>

                {/* Exercise preview pills */}
                {routine.exercises.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {routine.exercises.slice(0, 4).map((slot) => (
                      <span
                        key={slot.id}
                        className="inline-block rounded-md bg-zinc-800/60 px-2 py-0.5 text-[10px] text-zinc-400"
                      >
                        {slot.exercise.name}
                      </span>
                    ))}
                    {routine.exercises.length > 4 && (
                      <span className="inline-block rounded-md bg-zinc-800/60 px-2 py-0.5 text-[10px] text-zinc-500">
                        +{routine.exercises.length - 4}
                      </span>
                    )}
                  </div>
                )}
              </Link>

              {/* Actions bar */}
              <div className="flex items-center border-t border-border/50">
                <Link
                  href={`/workout?planId=${routine.id}`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-amber-400 hover:bg-amber-500/10 transition-colors"
                >
                  <Play className="h-3.5 w-3.5" /> Rozpocznij
                </Link>
                <button
                  onClick={() => handleDelete(routine.id)}
                  className="px-3 py-2.5 text-muted-foreground/40 hover:text-red-400 transition-colors border-l border-border/50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowCreate(false)}
          />
          <div className="relative w-full sm:max-w-md bg-card border border-border rounded-t-2xl sm:rounded-2xl">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-semibold">Nowy plan</h2>
              <button
                onClick={() => setShowCreate(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Nazwa planu
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder='np. "Push Day", "Plan na masę"...'
                  className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Opis (opcjonalnie)
                </label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Krótki opis planu..."
                  rows={2}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
                />
              </div>

              <button
                onClick={handleCreate}
                disabled={!newName.trim() || creating}
                className="w-full rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-40 transition-colors"
              >
                {creating ? "Tworzenie..." : "Stwórz plan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

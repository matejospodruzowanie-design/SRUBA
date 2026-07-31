"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, X } from "lucide-react";
import { MUSCLE_GROUPS } from "@/lib/constants";

interface Exercise {
  id: string;
  name: string;
  equipment: string | null;
  muscles: { muscleGroup: string; isPrimary: boolean }[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
  workoutExerciseIds: string[];
}

export function ExercisePicker({ open, onClose, onSelect, workoutExerciseIds }: Props) {
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState<string | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (muscle) params.set("muscle", muscle);
      params.set("limit", "50");

      const res = await fetch(`/api/exercises/search?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setExercises(data);
      } else {
        setExercises([]);
      }
    } catch {
      setExercises([]);
    } finally {
      setLoading(false);
    }
  }, [query, muscle]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(search, 200);
    return () => clearTimeout(timer);
  }, [query, muscle, open, search]);

  // Reset filters and load on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setMuscle(null);
      // search() fires via the debounce effect above after query/muscle change
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-card border border-border rounded-t-2xl sm:rounded-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold">Dodaj ćwiczenie</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Szukaj ćwiczenia..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="w-full rounded-lg border border-border bg-transparent pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          {/* Muscle chips */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setMuscle(null)}
              className={`rounded-full px-3 py-1 text-xs ${
                !muscle ? "bg-amber-500 text-black" : "bg-border/50 text-muted-foreground"
              }`}
            >
              Wszystkie
            </button>
            {MUSCLE_GROUPS.map((m) => (
              <button
                key={m.id}
                onClick={() => setMuscle(muscle === m.id ? null : m.id)}
                className={`rounded-full px-3 py-1 text-xs ${
                  muscle === m.id ? "bg-amber-500 text-black" : "bg-border/50 text-muted-foreground"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 rounded-lg bg-border/30 animate-pulse" />
              ))}
            </div>
          ) : exercises.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Brak ćwiczeń dla wybranych filtrów
            </p>
          ) : (
            <div className="space-y-1">
              {exercises.map((ex) => {
                const alreadyInWorkout = workoutExerciseIds.includes(ex.id);
                return (
                  <button
                    key={ex.id}
                    onClick={() => {
                      if (!alreadyInWorkout) onSelect(ex);
                    }}
                    disabled={alreadyInWorkout}
                    className={`w-full text-left rounded-lg p-3 transition-colors ${
                      alreadyInWorkout
                        ? "opacity-40 cursor-not-allowed"
                        : "hover:bg-amber-500/10"
                    }`}
                  >
                    <p className="text-sm font-medium">
                      {ex.name}
                      {alreadyInWorkout && " (już dodane)"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {ex.muscles
                        .filter((m) => m.isPrimary)
                        .map((m) => MUSCLE_GROUPS.find((mg) => mg.id === m.muscleGroup)?.label)
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

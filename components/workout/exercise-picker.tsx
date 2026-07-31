"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, X, Clock } from "lucide-react";
import { MUSCLE_GROUPS } from "@/lib/constants";
import { getExerciseImage } from "@/lib/exercise-images";
import { toast } from "sonner";

interface Exercise {
  id: string;
  name: string;
  equipment: string | null;
  videoUrl: string | null;
  muscles: { muscleGroup: string; isPrimary: boolean }[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
  workoutExerciseIds: string[];
}

// ─── Shared sub-components ───

function ExerciseImage({ videoUrl, primaryMuscle, size }: {
  videoUrl: string | null;
  primaryMuscle: string | undefined;
  size: "sm" | "lg";
}) {
  const image = getExerciseImage(videoUrl, primaryMuscle);
  const containerClasses = size === "sm"
    ? "h-12 w-full rounded-lg"
    : "h-12 w-16 rounded-md flex-shrink-0";

  return (
    <div className={`${containerClasses} bg-zinc-900 overflow-hidden flex items-center justify-center`}>
      {image.type === "youtube" ? (
        <img src={image.src} alt="" className="h-full w-full object-cover" loading="lazy" />
      ) : image.type === "emoji" ? (
        <span className={size === "sm" ? "text-xl" : "text-xl"}>{image.emoji}</span>
      ) : (
        <span className={size === "sm" ? "text-muted-foreground/40" : "text-muted-foreground/40 text-lg"}>🏋️</span>
      )}
    </div>
  );
}

function ExerciseCard({ exercise, alreadyInWorkout, onClick, variant }: {
  exercise: Exercise;
  alreadyInWorkout: boolean;
  onClick: () => void;
  variant: "compact" | "horizontal";
}) {
  const primaryMuscle = exercise.muscles.find((m) => m.isPrimary)?.muscleGroup;
  const muscleLabels = exercise.muscles
    .filter((m) => m.isPrimary)
    .map((m) => MUSCLE_GROUPS.find((mg) => mg.id === m.muscleGroup)?.label)
    .filter(Boolean)
    .join(", ");

  if (variant === "compact") {
    return (
      <button
        onClick={onClick}
        disabled={alreadyInWorkout}
        className={`flex-shrink-0 w-20 rounded-xl border p-2 text-center transition-colors ${
          alreadyInWorkout
            ? "border-zinc-800 opacity-40 cursor-not-allowed"
            : "border-border hover:border-amber-500/30 hover:bg-amber-500/5"
        }`}
      >
        <div className="mb-1.5">
          <ExerciseImage videoUrl={exercise.videoUrl} primaryMuscle={primaryMuscle} size="sm" />
        </div>
        <p className="text-[11px] leading-tight line-clamp-2">{exercise.name}</p>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={alreadyInWorkout}
      className={`w-full text-left rounded-lg p-2.5 transition-colors flex items-center gap-3 ${
        alreadyInWorkout ? "opacity-40 cursor-not-allowed" : "hover:bg-amber-500/10"
      }`}
    >
      <ExerciseImage videoUrl={exercise.videoUrl} primaryMuscle={primaryMuscle} size="lg" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">
          {exercise.name}
          {alreadyInWorkout && " (już dodane)"}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {muscleLabels}
        </p>
      </div>
    </button>
  );
}

export function ExercisePicker({ open, onClose, onSelect, workoutExerciseIds }: Props) {
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState<string | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [recentExercises, setRecentExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentLoading, setRecentLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback(async () => {
    // Cancel previous in-flight request to avoid stale responses
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (muscle) params.set("muscle", muscle);
      params.set("limit", "50");

      const res = await fetch(`/api/exercises/search?${params}`, {
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!controller.signal.aborted) {
        setExercises(Array.isArray(data) ? data : []);
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      toast.error("Nie udało się wyszukać ćwiczeń");
      if (!controller.signal.aborted) {
        setExercises([]);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [query, muscle]);

  // Fetch recent exercises on open
  useEffect(() => {
    if (!open) return;
    setRecentLoading(true);
    fetch("/api/exercises/search?recent=true&limit=8")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setRecentExercises(data);
      })
      .catch(() => {
        toast.error("Nie udało się pobrać ostatnich ćwiczeń");
      })
      .finally(() => setRecentLoading(false));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(search, 200);
    return () => clearTimeout(timer);
  }, [query, muscle, open, search]);

  // Reset filters on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setMuscle(null);
    }
  }, [open]);

  if (!open) return null;

  const showRecent = !query && !muscle && recentExercises.length > 0;
  const recentIds = new Set(recentExercises.map((e) => e.id));
  const dedupedExercises = showRecent
    ? exercises.filter((e) => !recentIds.has(e.id))
    : exercises;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-card border border-border rounded-t-2xl sm:rounded-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold">Dodaj ćwiczenie</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Zamknij wybór ćwiczeń">
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
          {/* Recent exercises — shown when no search/filter active */}
          {showRecent && (
            <div className="mb-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Clock className="h-3 w-3" /> Ostatnio używane
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                {recentExercises.slice(0, 8).map((ex) => (
                  <ExerciseCard
                    key={ex.id}
                    exercise={ex}
                    alreadyInWorkout={workoutExerciseIds.includes(ex.id)}
                    onClick={() => onSelect(ex)}
                    variant="compact"
                  />
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 rounded-lg bg-border/30 animate-pulse" />
              ))}
            </div>
          ) : showRecent ? (
            /* Show all exercises below recent when no filter — deduped */
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Wszystkie ćwiczenia
              </p>
              {dedupedExercises.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Wszystkie ćwiczenia są już w ostatnio używanych
                </p>
              ) : (
                <div className="space-y-1">
                  {dedupedExercises.map((ex) => (
                    <ExerciseCard
                      key={ex.id}
                      exercise={ex}
                      alreadyInWorkout={workoutExerciseIds.includes(ex.id)}
                      onClick={() => onSelect(ex)}
                      variant="horizontal"
                    />
                  ))}
              </div>
            )}
            </div>
          ) : exercises.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Brak ćwiczeń dla wybranych filtrów
            </p>
          ) : (
            <div className="space-y-1">
              {exercises.map((ex) => (
                <ExerciseCard
                  key={ex.id}
                  exercise={ex}
                  alreadyInWorkout={workoutExerciseIds.includes(ex.id)}
                  onClick={() => onSelect(ex)}
                  variant="horizontal"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

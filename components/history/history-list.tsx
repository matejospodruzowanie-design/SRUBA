"use client";

import { useRef, useState, useEffect, useCallback, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Dumbbell, Flame, Clock, ChevronRight, Check, Pencil, Trash2, X } from "lucide-react";
import { formatDuration } from "@/lib/fitness-utils";
import { deleteWorkouts } from "@/app/(dashboard)/workout/history-actions";
import { toast } from "sonner";

interface HistoryWorkout {
  id: string;
  name: string;
  startedAt: Date;
  durationSeconds: number | null;
  setCount: number;
  volumeKg: number;
  prCount: number;
}

interface HistoryGroup {
  label: string;
  workouts: HistoryWorkout[];
}

interface Props {
  groups: HistoryGroup[];
}

const LONG_PRESS_MS = 500;

function pluralTrening(n: number) {
  if (n === 1) return "trening";
  if (n >= 2 && n <= 4) return "treningi";
  return "treningów";
}

export function HistoryList({ groups }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const selectionModeRef = useRef(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Id of the row that was long-pressed — the click that ends the press must
  // not toggle it off immediately
  const justLongPressedRef = useRef<string | null>(null);

  useEffect(() => {
    selectionModeRef.current = selectionMode;
  }, [selectionMode]);

  const clearLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // Unmount safety
  useEffect(() => clearLongPress, [clearLongPress]);

  const startLongPress = useCallback(
    (workoutId: string) => {
      clearLongPress();
      longPressTimer.current = setTimeout(() => {
        selectionModeRef.current = true;
        setSelectionMode(true);
        setSelectedIds(new Set([workoutId]));
        justLongPressedRef.current = workoutId;
      }, LONG_PRESS_MS);
    },
    [clearLongPress]
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Exit selection mode when the last row is unchecked
  useEffect(() => {
    if (selectionMode && selectedIds.size === 0) {
      setSelectionMode(false);
    }
  }, [selectionMode, selectedIds]);

  // Escape exits selection mode
  useEffect(() => {
    if (!selectionMode) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectionMode(false);
        setSelectedIds(new Set());
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectionMode]);

  const exitMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleBulkDelete = () => {
    const n = selectedIds.size;
    if (n === 0) return;
    if (!confirm(`Na pewno usunąć ${n} ${pluralTrening(n)}? Tej operacji nie można cofnąć.`)) return;
    startTransition(async () => {
      try {
        const res = await deleteWorkouts(Array.from(selectedIds));
        if (res && "error" in res) {
          toast.error(res.error);
          return;
        }
        toast.success(`Usunięto ${res.deletedCount} ${pluralTrening(res.deletedCount)}`);
        exitMode();
        router.refresh();
      } catch {
        toast.error("Nie udało się usunąć treningów");
      }
    });
  };

  const handleEdit = () => {
    if (selectedIds.size !== 1) return;
    const [id] = Array.from(selectedIds);
    router.push(`/workout/${id}/edit`);
  };

  const rowContent = (workout: HistoryWorkout) => (
    <>
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
          <Dumbbell className="h-4 w-4 text-amber-400" />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{workout.name}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            <span>
              {format(new Date(workout.startedAt), "EEE, HH:mm", { locale: pl })}
            </span>
            {workout.durationSeconds != null && (
              <span className="flex items-center gap-0.5">
                <Clock className="h-3 w-3" />
                {formatDuration(workout.durationSeconds)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs flex-shrink-0">
        <span className="text-muted-foreground tabular-nums">
          {workout.setCount} serii
        </span>
        <span className="text-muted-foreground tabular-nums w-16 text-right">
          {workout.volumeKg.toLocaleString()} kg
        </span>
        {workout.prCount > 0 ? (
          <span className="text-amber-400 w-12 text-right">
            <Flame className="h-3 w-3 inline mr-0.5" />
            {workout.prCount}
          </span>
        ) : (
          <span className="w-12" />
        )}
        <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
      </div>
    </>
  );

  return (
    <div className="space-y-6">
      {groups.map((group) => {
        const weekVolume = group.workouts.reduce((sum, w) => sum + w.volumeKg, 0);
        const weekPrs = group.workouts.reduce((sum, w) => sum + w.prCount, 0);

        return (
          <div key={group.label} className="space-y-2">
            {/* Week header */}
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {group.label}
              </h3>
              <div className="flex items-center gap-3 text-xs text-muted-foreground/60">
                <span>
                  {group.workouts.length}{" "}
                  {pluralTrening(group.workouts.length)}
                </span>
                <span>{weekVolume.toLocaleString()} kg</span>
                {weekPrs > 0 && (
                  <span className="text-amber-400/70">
                    <Flame className="h-3 w-3 inline mr-0.5" />
                    {weekPrs}
                  </span>
                )}
              </div>
            </div>

            {/* Workout rows */}
            {group.workouts.map((workout) => {
              const selected = selectedIds.has(workout.id);
              const baseRow = "flex items-center justify-between rounded-xl border px-4 py-3 transition-all select-none touch-manipulation";

              if (selectionMode) {
                return (
                  <button
                    key={workout.id}
                    onClick={() => {
                      if (justLongPressedRef.current === workout.id) {
                        justLongPressedRef.current = null;
                        return;
                      }
                      toggleSelect(workout.id);
                    }}
                    className={`${baseRow} w-full text-left ${
                      selected
                        ? "border-amber-500/50 bg-amber-500/10"
                        : "border-border bg-card"
                    }`}
                  >
                    {rowContent(workout)}
                    {/* Checkbox */}
                    <span
                      className={`flex-shrink-0 h-5 w-5 rounded-md border flex items-center justify-center ml-2 ${
                        selected ? "bg-amber-500 border-amber-500" : "border-border"
                      }`}
                    >
                      {selected && <Check className="h-3 w-3 text-black" />}
                    </span>
                  </button>
                );
              }

              return (
                <Link
                  key={workout.id}
                  href={`/workout/${workout.id}`}
                  onClick={(e) => {
                    // Long-press may have just switched us to selection mode —
                    // the click that ends the press must not navigate
                    if (selectionModeRef.current) {
                      e.preventDefault();
                      if (justLongPressedRef.current === workout.id) {
                        justLongPressedRef.current = null;
                      }
                    }
                  }}
                  onPointerDown={(e) => {
                    if (e.pointerType === "mouse" && e.button !== 0) return;
                    startLongPress(workout.id);
                  }}
                  onPointerUp={clearLongPress}
                  onPointerLeave={clearLongPress}
                  onPointerCancel={clearLongPress}
                  onContextMenu={(e) => e.preventDefault()}
                  className={`${baseRow} border-border bg-card group hover:border-amber-500/20`}
                >
                  {rowContent(workout)}
                </Link>
              );
            })}
          </div>
        );
      })}

      {/* Selection bar */}
      {selectionMode && (
        <div className="fixed bottom-20 left-4 right-4 z-40 lg:left-auto lg:right-4 lg:bottom-4 lg:w-96 rounded-xl border border-amber-500/30 bg-card p-3 shadow-xl">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Zaznaczono: {selectedIds.size} {pluralTrening(selectedIds.size)}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleEdit}
                disabled={selectedIds.size !== 1 || isPending}
                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs text-amber-400 hover:bg-amber-500/10 disabled:opacity-40 transition-colors"
              >
                <Pencil className="h-3 w-3" /> Edytuj
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={isPending}
                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 disabled:opacity-40 transition-colors"
              >
                <Trash2 className="h-3 w-3" /> Usuń
              </button>
              <button
                onClick={exitMode}
                disabled={isPending}
                className="rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:bg-border/50 disabled:opacity-40 transition-colors"
                aria-label="Anuluj zaznaczanie"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

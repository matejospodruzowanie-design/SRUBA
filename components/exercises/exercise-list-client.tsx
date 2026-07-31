"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Dumbbell, Plus, Trash2 } from "lucide-react";
import { MUSCLE_GROUPS, EQUIPMENT } from "@/lib/constants";
import { deleteCustomExercise } from "@/app/(dashboard)/exercises/actions";
import { CustomExerciseModal } from "./custom-exercise-modal";
import { toast } from "sonner";

interface Exercise {
  id: string;
  name: string;
  equipment: string | null;
  isCustom: boolean;
  muscles: { muscleGroup: string; isPrimary: boolean }[];
}

interface Props {
  exercises: Exercise[];
}

export function ExerciseListClient({ exercises }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const visible = exercises.filter((e) => !deletedIds.has(e.id));

  const handleDelete = (id: string) => {
    setDeletedIds((prev) => new Set(prev).add(id));
    startTransition(async () => {
      const result = await deleteCustomExercise(id);
      if (result?.error) {
        toast.error(result.error);
        setDeletedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    });
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {visible.length} ćwiczeń
        </p>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-amber-500/30 hover:text-amber-400 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> Dodaj własne
        </button>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Dumbbell className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Brak ćwiczeń dla wybranych filtrów</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          {visible.map((ex) => (
            <div key={ex.id} className="group relative">
              <Link
                href={`/exercises/${ex.id}`}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 hover:border-amber-500/20 transition-all block"
              >
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <Dumbbell className="h-4 w-4 text-amber-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {ex.name}
                    {ex.isCustom && (
                      <span className="ml-1.5 text-[10px] text-amber-400/60">(własne)</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {ex.muscles
                      .map((m) => MUSCLE_GROUPS.find((mg) => mg.id === m.muscleGroup)?.label ?? m.muscleGroup)
                      .join(", ")}
                    {ex.equipment
                      ? ` · ${EQUIPMENT.find((e) => e.id === ex.equipment)?.label || ex.equipment}`
                      : ""}
                  </p>
                </div>
              </Link>

              {/* Delete button for custom exercises */}
              {ex.isCustom && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete(ex.id);
                  }}
                  disabled={isPending}
                  className="absolute top-2 right-2 p-1.5 rounded-lg text-muted-foreground/30 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                  title="Usuń ćwiczenie"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <CustomExerciseModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}

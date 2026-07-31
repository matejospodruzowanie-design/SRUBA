"use client";

import { useState, useTransition } from "react";
import { X, Plus } from "lucide-react";
import { MUSCLE_GROUPS, EQUIPMENT } from "@/lib/constants";
import { createCustomExercise } from "@/app/(dashboard)/exercises/actions";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CustomExerciseModal({ open, onClose }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      try {
        const result = await createCustomExercise(formData);
        if (result?.error) {
          toast.error(result.error);
        } else {
          toast.success("Ćwiczenie dodane!");
          form.reset();
          onClose();
        }
      } catch {
        toast.error("Nie udało się dodać ćwiczenia");
      }
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-card border border-border rounded-t-2xl sm:rounded-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold flex items-center gap-2">
            <Plus className="h-4 w-4" /> Dodaj własne ćwiczenie
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground" type="button">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Nazwa ćwiczenia <span className="text-red-400">*</span>
            </label>
            <input
              name="name"
              type="text"
              required
              placeholder="np. Przysiad bułgarski"
              className="w-full rounded-lg border border-border bg-transparent px-3 py-2.5 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          {/* Muscle group */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Główna partia mięśniowa <span className="text-red-400">*</span>
            </label>
            <select
              name="muscleGroup"
              required
              defaultValue=""
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            >
              <option value="" disabled>
                Wybierz partię...
              </option>
              {MUSCLE_GROUPS.map((mg) => (
                <option key={mg.id} value={mg.id}>
                  {mg.label}
                </option>
              ))}
            </select>
          </div>

          {/* Equipment */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">Sprzęt</label>
            <select
              name="equipment"
              defaultValue=""
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            >
              <option value="">Dowolny</option>
              {EQUIPMENT.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.label}
                </option>
              ))}
            </select>
          </div>

          {/* Video URL */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Link do YouTube (opcjonalnie)
            </label>
            <input
              name="videoUrl"
              type="url"
              placeholder="https://youtube.com/watch?v=..."
              className="w-full rounded-lg border border-border bg-transparent px-3 py-2.5 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          {/* Instructions */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">Instrukcja (opcjonalnie)</label>
            <textarea
              name="instructions"
              rows={3}
              placeholder="Opisz technikę wykonania..."
              className="w-full rounded-lg border border-border bg-transparent px-3 py-2.5 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-black hover:bg-amber-400 transition-colors disabled:opacity-50"
          >
            {isPending ? "Dodawanie..." : "Dodaj ćwiczenie"}
          </button>
        </form>
      </div>
    </div>
  );
}

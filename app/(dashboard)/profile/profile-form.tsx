"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES, GOALS, EXPERIENCE_LEVELS } from "@/lib/constants";
import { updateProfile } from "./actions";
import { toast } from "sonner";

interface Props {
  user: {
    category: string;
    goal: string;
    experience: string;
    heightCm: number | null;
    weightKg: number | null;
  };
}

export function UpdateProfileForm({ user }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);

    const heightStr = form.get("heightCm") as string;
    const weightStr = form.get("weightKg") as string;

    try {
      await updateProfile({
        category: form.get("category") as string,
        goal: form.get("goal") as string,
        experience: form.get("experience") as string,
        heightCm: heightStr ? parseFloat(heightStr) : null,
        weightKg: weightStr ? parseFloat(weightStr) : null,
      });
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    } catch {
      toast.error("Nie udało się zapisać");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Body measurements */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Wzrost (cm)
          </label>
          <input
            type="number"
            name="heightCm"
            defaultValue={user.heightCm ?? ""}
            placeholder="np. 180"
            min={100}
            max={250}
            step={0.5}
            className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Waga (kg)
          </label>
          <input
            type="number"
            name="weightKg"
            defaultValue={user.weightKg ?? ""}
            placeholder="np. 80"
            min={30}
            max={300}
            step={0.5}
            className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Kategoria
        </label>
        <select
          name="category"
          defaultValue={user.category}
          className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.icon} {cat.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Cel</label>
        <select
          name="goal"
          defaultValue={user.goal}
          className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
        >
          {GOALS.map((g) => (
            <option key={g.id} value={g.id}>
              {g.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Poziom
        </label>
        <select
          name="experience"
          defaultValue={user.experience}
          className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
        >
          {EXPERIENCE_LEVELS.map((lvl) => (
            <option key={lvl.id} value={lvl.id}>
              {lvl.label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-50 transition-colors"
      >
        {saving ? "Zapisywanie..." : saved ? "✓ Zapisano!" : "Zapisz zmiany"}
      </button>
    </form>
  );
}

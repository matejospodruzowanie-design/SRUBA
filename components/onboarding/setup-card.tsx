"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ruler, Weight, ChevronRight, Check } from "lucide-react";
import { updateProfile } from "@/app/(dashboard)/profile/actions";
import { toast } from "sonner";

interface Props {
  className?: string;
}

export function SetupCard({ className }: Props) {
  const router = useRouter();
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const handleSave = async () => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (!h || !w) return;

    setSaving(true);
    try {
      await updateProfile({
        heightCm: h,
        weightKg: w,
      });
      setDone(true);
      router.refresh();
    } catch {
      toast.error("Nie udało się zapisać");
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <div className={`rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 ${className}`}>
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <Check className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Konfiguracja zapisana!</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {height} cm · {weight} kg
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] p-5 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-lg">👋</span>
        <div>
          <h3 className="font-bold text-sm">Skonfiguruj swój profil</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Podaj wzrost i wagę, aby aplikacja mogła lepiej śledzić Twoje
            postępy
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="space-y-1">
          <label className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
            <Ruler className="h-3 w-3" /> Wzrost (cm)
          </label>
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="np. 180"
            min={100}
            max={250}
            step={0.5}
            className="w-full rounded-lg border border-border bg-zinc-900/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
            <Weight className="h-3 w-3" /> Waga (kg)
          </label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="np. 80"
            min={30}
            max={300}
            step={0.5}
            className="w-full rounded-lg border border-border bg-zinc-900/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={!height || !weight || saving}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-40 transition-all"
      >
        {saving ? (
          "Zapisywanie..."
        ) : (
          <>
            Zapisz i przejdź dalej <ChevronRight className="h-4 w-4" />
          </>
        )}
      </button>
    </div>
  );
}

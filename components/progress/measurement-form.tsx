"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Weight, Ruler } from "lucide-react";
import { addBodyMeasurement } from "@/app/(dashboard)/progress/actions";
import { format } from "date-fns";
import { toast } from "sonner";

interface Props {
  currentWeight: number | null;
}

export function MeasurementForm({ currentWeight }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [weight, setWeight] = useState(currentWeight ? String(currentWeight) : "");
  const [bodyFat, setBodyFat] = useState("");
  const [chest, setChest] = useState("");
  const [waist, setWaist] = useState("");
  const [hips, setHips] = useState("");
  const [arms, setArms] = useState("");
  const [thighs, setThighs] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await addBodyMeasurement({
        weightKg: weight ? parseFloat(weight) : null,
        bodyFatPct: bodyFat ? parseFloat(bodyFat) : null,
        chestCm: chest ? parseFloat(chest) : null,
        waistCm: waist ? parseFloat(waist) : null,
        hipsCm: hips ? parseFloat(hips) : null,
        armsCm: arms ? parseFloat(arms) : null,
        thighsCm: thighs ? parseFloat(thighs) : null,
        date,
      });
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Nie udało się zapisać pomiaru");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-black hover:bg-amber-400 transition-colors"
      >
        <Plus className="h-4 w-4" /> Dodaj pomiar
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full sm:max-w-lg bg-card border border-border rounded-t-2xl sm:rounded-2xl max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-semibold">Nowy pomiar</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="overflow-y-auto p-4 space-y-4"
            >
              {/* Date */}
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Data pomiaru
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              {/* Weight + BF */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Weight className="h-3 w-3" /> Waga (kg)
                  </label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder={currentWeight ? String(currentWeight) : "np. 80"}
                    step={0.1}
                    min={30}
                    max={300}
                    className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    BF (%)
                  </label>
                  <input
                    type="number"
                    value={bodyFat}
                    onChange={(e) => setBodyFat(e.target.value)}
                    placeholder="np. 15"
                    step={0.1}
                    min={3}
                    max={60}
                    className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
              </div>

              {/* Circumference measurements */}
              <div>
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
                  <Ruler className="h-3 w-3" /> Obwody (cm) — opcjonalnie
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-muted-foreground">
                      Klatka
                    </label>
                    <input
                      type="number"
                      value={chest}
                      onChange={(e) => setChest(e.target.value)}
                      placeholder="100"
                      step={0.5}
                      className="w-full rounded-lg border border-border bg-card px-2.5 py-2 text-xs mt-0.5 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">
                      Talia
                    </label>
                    <input
                      type="number"
                      value={waist}
                      onChange={(e) => setWaist(e.target.value)}
                      placeholder="80"
                      step={0.5}
                      className="w-full rounded-lg border border-border bg-card px-2.5 py-2 text-xs mt-0.5 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">
                      Biodra
                    </label>
                    <input
                      type="number"
                      value={hips}
                      onChange={(e) => setHips(e.target.value)}
                      placeholder="95"
                      step={0.5}
                      className="w-full rounded-lg border border-border bg-card px-2.5 py-2 text-xs mt-0.5 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">
                      Biceps
                    </label>
                    <input
                      type="number"
                      value={arms}
                      onChange={(e) => setArms(e.target.value)}
                      placeholder="35"
                      step={0.5}
                      className="w-full rounded-lg border border-border bg-card px-2.5 py-2 text-xs mt-0.5 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">
                      Uda
                    </label>
                    <input
                      type="number"
                      value={thighs}
                      onChange={(e) => setThighs(e.target.value)}
                      placeholder="55"
                      step={0.5}
                      className="w-full rounded-lg border border-border bg-card px-2.5 py-2 text-xs mt-0.5 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                  </div>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={saving || (!weight && !bodyFat && !chest && !waist && !hips && !arms && !thighs)}
                className="w-full rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-40 transition-colors"
              >
                {saving ? "Zapisywanie..." : "Zapisz pomiar"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

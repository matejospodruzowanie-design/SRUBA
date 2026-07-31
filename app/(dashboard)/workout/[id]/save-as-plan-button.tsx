"use client";

import { useTransition, useState } from "react";
import { Copy, Check } from "lucide-react";
import { saveWorkoutAsPlan } from "./save-action";
import { toast } from "sonner";

interface Props {
  workoutId: string;
}

export function SaveAsPlanButton({ workoutId }: Props) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    startTransition(async () => {
      try {
        const result = await saveWorkoutAsPlan(workoutId);
        if (result?.error) {
          toast.error(result.error);
        } else {
          setSaved(true);
          toast.success("Zapisano jako plan!");
          setTimeout(() => setSaved(false), 3000);
        }
      } catch {
        toast.error("Nie udało się zapisać planu");
      }
    });
  };

  return (
    <button
      onClick={handleSave}
      disabled={isPending || saved}
      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
        saved
          ? "border-green-500/30 text-green-400 bg-green-500/10"
          : "border-border text-muted-foreground hover:border-amber-500/30 hover:text-amber-400"
      } disabled:opacity-50`}
    >
      {saved ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {saved ? "Zapisano!" : "Zapisz jako plan"}
    </button>
  );
}

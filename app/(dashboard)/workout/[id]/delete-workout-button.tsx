"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteWorkout } from "@/app/(dashboard)/workout/actions";
import { toast } from "sonner";

interface Props {
  workoutId: string;
}

export function DeleteWorkoutButton({ workoutId }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = () => {
    if (!confirm("Na pewno usunąć ten trening? Tej operacji nie można cofnąć.")) return;

    startTransition(async () => {
      try {
        const result = await deleteWorkout(workoutId);
        if (result && "error" in result) {
          toast.error(result.error);
          return;
        }
        toast.success("Trening usunięty");
        router.push("/history");
        router.refresh();
      } catch {
        toast.error("Nie udało się usunąć treningu");
      }
    });
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="flex items-center gap-1.5 rounded-lg border border-red-500/20 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
    >
      <Trash2 className="h-3.5 w-3.5" />
      {isPending ? "Usuwanie..." : "Usuń"}
    </button>
  );
}

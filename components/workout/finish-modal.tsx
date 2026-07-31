"use client";

import { useState } from "react";
import { finishWorkout as finishWorkoutAction } from "@/app/(dashboard)/workout/actions";
import { Trophy, Zap, Star, X } from "lucide-react";
import { formatDuration } from "@/lib/fitness-utils";
import { toast } from "sonner";

const RANK_LABELS: Record<string, string> = {
  bronze: "Brąz",
  silver: "Srebro",
  gold: "Złoto",
  platinum: "Platyna",
  diamond: "Diament",
  global_elite: "Global Elite",
};

interface FinishModalProps {
  workoutId: string;
  setCount: number;
  onClose: () => void;       // dismiss without finishing (backdrop click, "Jeszcze nie")
  onFinished: () => void;    // called after successful finish (navigate to /history)
}

interface FinishResult {
  setCount: number;
  prCount: number;
  durationSeconds: number;
  xpResult: {
    xpGain: { sets: number; workout: number; prs: number; streak: number; total: number };
    oldLevel: number;
    newLevel: number;
    leveledUp: boolean;
    rankChanged?: boolean;
    newRank?: string;
  };
  newAchievements: string[];
}

export function FinishModal({ workoutId, setCount, onClose, onFinished }: FinishModalProps) {
  const [result, setResult] = useState<FinishResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFinish = async () => {
    setLoading(true);
    try {
      const res = await finishWorkoutAction(workoutId);
      if (res && "error" in res) {
        toast.error(res.error as string);
        onClose();
        return;
      }
      setResult(res as FinishResult);
    } catch {
      toast.error("Nie udało się zakończyć treningu");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!result) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60" onClick={onClose} />
        <div className="relative w-full max-w-sm bg-card border border-border rounded-2xl p-6 space-y-6">
          <div className="text-center space-y-2">
            <Trophy className="h-10 w-10 text-amber-400 mx-auto" />
            <h2 className="text-lg font-bold">Zakończyć trening?</h2>
            <p className="text-sm text-muted-foreground">
              Wykonałeś {setCount} {setCount === 1 ? "serię" : setCount < 5 ? "serie" : "serii"}.
              Gotowy na podsumowanie?
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium hover:bg-border/20 transition-colors"
            >
              Jeszcze nie
            </button>
            <button
              onClick={handleFinish}
              disabled={loading}
              className="flex-1 rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-50 transition-colors"
            >
              {loading ? "Zapisywanie..." : "Zakończ"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Result card
  const { xpResult } = result;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative w-full max-w-sm bg-card border border-border rounded-2xl p-6 space-y-5 max-h-[85vh] overflow-y-auto">
        <button onClick={onFinished} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>

        <div className="text-center space-y-2">
          <Trophy className="h-12 w-12 text-amber-400 mx-auto" />
          <h2 className="text-xl font-bold">Trening zakończony!</h2>
          <p className="text-sm text-muted-foreground">
            {result.setCount} serii · {formatDuration(result.durationSeconds)} · {result.prCount} nowych rekordów
          </p>
        </div>

        {/* XP gained */}
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-amber-400 flex items-center gap-1">
            <Zap className="h-4 w-4" /> Zdobyte XP
          </h3>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Serie ({result.setCount})</span>
              <span className="tabular-nums">+{xpResult.xpGain.sets}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Trening</span>
              <span className="tabular-nums">+{xpResult.xpGain.workout}</span>
            </div>
            {xpResult.xpGain.prs > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rekordy ({result.prCount})</span>
                <span className="tabular-nums text-amber-400">+{xpResult.xpGain.prs}</span>
              </div>
            )}
            {xpResult.xpGain.streak > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Streak</span>
                <span className="tabular-nums">+{xpResult.xpGain.streak}</span>
              </div>
            )}
            <div className="flex justify-between font-bold pt-1 border-t border-amber-500/20">
              <span>Razem</span>
              <span className="text-amber-400 tabular-nums">+{xpResult.xpGain.total} XP</span>
            </div>
          </div>

          {xpResult.leveledUp && (
            <div className="text-center py-2 rounded-lg bg-amber-500/20 animate-pulse">
              <Star className="h-5 w-5 text-amber-400 mx-auto mb-1" />
              <p className="text-sm font-bold text-amber-400">
                Awans na poziom {xpResult.newLevel}!
              </p>
            </div>
          )}

          {xpResult.rankChanged && xpResult.newRank && (
            <div className="text-center py-2 rounded-lg bg-purple-500/20 animate-pulse">
              <Trophy className="h-5 w-5 text-purple-400 mx-auto mb-1" />
              <p className="text-sm font-bold text-purple-400">
                Nowa ranga: {RANK_LABELS[xpResult.newRank] || xpResult.newRank}!
              </p>
            </div>
          )}
        </div>

        {/* New achievements */}
        {result.newAchievements.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Nowe osiągnięcia</h3>
            {result.newAchievements.map((name) => (
              <div key={name} className="rounded-lg bg-border/20 px-3 py-2 text-sm">
                🏆 {name}
              </div>
            ))}
          </div>
        )}

        <button
          onClick={onFinished}
          className="w-full rounded-lg bg-amber-500 py-3 text-sm font-semibold text-black hover:bg-amber-400 transition-colors"
        >
          Przejdź do historii
        </button>
      </div>
    </div>
  );
}

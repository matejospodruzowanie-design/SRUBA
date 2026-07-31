import Link from "next/link";
import { Suspense } from "react";
import { getUser } from "@/lib/session";
import { Dumbbell, TrendingUp, Target, Flame, Zap, ChevronRight } from "lucide-react";
import { SetupCard } from "@/components/onboarding/setup-card";
import { RecoverySection } from "@/components/recovery/recovery-section";
import { SkeletonCard } from "@/components/ui/skeleton";

const RANK_LABELS: Record<string, string> = {
  bronze: "Brąz",
  silver: "Srebro",
  gold: "Złoto",
  platinum: "Platyna",
  diamond: "Diament",
  global_elite: "Global Elite",
};

const RANK_COLORS: Record<string, string> = {
  bronze: "#cd7f32",
  silver: "#c0c0c0",
  gold: "#ffd700",
  platinum: "#08a0e9",
  diamond: "#b9f2ff",
  global_elite: "#ff4500",
};

export default async function DashboardPage() {
  const user = await getUser();

  return (
    <div className="space-y-5 sm:space-y-8 stagger-children">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">
            Cześć, {user.name?.split(" ")[0] || "wojowniku"}!
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Gotowy na dzisiejszy trening?
          </p>
        </div>
        {/* Mini rank badge */}
        <div
          className="h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center text-lg sm:text-xl font-bold border-2"
          style={{
            borderColor: RANK_COLORS[user.rank] || "#888",
            color: RANK_COLORS[user.rank] || "#888",
          }}
        >
          {RANK_LABELS[user.rank]?.charAt(0) || "?"}
        </div>
      </div>

      {/* Onboarding — show if height/weight not set */}
      {(!user.heightCm || !user.weightKg) && (
        <SetupCard className="animate-in fade-in slide-in-from-top-2" />
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        <div className="rounded-xl border border-border bg-card p-3 sm:p-4 text-center space-y-0.5">
          <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">Ranga</span>
          <p className="text-sm sm:text-base font-bold" style={{ color: RANK_COLORS[user.rank] }}>
            {RANK_LABELS[user.rank]}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-3 sm:p-4 text-center space-y-0.5">
          <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider flex items-center justify-center gap-0.5">
            <Zap className="h-3 w-3" /> Poz.
          </span>
          <p className="text-sm sm:text-base font-bold text-amber-400">{user.level}</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-3 sm:p-4 text-center space-y-0.5">
          <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider flex items-center justify-center gap-0.5">
            <Flame className="h-3 w-3" /> Streak
          </span>
          <p className="text-sm sm:text-base font-bold text-orange-400">{user.streak}</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-3 sm:p-4 text-center space-y-0.5">
          <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">XP</span>
          <p className="text-sm sm:text-base font-bold text-amber-400">{user.xp}</p>
        </div>
      </div>

      {/* Quick action — Start workout (prominent on mobile) */}
      <Link
        href="/workout"
        className="flex items-center gap-4 rounded-2xl bg-amber-500 hover:bg-amber-400 transition-colors p-5 text-black group"
      >
        <div className="h-12 w-12 rounded-xl bg-black/20 flex items-center justify-center flex-shrink-0">
          <Dumbbell className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-bold">
            Rozpocznij trening
          </h3>
          <p className="text-sm text-black/70">
            Zacznij nową sesję
          </p>
        </div>
        <ChevronRight className="h-5 w-5 text-black/50 group-hover:translate-x-0.5 transition-transform" />
      </Link>

      {/* Secondary actions */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <Link
          href="/progress"
          className="rounded-xl border border-border bg-card hover:border-amber-500/20 transition-all p-4 space-y-2 group"
        >
          <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold group-hover:text-amber-400 transition-colors">
              Progress
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Statystyki i rekordy
            </p>
          </div>
        </Link>

        <Link
          href="/plans"
          className="rounded-xl border border-border bg-card hover:border-amber-500/20 transition-all p-4 space-y-2 group"
        >
          <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Target className="h-4 w-4 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold group-hover:text-amber-400 transition-colors">
              Plany
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Przeglądaj i twórz
            </p>
          </div>
        </Link>
      </div>

      {/* Recovery heatmap — streamed in */}
      <Suspense fallback={<SkeletonCard className="h-80" />}>
        <RecoverySection />
      </Suspense>

    </div>
  );
}

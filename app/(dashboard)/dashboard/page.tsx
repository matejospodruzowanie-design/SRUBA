import Link from "next/link";
import { Suspense } from "react";
import { getUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { Dumbbell, TrendingUp, Target, Flame, Zap, ChevronRight, Clock, BarChart3 } from "lucide-react";
import { SetupCard } from "@/components/onboarding/setup-card";
import { RecoverySection } from "@/components/recovery/recovery-section";
import { SkeletonCard } from "@/components/ui/skeleton";
import { formatDistanceToNow, startOfDay, subDays, isSameDay, isToday, format } from "date-fns";
import { pl } from "date-fns/locale";
import { formatDuration } from "@/lib/fitness-utils";
import { CATEGORIES, GOALS, RANKS } from "@/lib/constants";
import { levelFromXp, xpToNextLevel } from "@/lib/gamification";

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

  // Fetch last completed workout for summary
  const lastWorkout = await prisma.workout.findFirst({
    where: { userId: user.id, isActive: false, endedAt: { not: null } },
    orderBy: { endedAt: "desc" },
    include: {
      sets: {
        select: { id: true, weightKg: true, reps: true, isPR: true },
      },
    },
  });

  const lastVolume = lastWorkout?.sets.reduce((sum, s) => sum + (s.weightKg ?? 0) * s.reps, 0) ?? 0;
  const lastPRs = lastWorkout?.sets.filter((s) => s.isPR).length ?? 0;

  // Week strip — last 7 days workout summary
  const today = startOfDay(new Date());
  const weekDays = Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i));
  const weekWorkouts = await prisma.workout.findMany({
    where: {
      userId: user.id,
      isActive: false,
      endedAt: { gte: subDays(today, 6), not: null },
    },
    select: { endedAt: true },
  });

  return (
    <div className="space-y-5 sm:space-y-8 stagger-children">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">
            Cześć, {user.name?.split(" ")[0] || "wojowniku"}!
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {GOALS.find((g) => g.id === user.goal)?.label
              ? `Cel: ${GOALS.find((g) => g.id === user.goal)?.label} · ${CATEGORIES.find((c) => c.id === user.category)?.icon} ${CATEGORIES.find((c) => c.id === user.category)?.label}`
              : "Gotowy na dzisiejszy trening?"}
          </p>
          {/* Rank progress bar */}
          {(() => {
            const xpNext = xpToNextLevel(user.xp);
            const currentLevel = levelFromXp(user.xp);
            const xpIntoLevel = xpNext > 0 ? Math.round((1 - xpNext / (xpToNextLevel(user.xp - 1) + xpNext)) * 100) : 100;
            const nextRank = RANKS.filter((r) => r.minScore > 0).find((r) => user.xp < r.minScore);
            return (
              <div className="mt-2 space-y-0.5 max-w-[200px]">
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Poziom {currentLevel}</span>
                  {nextRank && <span className="text-amber-400/70">→ {nextRank.label}</span>}
                </div>
                <div className="h-1 rounded-full bg-border overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all"
                    style={{ width: `${xpIntoLevel}%` }}
                  />
                </div>
              </div>
            );
          })()}
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

      {/* Week strip — 7-day mini calendar like Lyfta */}
      <div className="flex gap-1.5 justify-between">
        {weekDays.map((day) => {
          const hasWorkout = weekWorkouts.some((w) => w.endedAt && isSameDay(new Date(w.endedAt), day));
          const dayIsToday = isToday(day);
          const dayNames = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];
          const dayIndex = day.getDay();
          const dayLabel = dayNames[dayIndex === 0 ? 6 : dayIndex - 1]; // Convert Sun=0 to Mon=0
          return (
            <div key={day.toISOString()} className="flex flex-col items-center gap-1 flex-1">
              <span className="text-[10px] text-muted-foreground">{dayLabel}</span>
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  hasWorkout
                    ? "bg-amber-500 text-black"
                    : dayIsToday
                    ? "border-2 border-amber-500/50 text-amber-400"
                    : "bg-zinc-900 text-muted-foreground/40"
                }`}
              >
                {format(day, "d")}
              </div>
            </div>
          );
        })}
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

      {/* Last workout summary */}
      {lastWorkout && (
        <Link
          href={`/workout/${lastWorkout.id}`}
          className="block rounded-xl border border-border bg-card hover:border-amber-500/20 transition-all p-4 space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground">Ostatni trening</h3>
            <span className="text-xs text-muted-foreground/60">
              {formatDistanceToNow(new Date(lastWorkout.endedAt!), { addSuffix: true, locale: pl })}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <p className="font-semibold group-hover:text-amber-400 transition-colors">
              {lastWorkout.name}
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {lastWorkout.durationSeconds ? formatDuration(lastWorkout.durationSeconds) : "—"}
            </span>
            <span className="flex items-center gap-1">
              <BarChart3 className="h-3 w-3" />
              {lastWorkout.sets.length} serii
            </span>
            <span className="flex items-center gap-1">
              <Dumbbell className="h-3 w-3" />
              {Math.round(lastVolume).toLocaleString()} kg
            </span>
            {lastPRs > 0 && (
              <span className="flex items-center gap-1 text-amber-400">
                <Flame className="h-3 w-3" />
                {lastPRs} PR
              </span>
            )}
          </div>
        </Link>
      )}

      {/* Recovery heatmap — streamed in */}
      <Suspense fallback={<SkeletonCard className="h-80" />}>
        <RecoverySection />
      </Suspense>

    </div>
  );
}

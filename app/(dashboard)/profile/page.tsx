import { getUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { CATEGORIES, GOALS, EXPERIENCE_LEVELS, RANKS } from "@/lib/constants";
import { Dumbbell, Weight, Hash, Flame, Zap, Trophy, Award, Lock } from "lucide-react";
import { UpdateProfileForm } from "./profile-form";
import { Suspense } from "react";
import { SkeletonCard } from "@/components/ui/skeleton";

const RANK_LABELS: Record<string, string> = {};
RANKS.forEach((r) => { RANK_LABELS[r.id] = r.label; });

const RANK_COLORS: Record<string, string> = {
  bronze: "#cd7f32",
  silver: "#c0c0c0",
  gold: "#ffd700",
  platinum: "#08a0e9",
  diamond: "#b9f2ff",
  global_elite: "#ff4500",
};

export default async function ProfilePage() {
  const user = await getUser();

  const [totalWorkouts, totalSets, totalPRs] = await Promise.all([
    prisma.workout.count({
      where: { userId: user.id, isActive: false, endedAt: { not: null } },
    }),
    prisma.workoutSet.count({
      where: { workout: { userId: user.id, isActive: false } },
    }),
    prisma.personalRecord.count({
      where: { userId: user.id },
    }),
  ]);

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Profil</h1>
        <p className="text-muted-foreground mt-1">Zarządzaj swoim kontem</p>
      </div>

      {/* User info card */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-amber-500/20 flex items-center justify-center text-2xl font-bold text-amber-400">
            {user.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div>
            <h2 className="text-lg font-bold">{user.name}</h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Dołączył: {new Date(user.createdAt).toLocaleDateString("pl-PL")}
            </p>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="rounded-xl border border-border bg-card p-3 sm:p-4 text-center space-y-0.5">
          <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider flex items-center justify-center gap-1">
            <Dumbbell className="h-3 w-3" /> Treningi
          </span>
          <p className="text-lg sm:text-xl font-bold text-amber-400">
            {totalWorkouts}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 sm:p-4 text-center space-y-0.5">
          <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider flex items-center justify-center gap-1">
            <Hash className="h-3 w-3" /> Serie
          </span>
          <p className="text-lg sm:text-xl font-bold">{totalSets}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 sm:p-4 text-center space-y-0.5">
          <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider flex items-center justify-center gap-1">
            <Trophy className="h-3 w-3" /> Rekordy
          </span>
          <p className="text-lg sm:text-xl font-bold text-amber-400">{totalPRs}</p>
        </div>
      </div>

      {/* Level & XP stats */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h3 className="font-semibold">Statystyki</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: `${RANK_COLORS[user.rank]}15` }}>
              <Trophy className="h-5 w-5" style={{ color: RANK_COLORS[user.rank] }} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ranga</p>
              <p className="font-bold" style={{ color: RANK_COLORS[user.rank] }}>
                {RANK_LABELS[user.rank] || user.rank}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Zap className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Poziom</p>
              <p className="font-bold">{user.level}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Weight className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">XP</p>
              <p className="font-bold">{user.xp}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <Flame className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Streak</p>
              <p className="font-bold">{user.streak} dni</p>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <AchievementsSection userId={user.id} />

      {/* Settings form */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="font-semibold mb-4">Ustawienia treningowe</h3>
        <UpdateProfileForm
          user={{
            category: user.category,
            goal: user.goal,
            experience: user.experience,
            heightCm: user.heightCm,
            weightKg: user.weightKg,
          }}
        />
      </div>
    </div>
  );
}

async function AchievementsSection({ userId }: { userId: string }) {
  const achievements = await prisma.achievement.findMany({
    include: {
      users: {
        where: { userId },
        select: { unlockedAt: true },
      },
    },
    orderBy: { id: "asc" },
  });

  const unlocked = achievements.filter((a) => a.users.length > 0);

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      <h3 className="font-semibold flex items-center gap-2">
        <Award className="h-4 w-4 text-amber-400" />
        Achievementy ({unlocked.length}/{achievements.length})
      </h3>

      <div className="grid grid-cols-2 gap-2">
        {achievements.map((a) => {
          const isUnlocked = a.users.length > 0;
          return (
            <div
              key={a.id}
              className={`rounded-lg border p-3 flex items-center gap-3 ${
                isUnlocked
                  ? "border-amber-500/20 bg-amber-500/5"
                  : "border-border/50 bg-zinc-900/30 opacity-50"
              }`}
            >
              <span className="text-2xl flex-shrink-0">{a.icon}</span>
              <div className="min-w-0">
                <p className={`text-sm font-medium truncate ${isUnlocked ? "" : "text-muted-foreground"}`}>
                  {a.name}
                </p>
                <p className="text-[10px] text-muted-foreground line-clamp-1">
                  {a.description}
                </p>
                {isUnlocked ? (
                  <p className="text-[10px] text-amber-400/70 mt-0.5">
                    Odblokowano: {new Date(a.users[0].unlockedAt).toLocaleDateString("pl-PL")}
                  </p>
                ) : (
                  <Lock className="h-3 w-3 text-muted-foreground/30 mt-0.5" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

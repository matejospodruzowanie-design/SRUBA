import { getUser } from "@/lib/session";
import { CATEGORIES, GOALS, EXPERIENCE_LEVELS, RANKS } from "@/lib/constants";
import { UpdateProfileForm } from "./profile-form";

const RANK_LABELS: Record<string, string> = {};
RANKS.forEach((r) => { RANK_LABELS[r.id] = r.label; });

export default async function ProfilePage() {
  const user = await getUser();

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

      {/* Stats */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h3 className="font-semibold">Statystyki</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Ranga</p>
            <p className="font-bold text-amber-400">{RANK_LABELS[user.rank] || user.rank}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Poziom</p>
            <p className="font-bold">{user.level}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">XP</p>
            <p className="font-bold">{user.xp}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Streak</p>
            <p className="font-bold">{user.streak} dni</p>
          </div>
        </div>
      </div>

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

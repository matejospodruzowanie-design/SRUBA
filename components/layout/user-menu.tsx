"use client";

import { LogOut, Zap, Flame } from "lucide-react";
import { logout } from "@/app/(auth)/logout/actions";
import { RANK_LABELS, RANK_COLORS } from "@/lib/constants";

interface UserMenuProps {
  user: {
    name: string | null;
    email: string;
    level: number;
    xp: number;
    streak: number;
    rank: string;
    image: string | null;
  };
}

const XP_FOR_NEXT_LEVEL = (level: number) => 100 * level * (level + 1) / 2;

export function UserMenu({ user }: UserMenuProps) {
  const xpForNext = XP_FOR_NEXT_LEVEL(user.level);
  const progress = Math.min(100, Math.round((user.xp / xpForNext) * 100));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        {user.image ? (
          <img
            src={user.image}
            alt={user.name || "Avatar"}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center text-sm font-bold text-amber-400">
            {user.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{user.name || "Użytkownik"}</p>
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-semibold"
              style={{ color: RANK_COLORS[user.rank] || "#888" }}
            >
              {RANK_LABELS[user.rank] || user.rank}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Poziom {user.level}</span>
          <span>{user.xp} / {xpForNext} XP</span>
        </div>
        <div className="h-1.5 rounded-full bg-border overflow-hidden">
          <div
            className="h-full bg-amber-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Flame className="h-3 w-3 text-orange-400" />
          {user.streak} dni
        </span>
        <span className="flex items-center gap-1">
          <Zap className="h-3 w-3 text-amber-400" />
          Poz. {user.level}
        </span>
      </div>

      <button
        onClick={() => logout()}
        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
      >
        <LogOut className="h-3.5 w-3.5" />
        Wyloguj się
      </button>
    </div>
  );
}

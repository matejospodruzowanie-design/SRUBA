import { prisma } from "@/lib/db";
import { RANKS } from "@/lib/constants";

const XP_PER_SET = 5;
const XP_PER_WORKOUT = 25;
const XP_PER_PR = 50;

/** Total XP needed to reach a given level */
export function xpForLevel(level: number): number {
  return (100 * level * (level + 1)) / 2;
}

/** Calculate current level from total XP */
export function levelFromXp(xp: number): number {
  let level = 1;
  while (xp >= xpForLevel(level)) {
    level++;
  }
  return Math.max(1, level - 1);
}

/** Calculate how much XP to reach next level */
export function xpToNextLevel(xp: number): number {
  const currentLevel = levelFromXp(xp);
  return xpForLevel(currentLevel + 1) - xp;
}

/**
 * Determine rank from XP using RANKS thresholds.
 * Ranks sorted descending by minScore — finds the highest one the user qualifies for.
 */
export function rankFromXp(xp: number): string {
  const sorted = [...RANKS].sort((a, b) => b.minScore - a.minScore);
  for (const rank of sorted) {
    if (xp >= rank.minScore) return rank.id;
  }
  return "bronze";
}

export interface XpGain {
  sets: number;
  workout: number;
  prs: number;
  streak: number;
  total: number;
}

export interface LevelUpResult {
  xpGain: XpGain;
  oldLevel: number;
  newLevel: number;
  leveledUp: boolean;
  rankChanged: boolean;
  newRank: string;
}

/**
 * Apply XP gain after finishing a workout.
 * Updates the user's XP, level, and rank in the database.
 */
export async function applyXp(
  userId: string,
  setCount: number,
  prCount: number,
  streak: number
): Promise<LevelUpResult> {
  const xpGain: XpGain = {
    sets: setCount * XP_PER_SET,
    workout: XP_PER_WORKOUT,
    prs: prCount * XP_PER_PR,
    streak: streak * 10,
    total: 0,
  };
  xpGain.total = xpGain.sets + xpGain.workout + xpGain.prs + xpGain.streak;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { xpGain, oldLevel: 1, newLevel: 1, leveledUp: false, rankChanged: false, newRank: "bronze" };

  const oldLevel = levelFromXp(user.xp);
  const oldRank = user.rank;
  const newXp = user.xp + xpGain.total;
  const newLevel = levelFromXp(newXp);
  const newRank = rankFromXp(newXp);

  await prisma.user.update({
    where: { id: userId },
    data: { xp: newXp, level: newLevel, rank: newRank },
  });

  return {
    xpGain,
    oldLevel,
    newLevel,
    leveledUp: newLevel > oldLevel,
    rankChanged: newRank !== oldRank,
    newRank,
  };
}

/**
 * Check and award any newly unlocked achievements.
 */
export async function checkAchievements(userId: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { achievements: true },
  });
  if (!user) return [];

  const workoutCount = await prisma.workout.count({ where: { userId } });
  const prCount = await prisma.personalRecord.count({ where: { userId } });
  const unlockedCodes = new Set(user.achievements.map((a) => a.achievementId));

  const checks: { code: string; condition: boolean }[] = [
    { code: "first_workout", condition: workoutCount >= 1 },
    { code: "streak_3", condition: user.streak >= 3 },
    { code: "streak_7", condition: user.streak >= 7 },
    { code: "streak_30", condition: user.streak >= 30 },
    { code: "pr_first", condition: prCount >= 1 },
    { code: "pr_10", condition: prCount >= 10 },
    { code: "level_5", condition: user.level >= 5 },
    { code: "level_10", condition: user.level >= 10 },
    { code: "level_25", condition: user.level >= 25 },
  ];

  const newAchievements: string[] = [];
  for (const check of checks) {
    if (check.condition && !unlockedCodes.has(check.code)) {
      const achievement = await prisma.achievement.findUnique({
        where: { code: check.code },
      });
      if (achievement) {
        await prisma.userAchievement.create({
          data: { userId, achievementId: achievement.id },
        });
        newAchievements.push(achievement.name);
      }
    }
  }

  return newAchievements;
}

/**
 * Update streak: if last workout was yesterday, increment; if today, keep; otherwise reset.
 */
export async function updateStreak(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return 0;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);

  let newStreak = 1;
  if (user.lastWorkoutAt) {
    const lastDate = new Date(
      user.lastWorkoutAt.getFullYear(),
      user.lastWorkoutAt.getMonth(),
      user.lastWorkoutAt.getDate()
    );

    if (lastDate.getTime() === today.getTime()) {
      newStreak = user.streak; // already worked out today
    } else if (lastDate.getTime() === yesterday.getTime()) {
      newStreak = user.streak + 1; // consecutive day
    }
    // else: more than 1 day gap — reset to 1
  }

  await prisma.user.update({
    where: { id: userId },
    data: { streak: newStreak, lastWorkoutAt: now },
  });

  return newStreak;
}

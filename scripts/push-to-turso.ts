/**
 * One-shot script: pushes SQL schema + seed exercises to Turso.
 * Run: npx tsx scripts/push-to-turso.ts
 */
import "dotenv/config";
import { createClient } from "@libsql/client";

const url = process.env.TURSO_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("❌ Set TURSO_URL and TURSO_AUTH_TOKEN env vars");
  process.exit(1);
}

const turso = createClient({ url, authToken });

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS "Achievement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "name" TEXT,
    "passwordHash" TEXT,
    "image" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "rank" TEXT NOT NULL DEFAULT 'bronze',
    "category" TEXT NOT NULL DEFAULT 'bodybuilding',
    "goal" TEXT NOT NULL DEFAULT 'general',
    "experience" TEXT NOT NULL DEFAULT 'beginner',
    "heightCm" REAL,
    "weightKg" REAL,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "lastWorkoutAt" DATETIME
);

CREATE TABLE IF NOT EXISTS "Exercise" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "equipment" TEXT,
    "instructions" TEXT,
    "videoUrl" TEXT,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Exercise_name_idx" ON "Exercise" ("name");

CREATE TABLE IF NOT EXISTS "ExerciseMuscle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "exerciseId" TEXT NOT NULL,
    "muscleGroup" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,
    FOREIGN KEY ("exerciseId") REFERENCES "Exercise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "ExerciseMuscle_exerciseId_muscleGroup_key" ON "ExerciseMuscle" ("exerciseId", "muscleGroup");

CREATE TABLE IF NOT EXISTS "Workout" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    "durationSeconds" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Workout_userId_startedAt_idx" ON "Workout" ("userId", "startedAt");

CREATE TABLE IF NOT EXISTS "WorkoutSet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workoutId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "setNumber" INTEGER NOT NULL,
    "weightKg" REAL,
    "reps" INTEGER NOT NULL,
    "rpe" REAL,
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isPR" BOOLEAN NOT NULL DEFAULT false,
    FOREIGN KEY ("workoutId") REFERENCES "Workout" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("exerciseId") REFERENCES "Exercise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "WorkoutSet_workoutId_idx" ON "WorkoutSet" ("workoutId");
CREATE INDEX IF NOT EXISTS "WorkoutSet_exerciseId_completedAt_idx" ON "WorkoutSet" ("exerciseId", "completedAt");

CREATE TABLE IF NOT EXISTS "Routine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Routine_userId_idx" ON "Routine" ("userId");

CREATE TABLE IF NOT EXISTS "RoutineExercise" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "routineId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "targetSets" INTEGER NOT NULL,
    "targetReps" TEXT NOT NULL,
    "restSeconds" INTEGER NOT NULL,
    FOREIGN KEY ("routineId") REFERENCES "Routine" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("exerciseId") REFERENCES "Exercise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "RoutineExercise_routineId_position_key" ON "RoutineExercise" ("routineId", "position");

CREATE TABLE IF NOT EXISTS "BodyMeasurement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weightKg" REAL,
    "bodyFatPct" REAL,
    "chestCm" REAL,
    "waistCm" REAL,
    "hipsCm" REAL,
    "armsCm" REAL,
    "thighsCm" REAL,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "BodyMeasurement_userId_date_idx" ON "BodyMeasurement" ("userId", "date");

CREATE TABLE IF NOT EXISTS "PersonalRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "achievedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "workoutId" TEXT,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("exerciseId") REFERENCES "Exercise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "PersonalRecord_userId_exerciseId_type_key" ON "PersonalRecord" ("userId", "exerciseId", "type");

CREATE TABLE IF NOT EXISTS "MuscleFatigue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "muscleGroup" TEXT NOT NULL,
    "snapshotDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "loadScore" REAL NOT NULL,
    "fatiguePct" INTEGER NOT NULL,
    "expectedRecoveryHours" REAL NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "MuscleFatigue_userId_muscleGroup_snapshotDate_key" ON "MuscleFatigue" ("userId", "muscleGroup", "snapshotDate");

CREATE TABLE IF NOT EXISTS "UserAchievement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "unlockedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("achievementId") REFERENCES "Achievement" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserAchievement_userId_achievementId_key" ON "UserAchievement" ("userId", "achievementId");

CREATE TABLE IF NOT EXISTS "CoachMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "CoachMessage_userId_createdAt_idx" ON "CoachMessage" ("userId", "createdAt");
`;

async function main() {
  console.log("🚀 Pushing schema to Turso...");

  // Split by statement and execute each
  const statements = SCHEMA_SQL
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    try {
      await turso.execute(stmt + ";");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!msg.includes("already exists")) {
        console.error(`  ❌ ${stmt.slice(0, 60)}...`);
        console.error(`     ${msg}`);
      }
    }
  }

  console.log("✅ Schema pushed!");

  // Seed achievements
  console.log("🌱 Seeding achievements...");
  const achievements = [
    { code: "first_workout", name: "Pierwszy trening", description: "Ukończ swój pierwszy trening", icon: "🎯" },
    { code: "streak_3", name: "Trzy dni z rzędu", description: "Trenuj 3 dni z rzędu", icon: "🔥" },
    { code: "streak_7", name: "Tydzień mocy", description: "Trenuj 7 dni z rzędu", icon: "🔥" },
    { code: "streak_30", name: "Nie do zatrzymania", description: "Trenuj 30 dni z rzędu", icon: "💀" },
    { code: "pr_first", name: "Pierwszy rekord", description: "Pobij swój pierwszy rekord osobisty", icon: "⭐" },
    { code: "pr_10", name: "Łowca rekordów", description: "Pobij 10 rekordów osobistych", icon: "🏆" },
    { code: "level_5", name: "Początkujący wojownik", description: "Osiągnij poziom 5", icon: "⚔️" },
    { code: "level_10", name: "Weteran", description: "Osiągnij poziom 10", icon: "🛡️" },
    { code: "level_25", name: "Legenda", description: "Osiągnij poziom 25", icon: "👑" },
  ];

  for (const a of achievements) {
    await turso.execute({
      sql: `INSERT OR IGNORE INTO "Achievement" (id, code, name, description, icon) VALUES (?, ?, ?, ?, ?)`,
      args: [crypto.randomUUID(), a.code, a.name, a.description, a.icon],
    });
  }
  console.log(`  ✓ ${achievements.length} achievements seeded`);

  // Seed exercises
  console.log("🌱 Seeding exercises...");
  const { prisma } = await import("../lib/db");

  const exercises = await prisma.exercise.findMany({
    include: { muscles: true },
  });

  for (const ex of exercises) {
    const id = ex.id;
    await turso.execute({
      sql: `INSERT OR IGNORE INTO "Exercise" (id, name, equipment, instructions, videoUrl, isCustom, userId) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [id, ex.name, ex.equipment, ex.instructions, ex.videoUrl, ex.isCustom ? 1 : 0, ex.userId],
    });

    for (const m of ex.muscles) {
      await turso.execute({
        sql: `INSERT OR IGNORE INTO "ExerciseMuscle" (id, exerciseId, muscleGroup, isPrimary) VALUES (?, ?, ?, ?)`,
        args: [crypto.randomUUID(), id, m.muscleGroup, m.isPrimary ? 1 : 0],
      });
    }

    console.log(`  ✓ ${ex.name}`);
  }

  console.log(`\n✅ Done! Turso database is ready.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("❌ Failed:", e);
  process.exit(1);
});

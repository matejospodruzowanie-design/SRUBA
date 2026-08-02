import { prisma } from "@/lib/db";
import { getUser } from "@/lib/session";
import Link from "next/link";
import { format, startOfWeek } from "date-fns";
import { pl } from "date-fns/locale";
import { Dumbbell, ChevronRight } from "lucide-react";
import { HistoryList } from "@/components/history/history-list";

const PAGE_SIZE = 20;

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await getUser();
  const params = await searchParams;
  const cursor = typeof params.cursor === "string" ? params.cursor : undefined;
  const rawPage = typeof params.page === "string" ? parseInt(params.page) : 1;
  const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;

  const workouts = await prisma.workout.findMany({
    where: { userId: user.id, isActive: false, endedAt: { not: null } },
    include: {
      sets: {
        select: { id: true, isPR: true, weightKg: true, reps: true },
      },
    },
    orderBy: { startedAt: "desc" },
    take: PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : { skip: (page - 1) * PAGE_SIZE }),
  });

  const hasMore = workouts.length > PAGE_SIZE;
  if (hasMore) workouts.pop();

  // Check if user has any workouts at all (for proper empty state)
  const totalCount = workouts.length > 0 ? workouts.length : await prisma.workout.count({
    where: { userId: user.id, isActive: false, endedAt: { not: null } },
  });

  // Group by ISO week — pass a serializable structure to the client list
  const weekGroups = new Map<string, typeof workouts>();
  for (const w of workouts) {
    const weekStart = startOfWeek(new Date(w.startedAt), { weekStartsOn: 1 });
    const key = format(weekStart, "yyyy-MM-dd");
    if (!weekGroups.has(key)) weekGroups.set(key, []);
    weekGroups.get(key)!.push(w);
  }

  const groups = Array.from(weekGroups.entries()).map(([weekKey, weekWorkouts]) => {
    const weekDate = new Date(weekKey);
    const weekEnd = new Date(weekDate);
    weekEnd.setDate(weekEnd.getDate() + 6);

    return {
      label: `Tydzień ${format(weekDate, "d MMM", { locale: pl })} – ${format(weekEnd, "d MMM yyyy", { locale: pl })}`,
      workouts: weekWorkouts.map((w) => ({
        id: w.id,
        name: w.name,
        startedAt: w.startedAt,
        durationSeconds: w.durationSeconds,
        setCount: w.sets.length,
        volumeKg: Math.round(
          w.sets.reduce((sum, s) => sum + (s.weightKg ?? 0) * s.reps, 0)
        ),
        prCount: w.sets.filter((s) => s.isPR).length,
      })),
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Historia treningów</h1>
        <p className="text-muted-foreground mt-1">
          {workouts.length > 0
            ? `Ostatnie ${workouts.length} treningów`
            : "Twoje dotychczasowe sesje"}
        </p>
      </div>

      {workouts.length === 0 && totalCount === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Dumbbell className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">Brak treningów</h3>
          <p className="text-sm text-muted-foreground/60 mt-1">Rozpocznij swój pierwszy trening!</p>
          <Link
            href="/workout"
            className="inline-flex items-center gap-1 mt-4 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400 transition-colors"
          >
            <Dumbbell className="h-4 w-4" /> Rozpocznij trening
          </Link>
        </div>
      ) : workouts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Brak treningów na tej stronie.</p>
          <Link href="/history?page=1" className="text-sm text-amber-400 hover:text-amber-300 mt-2 inline-block">
            ← Wróć do pierwszej strony
          </Link>
        </div>
      ) : (
        <HistoryList groups={groups} />
      )}

      {/* Pagination */}
      {hasMore && (
        <div className="text-center pb-4">
          <Link
            href={`/history?page=${page + 1}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-5 py-2.5 text-sm text-muted-foreground hover:border-amber-500/30 hover:text-amber-400 transition-colors"
          >
            Załaduj więcej
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}

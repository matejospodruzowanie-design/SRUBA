import { prisma } from "@/lib/db";
import { getUser } from "@/lib/session";
import { notFound } from "next/navigation";
import { EQUIPMENT, MUSCLE_GROUPS } from "@/lib/constants";
import { ArrowLeft, Play, Info, Dumbbell, TrendingUp } from "lucide-react";
import Link from "next/link";
import { getExerciseImage } from "@/lib/exercise-images";

export default async function ExerciseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUser();
  const { id } = await params;

  const exercise = await prisma.exercise.findUnique({
    where: { id },
    include: { muscles: true },
  });

  // Only show built-in exercises or user's own custom exercises
  if (!exercise || (exercise.isCustom && exercise.userId !== user.id)) {
    notFound();
  }

  const primaryMuscles = exercise.muscles.filter((m) => m.isPrimary);
  const secondaryMuscles = exercise.muscles.filter((m) => !m.isPrimary);
  const image = getExerciseImage(exercise.videoUrl, primaryMuscles[0]?.muscleGroup);

  return (
    <div className="space-y-6 max-w-3xl">
      <Link
        href="/exercises"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Powrót do biblioteki
      </Link>

      {/* Thumbnail */}
      <div className="h-48 sm:h-56 w-full rounded-xl bg-zinc-900 overflow-hidden flex items-center justify-center border border-border">
        {image.type === "youtube" ? (
          <img src={image.src} alt="" className="h-full w-full object-cover" />
        ) : image.type === "emoji" ? (
          <span className="text-6xl">{image.emoji}</span>
        ) : (
          <Dumbbell className="h-12 w-12 text-muted-foreground/30" />
        )}
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{exercise.name}</h1>
          <div className="flex flex-wrap gap-2 mt-2">
          {exercise.equipment && (
            <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
              {EQUIPMENT.find((e) => e.id === exercise.equipment)?.label || exercise.equipment}
            </span>
          )}
          {primaryMuscles.map((m) => (
            <span
              key={m.id}
              className="rounded-full bg-card border border-border px-3 py-1 text-xs text-foreground"
            >
              {MUSCLE_GROUPS.find((mg) => mg.id === m.muscleGroup)?.label || m.muscleGroup}
            </span>
          ))}
        </div>
        </div>
        <Link
          href={`/progress/${exercise.id}`}
          className="flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-400 hover:bg-amber-500/20 transition-colors flex-shrink-0"
        >
          <TrendingUp className="h-3.5 w-3.5" /> Progress
        </Link>
      </div>

      {/* Video embed — only for validated YouTube URLs */}
      {exercise.videoUrl && (() => {
        let videoId: string | null = null;
        try {
          const url = new URL(exercise.videoUrl);
          if (url.hostname.includes("youtube.com") || url.hostname === "youtu.be") {
            videoId = url.searchParams.get("v")
              || url.pathname.split("/embed/")[1]
              || url.pathname.split("/shorts/")[1]
              || (url.hostname === "youtu.be" ? url.pathname.slice(1) : null);
          }
        } catch { /* invalid URL — skip embed */ }
        if (!videoId) return null;
        return (
          <div className="rounded-xl overflow-hidden border border-border">
            <div className="aspect-video">
              <iframe
                src={`https://youtube.com/embed/${videoId}`}
                allow="accelerometer; autoplay; encrypted-media; gyroscope"
                allowFullScreen
                className="w-full h-full"
                referrerPolicy="strict-origin-when-cross-origin"
                sandbox="allow-scripts allow-same-origin allow-presentation"
              />
            </div>
          </div>
        );
      })()}

      {/* Muscles section */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Info className="h-4 w-4 text-amber-400" />
          Zaangażowane mięśnie
        </h3>
        <div className="space-y-2">
          {primaryMuscles.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Główne:</p>
              <div className="flex flex-wrap gap-1">
                {primaryMuscles.map((m) => (
                  <span
                    key={m.id}
                    className="rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400"
                  >
                    {MUSCLE_GROUPS.find((mg) => mg.id === m.muscleGroup)?.label || m.muscleGroup}
                  </span>
                ))}
              </div>
            </div>
          )}
          {secondaryMuscles.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Pomocnicze:</p>
              <div className="flex flex-wrap gap-1">
                {secondaryMuscles.map((m) => (
                  <span
                    key={m.id}
                    className="rounded-md bg-card border border-border px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    {MUSCLE_GROUPS.find((mg) => mg.id === m.muscleGroup)?.label || m.muscleGroup}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      {exercise.instructions && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Play className="h-4 w-4 text-amber-400" />
            Instrukcja wykonania
          </h3>
          <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {exercise.instructions}
          </div>
        </div>
      )}
    </div>
  );
}

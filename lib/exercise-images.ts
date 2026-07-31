/**
 * Extract YouTube thumbnail from video URL.
 * Supports: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID
 */
export function getYouTubeThumbnail(videoUrl: string | null | undefined): string | null {
  if (!videoUrl) return null;
  let id: string | null = null;

  try {
    const url = new URL(videoUrl);
    if (url.hostname.includes("youtube.com")) {
      id = url.searchParams.get("v") || url.pathname.split("/embed/")[1] || null;
    } else if (url.hostname === "youtu.be") {
      id = url.pathname.slice(1);
    }
  } catch {
    // Not a valid URL, try basic regex
    const match = videoUrl.match(/(?:v=|embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    id = match?.[1] ?? null;
  }

  if (!id) return null;
  return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
}

/**
 * Get exercise image: YouTube thumbnail → muscle group emoji → generic dumbbell
 */
const MUSCLE_EMOJIS: Record<string, string> = {
  chest: "🏋️",
  back: "🔙",
  shoulders: "🦾",
  biceps: "💪",
  triceps: "💪",
  forearms: "🤛",
  abs: "🫃",
  quads: "🦵",
  hamstrings: "🦵",
  glutes: "🍑",
  calves: "🦵",
  traps: "🤷",
  lower_back: "🔙",
};

export function getExerciseImage(
  videoUrl: string | null | undefined,
  primaryMuscle: string | null | undefined
): { type: "youtube" | "emoji" | "none"; src?: string; emoji?: string } {
  const thumb = getYouTubeThumbnail(videoUrl);
  if (thumb) return { type: "youtube", src: thumb };

  if (primaryMuscle && MUSCLE_EMOJIS[primaryMuscle]) {
    return { type: "emoji", emoji: MUSCLE_EMOJIS[primaryMuscle] };
  }

  return { type: "none" };
}

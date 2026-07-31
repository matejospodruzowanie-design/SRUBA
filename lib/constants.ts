export const MUSCLE_GROUPS = [
  { id: "chest", label: "Klatka piersiowa", color: "#ef4444" },
  { id: "back", label: "Plecy", color: "#f97316" },
  { id: "shoulders", label: "Barki", color: "#eab308" },
  { id: "biceps", label: "Biceps", color: "#22c55e" },
  { id: "triceps", label: "Triceps", color: "#06b6d4" },
  { id: "forearms", label: "Przedramiona", color: "#3b82f6" },
  { id: "abs", label: "Brzuch", color: "#8b5cf6" },
  { id: "traps", label: "Kaptury", color: "#ec4899" },
  { id: "quads", label: "Czworogłowe", color: "#f43f5e" },
  { id: "hamstrings", label: "Dwugłowe", color: "#14b8a6" },
  { id: "glutes", label: "Pośladki", color: "#a855f7" },
  { id: "calves", label: "Łydki", color: "#78716c" },
  { id: "lower_back", label: "Dolny odcinek pleców", color: "#d946ef" },
] as const;

export const EQUIPMENT = [
  { id: "barbell", label: "Sztanga" },
  { id: "dumbbell", label: "Hantle" },
  { id: "machine", label: "Maszyna" },
  { id: "cable", label: "Linki/wyciąg" },
  { id: "bodyweight", label: "Masa ciała" },
  { id: "kettlebell", label: "Kettlebell" },
  { id: "bands", label: "Gumy oporowe" },
] as const;

export const CATEGORIES = [
  { id: "powerlifting", label: "Trójbój siłowy", icon: "🏋️" },
  { id: "calisthenics", label: "Kalistenika", icon: "🤸" },
  { id: "bodybuilding", label: "Kulturystyka", icon: "💪" },
] as const;

export const GOALS = [
  { id: "strength", label: "Siła" },
  { id: "mass", label: "Masa mięśniowa" },
  { id: "fat_loss", label: "Redukcja" },
  { id: "general", label: "Ogólna forma" },
] as const;

export const EXPERIENCE_LEVELS = [
  { id: "beginner", label: "Początkujący" },
  { id: "intermediate", label: "Średniozaawansowany" },
  { id: "advanced", label: "Zaawansowany" },
] as const;

export const RANKS = [
  { id: "bronze", label: "Brąz", color: "#cd7f32", minScore: 0 },
  { id: "silver", label: "Srebro", color: "#c0c0c0", minScore: 300 },
  { id: "gold", label: "Złoto", color: "#ffd700", minScore: 700 },
  { id: "platinum", label: "Platyna", color: "#08a0e9", minScore: 1200 },
  { id: "diamond", label: "Diament", color: "#b9f2ff", minScore: 2000 },
  { id: "global_elite", label: "Global Elite", color: "#ff4500", minScore: 3500 },
] as const;

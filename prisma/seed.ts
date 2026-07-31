import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({ url: "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

interface SeedExercise {
  name: string;
  equipment: string;
  instructions: string;
  videoUrl?: string;
  muscles: { group: string; isPrimary: boolean }[];
}

const EXERCISES: SeedExercise[] = [
  // === KLATKA PIERSIOWA ===
  {
    name: "Wyciskanie sztangi na ławce płaskiej",
    equipment: "barbell",
    instructions: "1. Połóż się na ławce płaskiej, stopy na podłodze.\n2. Chwyć sztangę nachwytem, ręce nieco szerzej niż barki.\n3. Zdejmij sztangę ze stojaków i opuść ją do dolnej części klatki piersiowej.\n4. Wypchnij sztangę w górę do pełnego wyprostu ramion.\n5. Powtórz.",
    videoUrl: "https://www.youtube.com/watch?v=rT7DgCrD1Eg",
    muscles: [
      { group: "chest", isPrimary: true },
      { group: "triceps", isPrimary: false },
      { group: "shoulders", isPrimary: false },
    ],
  },
  {
    name: "Wyciskanie hantli na ławce płaskiej",
    equipment: "dumbbell",
    instructions: "1. Połóż się na ławce płaskiej z hantlami w dłoniach.\n2. Ustaw hantle na wysokości klatki, łokcie pod kątem 90°.\n3. Wypchnij hantle w górę do pełnego wyprostu.\n4. Powoli opuść do pozycji startowej.\n5. Powtórz.",
    videoUrl: "https://www.youtube.com/watch?v=VmB1G1MN_DM",
    muscles: [
      { group: "chest", isPrimary: true },
      { group: "triceps", isPrimary: false },
      { group: "shoulders", isPrimary: false },
    ],
  },
  {
    name: "Wyciskanie hantli na ławce skośnej (góra klatki)",
    equipment: "dumbbell",
    instructions: "1. Ustaw ławkę pod kątem 30-45°.\n2. Połóż się z hantlami w dłoniach na wysokości barków.\n3. Wypchnij hantle w górę.\n4. Powoli opuść.\n5. Powtórz.",
    videoUrl: "https://www.youtube.com/watch?v=0GJ_vp4VvGg",
    muscles: [
      { group: "chest", isPrimary: true },
      { group: "shoulders", isPrimary: false },
      { group: "triceps", isPrimary: false },
    ],
  },
  {
    name: "Rozpiętki z hantlami na ławce płaskiej",
    equipment: "dumbbell",
    instructions: "1. Połóż się na ławce płaskiej z hantlami nad klatką.\n2. Z lekkim ugięciem w łokciach, szeroko otwórz ramiona na boki.\n3. Poczuj rozciąganie w klatce.\n4. Ściągnij hantle z powrotem nad klatkę.\n5. Powtórz.",
    videoUrl: "https://www.youtube.com/watch?v=eozdVDA78K0",
    muscles: [
      { group: "chest", isPrimary: true },
    ],
  },
  {
    name: "Wyciskanie na maszynie (butterfly / pec deck)",
    equipment: "machine",
    instructions: "1. Usiądź na maszynie, oprzyj plecy o oparcie.\n2. Chwyć uchwyty, ramiona równolegle do podłogi.\n3. Ściągnij uchwyty przed siebie, napinając klatkę.\n4. Powoli wróć do pozycji startowej.\n5. Powtórz.",
    muscles: [
      { group: "chest", isPrimary: true },
    ],
  },

  // === PLECY ===
  {
    name: "Martwy ciąg klasyczny",
    equipment: "barbell",
    instructions: "1. Stań ze stopami na szerokość bioder, sztanga nad śródstopiem.\n2. Zegnij biodra i kolana, chwyć sztangę nachwytem lub chwytem mieszanym.\n3. Trzymaj plecy proste, wypnij klatkę.\n4. Wstań, prowadząc sztangę blisko nóg.\n5. Opuść sztangę w ten sam sposób.",
    videoUrl: "https://www.youtube.com/watch?v=1ZXobu7JvvE",
    muscles: [
      { group: "back", isPrimary: true },
      { group: "glutes", isPrimary: true },
      { group: "hamstrings", isPrimary: true },
      { group: "lower_back", isPrimary: false },
      { group: "traps", isPrimary: false },
      { group: "forearms", isPrimary: false },
    ],
  },
  {
    name: "Podciąganie na drążku (nachwyt)",
    equipment: "bodyweight",
    instructions: "1. Chwyć drążek nachwytem, ręce szerzej niż barki.\n2. Zwisnij swobodnie.\n3. Podciągnij się, aż broda znajdzie się nad drążkiem.\n4. Powoli opuść się do pozycji startowej.\n5. Powtórz.",
    videoUrl: "https://www.youtube.com/watch?v=eGo4IYlbE5g",
    muscles: [
      { group: "back", isPrimary: true },
      { group: "biceps", isPrimary: false },
      { group: "forearms", isPrimary: false },
    ],
  },
  {
    name: "Wiosłowanie sztangą podchwytem",
    equipment: "barbell",
    instructions: "1. Stań ze stopami na szerokość bioder, sztanga przed sobą.\n2. Zegnij biodra do kąta ~45°, plecy proste.\n3. Chwyć sztangę podchwytem.\n4. Przyciągnij sztangę do dolnej części brzucha.\n5. Powoli opuść i powtórz.",
    videoUrl: "https://www.youtube.com/watch?v=T3N-TO4w8WQ",
    muscles: [
      { group: "back", isPrimary: true },
      { group: "biceps", isPrimary: false },
      { group: "lower_back", isPrimary: false },
    ],
  },
  {
    name: "Wiosłowanie hantlą w opadzie (jednorącz)",
    equipment: "dumbbell",
    instructions: "1. Oprzyj jedno kolano i dłoń na ławce.\n2. Drugą ręką chwyć hantlę.\n3. Przyciągnij hantlę do biodra, trzymając łokieć blisko ciała.\n4. Powoli opuść.\n5. Powtórz na obie strony.",
    videoUrl: "https://www.youtube.com/watch?v=pYcpY20QaE8",
    muscles: [
      { group: "back", isPrimary: true },
      { group: "biceps", isPrimary: false },
    ],
  },
  {
    name: "Ściąganie linki wyciągu górnego do klatki (lat pulldown)",
    equipment: "cable",
    instructions: "1. Usiądź przy wyciągu górnym, uda pod podpórkami.\n2. Chwyć drążek szerokim nachwytem.\n3. Ściągnij drążek do górnej części klatki.\n4. Powoli puść do góry.\n5. Powtórz.",
    videoUrl: "https://www.youtube.com/watch?v=CAwf7n6Luuc",
    muscles: [
      { group: "back", isPrimary: true },
      { group: "biceps", isPrimary: false },
    ],
  },

  // === BARKI ===
  {
    name: "Wyciskanie żołnierskie (OHP) ze sztangą stojąc",
    equipment: "barbell",
    instructions: "1. Stań ze stopami na szerokość barków, sztanga na wysokości obojczyków.\n2. Chwyć sztangę nachwytem, ręce nieco szerzej niż barki.\n3. Wypchnij sztangę nad głowę do pełnego wyprostu.\n4. Powoli opuść do pozycji startowej.\n5. Powtórz.",
    videoUrl: "https://www.youtube.com/watch?v=_RlRDWO2jfg",
    muscles: [
      { group: "shoulders", isPrimary: true },
      { group: "triceps", isPrimary: false },
      { group: "traps", isPrimary: false },
    ],
  },
  {
    name: "Unoszenie hantli bokiem",
    equipment: "dumbbell",
    instructions: "1. Stań z hantlami wzdłuż ciała, lekko ugięte łokcie.\n2. Unieś hantle na boki do wysokości barków.\n3. Nie bujaj tułowiem.\n4. Powoli opuść.\n5. Powtórz.",
    videoUrl: "https://www.youtube.com/watch?v=3VcKaXpzOqg",
    muscles: [
      { group: "shoulders", isPrimary: true },
      { group: "traps", isPrimary: false },
    ],
  },
  {
    name: "Unoszenie hantli w opadzie tułowia (tylne barki)",
    equipment: "dumbbell",
    instructions: "1. Zegnij tułów do przodu, plecy proste.\n2. Ramiona zwisają swobodnie z hantlami.\n3. Unieś hantle na boki, ściskając łopatki.\n4. Powoli opuść.\n5. Powtórz.",
    muscles: [
      { group: "shoulders", isPrimary: true },
      { group: "back", isPrimary: false },
    ],
  },
  {
    name: "Face pull (przyciąganie linki do twarzy)",
    equipment: "cable",
    instructions: "1. Ustaw wyciąg górny na wysokość twarzy, zamocuj linkę.\n2. Chwyć linkę obiema rękami.\n3. Przyciągnij linkę do twarzy, rotując ramiona na zewnątrz.\n4. Powoli puść.\n5. Powtórz.",
    videoUrl: "https://www.youtube.com/watch?v=V8dZ3pyiCBo",
    muscles: [
      { group: "shoulders", isPrimary: true },
      { group: "traps", isPrimary: false },
    ],
  },

  // === BICEPS ===
  {
    name: "Uginanie ramion ze sztangą stojąc",
    equipment: "barbell",
    instructions: "1. Stań ze sztangą trzymaną podchwytem, ręce na szerokość barków.\n2. Łokcie przy ciele.\n3. Ugnij ramiona, przyciągając sztangę do barków.\n4. Powoli opuść.\n5. Powtórz.",
    videoUrl: "https://www.youtube.com/watch?v=kwG2ipFRgfo",
    muscles: [
      { group: "biceps", isPrimary: true },
      { group: "forearms", isPrimary: false },
    ],
  },
  {
    name: "Uginanie ramion z hantlami (młotkowe)",
    equipment: "dumbbell",
    instructions: "1. Stań z hantlami wzdłuż ciała, chwyt młotkowy (kciuki do przodu).\n2. Ugnij ramiona przyciągając hantle do barków.\n3. Powoli opuść.\n4. Powtórz.",
    videoUrl: "https://www.youtube.com/watch?v=zC3nLlE1FjE",
    muscles: [
      { group: "biceps", isPrimary: true },
      { group: "forearms", isPrimary: true },
    ],
  },
  {
    name: "Uginanie ramion z linkami wyciągu dolnego",
    equipment: "cable",
    instructions: "1. Stań przodem do wyciągu dolnego, chwyć linkę/prosty drążek podchwytem.\n2. Łokcie przy ciele.\n3. Ugnij ramiona przyciągając do barków.\n4. Powoli opuść.\n5. Powtórz.",
    muscles: [
      { group: "biceps", isPrimary: true },
    ],
  },

  // === TRICEPS ===
  {
    name: "Wyciskanie francuskie (lezac na ławce płaskiej)",
    equipment: "barbell",
    instructions: "1. Połóż się na ławce, sztanga nad głową w wyprostowanych rękach.\n2. Ugnij łokcie opuszczając sztangę za głowę.\n3. Wyprostuj ramiona, wracając do pozycji startowej.\n4. Powtórz.",
    videoUrl: "https://www.youtube.com/watch?v=d_KZxkY_0cM",
    muscles: [
      { group: "triceps", isPrimary: true },
    ],
  },
  {
    name: "Prostowanie ramion na wyciągu górnym (pushdown)",
    equipment: "cable",
    instructions: "1. Stań przodem do wyciągu górnego, chwyć linkę/drążek.\n2. Łokcie przy ciele.\n3. Wyprostuj ramiona w dół do pełnego wyprostu.\n4. Powoli wróć.\n5. Powtórz.",
    videoUrl: "https://www.youtube.com/watch?v=2-LAMcpzODU",
    muscles: [
      { group: "triceps", isPrimary: true },
    ],
  },
  {
    name: "Dipy na poręczach (pompki na triceps)",
    equipment: "bodyweight",
    instructions: "1. Chwyć poręcze, wyprostuj ramiona.\n2. Opuść się uginając łokcie do kąta ~90°.\n3. Trzymaj łokcie blisko ciała.\n4. Wypchnij się w górę.\n5. Powtórz.",
    videoUrl: "https://www.youtube.com/watch?v=jdFzYGmvDyg",
    muscles: [
      { group: "triceps", isPrimary: true },
      { group: "chest", isPrimary: false },
      { group: "shoulders", isPrimary: false },
    ],
  },

  // === NOGI (QUADS) ===
  {
    name: "Przysiad ze sztangą na plecach",
    equipment: "barbell",
    instructions: "1. Ustaw sztangę na stojakach na wysokości barków.\n2. Wejdź pod sztangę, oprzyj ją na górnej części pleców.\n3. Zdejmij sztangę, zrób 2-3 kroki w tył.\n4. Zejdź do przysiadu, aż uda będą równoległe do podłogi.\n5. Wstań.\n6. Powtórz.",
    videoUrl: "https://www.youtube.com/watch?v=bEv6CCg2BC8",
    muscles: [
      { group: "quads", isPrimary: true },
      { group: "glutes", isPrimary: true },
      { group: "hamstrings", isPrimary: false },
      { group: "lower_back", isPrimary: false },
    ],
  },
  {
    name: "Przysiad przedni (front squat)",
    equipment: "barbell",
    instructions: "1. Ustaw sztangę na stojakach.\n2. Wejdź pod sztangę, oprzyj ją na przednich barkach.\n3. Ramiona skrzyżowane lub w clean grip.\n4. Łokcie wysoko.\n5. Zejdź do przysiadu, wstań.\n6. Powtórz.",
    videoUrl: "https://www.youtube.com/watch?v=m4ytaCJnpmM",
    muscles: [
      { group: "quads", isPrimary: true },
      { group: "glutes", isPrimary: false },
    ],
  },
  {
    name: "Wykroki z hantlami",
    equipment: "dumbbell",
    instructions: "1. Stań z hantlami w dłoniach wzdłuż ciała.\n2. Zrób duży krok do przodu.\n3. Zejdź w dół, aż tylne kolano prawie dotknie podłogi.\n4. Wróć do pozycji startowej.\n5. Powtórz na drugą nogę.",
    videoUrl: "https://www.youtube.com/watch?v=D7KaRcUTQeE",
    muscles: [
      { group: "quads", isPrimary: true },
      { group: "glutes", isPrimary: true },
      { group: "hamstrings", isPrimary: false },
    ],
  },
  {
    name: "Prostowanie nóg na maszynie (leg extension)",
    equipment: "machine",
    instructions: "1. Usiądź na maszynie, zaczep stopy pod wałkami.\n2. Wyprostuj nogi do pełnego wyprostu.\n3. Zatrzymaj na chwilę w górze.\n4. Powoli opuść.\n5. Powtórz.",
    muscles: [
      { group: "quads", isPrimary: true },
    ],
  },

  // === NOGI (HAMSTRINGS) ===
  {
    name: "Uginanie nóg na maszynie leżąc (leg curl)",
    equipment: "machine",
    instructions: "1. Połóż się na maszynie, zaczep stopy pod wałkami.\n2. Ugnij nogi przyciągając pięty do pośladków.\n3. Powoli opuść.\n4. Powtórz.",
    muscles: [
      { group: "hamstrings", isPrimary: true },
    ],
  },
  {
    name: "Rumuński martwy ciąg (RDL)",
    equipment: "barbell",
    instructions: "1. Stań ze sztangą w dłoniach, stopy na szerokość bioder.\n2. Z lekko ugiętymi kolanami, zegnij biodra wypychając je do tyłu.\n3. Opuszczaj sztangę wzdłuż nóg aż poczujesz rozciąganie dwugłowych.\n4. Wróć do pozycji startowej.\n5. Powtórz.",
    videoUrl: "https://www.youtube.com/watch?v=JCXUYuzwNrM",
    muscles: [
      { group: "hamstrings", isPrimary: true },
      { group: "glutes", isPrimary: true },
      { group: "lower_back", isPrimary: false },
    ],
  },

  // === ŁYDKI ===
  {
    name: "Wspięcia na palce stojąc (maszyna / suwnica)",
    equipment: "machine",
    instructions: "1. Stań na platformie, pięty w powietrzu.\n2. Wespnij się na palce maksymalnie wysoko.\n3. Powoli opuść pięty poniżej poziomu platformy.\n4. Powtórz.",
    muscles: [
      { group: "calves", isPrimary: true },
    ],
  },
  {
    name: "Wspięcia na palce z hantlami siedząc",
    equipment: "dumbbell",
    instructions: "1. Usiądź na ławce, hantle na kolanach.\n2. Wespnij się na palce.\n3. Powoli opuść.\n4. Powtórz.",
    muscles: [
      { group: "calves", isPrimary: true },
    ],
  },

  // === BRZUCH ===
  {
    name: "Plank (deska)",
    equipment: "bodyweight",
    instructions: "1. Przyjmij pozycję jak do pompki.\n2. Oprzyj się na przedramionach.\n3. Trzymaj ciało w jednej linii od głowy do pięt.\n4. Napinaj brzuch i pośladki.\n5. Wytrzymaj określony czas.",
    muscles: [
      { group: "abs", isPrimary: true },
    ],
  },
  {
    name: "Unoszenie nóg w zwisie na drążku",
    equipment: "bodyweight",
    instructions: "1. Zawiśnij na drążku.\n2. Unieś proste (lub ugięte) nogi do poziomu bioder lub wyżej.\n3. Powoli opuść.\n4. Powtórz.",
    muscles: [
      { group: "abs", isPrimary: true },
    ],
  },
  {
    name: "Brzuszki na maszynie (crunch machine)",
    equipment: "machine",
    instructions: "1. Usiądź na maszynie, chwyć uchwyty.\n2. Zegnij tułów w dół.\n3. Powoli wróć.\n4. Powtórz.",
    muscles: [
      { group: "abs", isPrimary: true },
    ],
  },

  // === KALISTENIKA / BODYWEIGHT ===
  {
    name: "Pompki klasyczne",
    equipment: "bodyweight",
    instructions: "1. Przyjmij pozycję plank na dłoniach.\n2. Opuść ciało uginając łokcie.\n3. Wypchnij się w górę.\n4. Powtórz.",
    muscles: [
      { group: "chest", isPrimary: true },
      { group: "triceps", isPrimary: false },
      { group: "shoulders", isPrimary: false },
    ],
  },
  {
    name: "Przysiad bez obciążenia (bodyweight squat)",
    equipment: "bodyweight",
    instructions: "1. Stań ze stopami na szerokość barków.\n2. Ugnij kolana i biodra, zejdź do przysiadu.\n3. Trzymaj plecy proste.\n4. Wstań.\n5. Powtórz.",
    muscles: [
      { group: "quads", isPrimary: true },
      { group: "glutes", isPrimary: true },
    ],
  },
  {
    name: "Wykroki bez obciążenia",
    equipment: "bodyweight",
    instructions: "1. Stań prosto.\n2. Zrób duży krok do przodu i zejdź w dół.\n3. Wróć do pozycji startowej.\n4. Powtórz na drugą nogę.",
    muscles: [
      { group: "quads", isPrimary: true },
      { group: "glutes", isPrimary: true },
    ],
  },

  // === SIŁOWE DODATKOWE ===
  {
    name: "Wyciskanie sztangi na ławce wąskim chwytem (close grip bench)",
    equipment: "barbell",
    instructions: "1. Połóż się na ławce płaskiej.\n2. Chwyć sztangę wąsko (ręce na szerokość barków).\n3. Opuść sztangę do dolnej części klatki.\n4. Wypchnij w górę.\n5. Powtórz.",
    muscles: [
      { group: "triceps", isPrimary: true },
      { group: "chest", isPrimary: false },
    ],
  },
  {
    name: "Wiosłowanie sztangą w opadzie (pendlay row)",
    equipment: "barbell",
    instructions: "1. Stań ze stopami na szerokość barków.\n2. Zegnij tułów do prawie poziomu.\n3. Chwyć sztangę nachwytem.\n4. Dynamicznie przyciągnij sztangę do dolnej części klatki.\n5. Opuść.\n6. Powtórz.",
    muscles: [
      { group: "back", isPrimary: true },
      { group: "biceps", isPrimary: false },
    ],
  },
  {
    name: "Hip thrust ze sztangą",
    equipment: "barbell",
    instructions: "1. Oprzyj górną część pleców o ławkę.\n2. Umieść sztangę na biodrach (użyj poduszki).\n3. Stopy płasko na podłodze.\n4. Wypchnij biodra w górę do pełnego wyprostu.\n5. Powoli opuść.\n6. Powtórz.",
    videoUrl: "https://www.youtube.com/watch?v=SEdqd1n0cvg",
    muscles: [
      { group: "glutes", isPrimary: true },
      { group: "hamstrings", isPrimary: false },
    ],
  },
  {
    name: "Przysiad bułgarski (bulgarian split squat)",
    equipment: "dumbbell",
    instructions: "1. Stań tyłem do ławki, oprzyj jedną stopę na niej.\n2. Wykonaj przysiad na jednej nodze.\n3. Wróć do góry.\n4. Powtórz na obie nogi.",
    videoUrl: "https://www.youtube.com/watch?v=2C-uNgKwPLE",
    muscles: [
      { group: "quads", isPrimary: true },
      { group: "glutes", isPrimary: true },
    ],
  },

  // === BARKI DODATKOWE ===
  {
    name: "Arnold press (wyciskanie Arnolda)",
    equipment: "dumbbell",
    instructions: "1. Usiądź na ławce z oparciem. Hantle przed sobą, dłonie skierowane do siebie.\n2. Wypychaj hantle w górę, rotując nadgarstki na zewnątrz.\n3. W górze dłonie skierowane do przodu.\n4. Powoli wróć rotując z powrotem.\n5. Powtórz.",
    muscles: [
      { group: "shoulders", isPrimary: true },
      { group: "triceps", isPrimary: false },
    ],
  },
  {
    name: "Podciąganie sztangi wzdłuż tułowia (upright row)",
    equipment: "barbell",
    instructions: "1. Stań ze sztangą trzymaną nachwytem, wąsko.\n2. Przyciągnij sztangę wzdłuż ciała do wysokości obojczyków.\n3. Łokcie prowadzą ruch.\n4. Powoli opuść.\n5. Powtórz.",
    muscles: [
      { group: "shoulders", isPrimary: true },
      { group: "traps", isPrimary: true },
    ],
  },

  // === DODATKOWE ===
  {
    name: "Szrugsy ze sztangą (shrugs)",
    equipment: "barbell",
    instructions: "1. Stań ze sztangą trzymaną nachwytem.\n2. Wzrusz ramionami maksymalnie w górę.\n3. Zatrzymaj na chwilę.\n4. Powoli opuść.\n5. Powtórz.",
    videoUrl: "https://www.youtube.com/watch?v=cJRVVx8j4B4",
    muscles: [
      { group: "traps", isPrimary: true },
    ],
  },
  {
    name: "Uginanie nadgarstków ze sztangą (wrist curl)",
    equipment: "barbell",
    instructions: "1. Usiądź na ławce, przedramiona na udach, nadgarstki poza kolanami.\n2. Chwyć sztangę podchwytem.\n3. Uginaj nadgarstki w górę.\n4. Powoli opuść.\n5. Powtórz.",
    muscles: [
      { group: "forearms", isPrimary: true },
    ],
  },
];

async function main() {
  console.log("🌱 Seeding exercises...");

  // Clean existing data
  await prisma.exerciseMuscle.deleteMany();
  await prisma.workoutSet.deleteMany();
  await prisma.routineExercise.deleteMany();
  await prisma.routine.deleteMany();
  await prisma.workout.deleteMany();
  await prisma.personalRecord.deleteMany();
  await prisma.exercise.deleteMany();

  for (const ex of EXERCISES) {
    const { muscles, ...exerciseData } = ex;
    const created = await prisma.exercise.create({
      data: {
        ...exerciseData,
        muscles: {
          create: muscles.map((m) => ({
            muscleGroup: m.group,
            isPrimary: m.isPrimary,
          })),
        },
      },
    });
    console.log(`  ✓ ${created.name}`);
  }

  // Seed achievements
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
    await prisma.achievement.upsert({
      where: { code: a.code },
      create: a,
      update: a,
    });
  }
  console.log(`  ✓ ${achievements.length} achievements seeded`);

  console.log("\n✅ Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

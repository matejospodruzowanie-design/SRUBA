import { Swords } from "lucide-react";

export default function ChallengesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pojedynki</h1>
        <p className="text-muted-foreground mt-1">Rywalizuj z innymi i wygrywaj pojedynki 1v1</p>
      </div>

      <div className="rounded-xl border border-dashed border-border p-12 text-center">
        <Swords className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground">Funkcja w budowie</h3>
        <p className="text-sm text-muted-foreground/60 mt-1">
          Pojedynki i system rankingowy będą dostępne w Fazie 7.
        </p>
      </div>
    </div>
  );
}

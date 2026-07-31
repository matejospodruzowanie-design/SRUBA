import { Bot } from "lucide-react";

export default function CoachPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Coach</h1>
        <p className="text-muted-foreground mt-1">Twój osobisty trener AI</p>
      </div>

      <div className="rounded-xl border border-dashed border-border p-12 text-center">
        <Bot className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground">Funkcja w budowie</h3>
        <p className="text-sm text-muted-foreground/60 mt-1">
          AI Coach będzie dostępny w Fazie 8.
        </p>
      </div>
    </div>
  );
}

import { Download, Smartphone, Monitor, Check } from "lucide-react";

export default function AppDownloadPage() {

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Pobierz aplikację</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Zainstaluj ŚRUBĘ jako natywną aplikację na swoim urządzeniu
        </p>
      </div>

      {/* Android APK */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
            <Smartphone className="h-5 w-5 text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold">Android APK</h3>
            <p className="text-xs text-muted-foreground">
              Prawdziwa aplikacja .apk — fullscreen, offline, bez przeglądarki
            </p>
          </div>
        </div>

        <div className="bg-zinc-900 rounded-lg p-4 space-y-2 text-sm">
          <p className="font-medium text-amber-400">Jak zainstalować:</p>
          <ol className="space-y-1.5 text-muted-foreground list-decimal list-inside">
            <li>
              <strong>Automatycznie (TWA):</strong> po deployu na Vercel, użyj{" "}
              <a
                href="https://pwabuilder.com"
                target="_blank"
                rel="noopener"
                className="text-amber-400 underline"
              >
                pwabuilder.com
              </a>{" "}
              — generuje .apk z adresu URL
            </li>
            <li>
              <strong>Ręcznie (Android Studio):</strong> otwórz folder{" "}
              <code className="bg-zinc-800 px-1 rounded text-xs">android/</code>{" "}
              w Android Studio → Build → Build APK
            </li>
            <li>
              <strong>Szybko (PWA):</strong> otwórz w Chrome → menu → „Dodaj do
              ekranu głównego" — działa jak aplikacja
            </li>
          </ol>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Check className="h-3.5 w-3.5 text-green-400" />
          Projekt Capacitor skonfigurowany — folder <code className="bg-zinc-800 px-1 rounded">android/</code> gotowy
        </div>
      </div>

      {/* PWA info */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Monitor className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h3 className="font-semibold">PWA — Web App</h3>
            <p className="text-xs text-muted-foreground">
              Działa wszędzie — PC, Android, iOS. Dodaj do ekranu głównego.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className="bg-zinc-900 rounded-lg p-3 space-y-1">
            <p className="font-medium">🖥️ Desktop</p>
            <p className="text-xs text-muted-foreground">
              Ikona instalacji w pasku adresu Chrome
            </p>
          </div>
          <div className="bg-zinc-900 rounded-lg p-3 space-y-1">
            <p className="font-medium">📱 Android</p>
            <p className="text-xs text-muted-foreground">
              Chrome → menu → „Dodaj do ekranu głównego"
            </p>
          </div>
          <div className="bg-zinc-900 rounded-lg p-3 space-y-1">
            <p className="font-medium">🍎 iPhone</p>
            <p className="text-xs text-muted-foreground">
              Safari → Share → „Dodaj do ekranu głównego"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

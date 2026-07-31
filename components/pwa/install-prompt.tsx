"use client";

import { useState, useEffect, useCallback } from "react";
import { Download, Check, Smartphone, X, Monitor } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export function InstallPrompt() {
  // ─── ALL hooks at the top — never early-return before hooks ───

  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [cacheProgress, setCacheProgress] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check standalone + mobile status
  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    setIsMobile(
      /Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent) ||
        ("ontouchstart" in window && window.innerWidth < 1024)
    );
  }, []);

  // Capture install prompt
  useEffect(() => {
    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Show prompt after delay
  useEffect(() => {
    if (isStandalone || dismissed) return;
    const timer = setTimeout(() => setShowPrompt(true), 5000);
    return () => clearTimeout(timer);
  }, [isStandalone, dismissed]);

  // Listen for SW install confirmation
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "SW_INSTALLED") {
        setCacheProgress(100);
        setTimeout(() => setCacheProgress(0), 2000);
      }
    };
    navigator.serviceWorker.addEventListener("message", handler);
    return () =>
      navigator.serviceWorker.removeEventListener("message", handler);
  }, []);

  // Progress animation
  const animateProgress = useCallback(() => {
    setInstalling(true);
    setCacheProgress(0);
    const steps = 15;
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setCacheProgress(Math.min(95, Math.round((i / steps) * 100)));
      if (i >= steps) clearInterval(timer);
    }, 120);
    return timer;
  }, []);

  const handleInstall = useCallback(async () => {
    let timer: ReturnType<typeof setInterval> | undefined;

    if (deferredPrompt) {
      timer = animateProgress();
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          if (navigator.serviceWorker?.controller) {
            navigator.serviceWorker.controller.postMessage({ type: "CACHE_ALL" });
          }
          clearInterval(timer);
          setCacheProgress(100);
          setInstalled(true);
          setTimeout(() => {
            setShowPrompt(false);
            setDismissed(true);
          }, 3000);
          return;
        }
      } catch { /* dismissed */ }
      clearInterval(timer);
      setInstalling(false);
      setCacheProgress(0);
      setDeferredPrompt(null);
    } else {
      // Desktop: just show confirmation
      setInstalled(true);
      setTimeout(() => {
        setShowPrompt(false);
        setDismissed(true);
      }, 4000);
    }
  }, [deferredPrompt, animateProgress]);

  const handleDismiss = useCallback(() => {
    setShowPrompt(false);
    setDismissed(true);
  }, []);

  // ─── Conditional render AFTER all hooks ───

  if (isStandalone || !showPrompt || dismissed) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={handleDismiss} />
      <div className="relative w-full sm:max-w-sm bg-card border border-border rounded-2xl overflow-hidden animate-slide-up">
        {installing && (
          <div className="h-1 bg-zinc-900">
            <div
              className="h-full bg-amber-500 transition-all duration-300 ease-out"
              style={{ width: `${cacheProgress}%` }}
            />
          </div>
        )}

        <div className="p-5 text-center space-y-4">
          {installed ? (
            <>
              <div className="h-14 w-14 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                <Check className="h-7 w-7 text-green-400" />
              </div>
              <h3 className="font-bold text-base">
                {isMobile ? "Zainstalowano!" : "Gotowe!"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isMobile
                  ? "Apka na ekranie głównym. Działa pełnoekranowo i offline."
                  : "Na telefonie dodaj apkę do ekranu głównego przez menu przeglądarki → „Dodaj do ekranu głównego”."}
              </p>
              <button
                onClick={handleDismiss}
                className="w-full rounded-lg bg-green-500 py-2.5 text-sm font-semibold text-black hover:bg-green-400 transition-colors"
              >
                Przejdź do aplikacji
              </button>
            </>
          ) : installing ? (
            <>
              <div className="h-14 w-14 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto animate-pulse-glow">
                <Download className="h-7 w-7 text-amber-400" />
              </div>
              <h3 className="font-bold text-base">Pobieranie plików...</h3>
              <p className="text-sm text-muted-foreground">
                {cacheProgress < 40
                  ? "Zapisywanie stron aplikacji..."
                  : cacheProgress < 70
                    ? "Pobieranie zasobów..."
                    : "Prawie gotowe!"}
              </p>
              <p className="text-xs text-muted-foreground/60">
                {cacheProgress}% — nie zamykaj
              </p>
            </>
          ) : (
            <>
              <div className="h-14 w-14 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto">
                {isMobile ? (
                  <Smartphone className="h-7 w-7 text-amber-400" />
                ) : (
                  <Monitor className="h-7 w-7 text-amber-400" />
                )}
              </div>
              <h3 className="font-bold text-base">
                {isMobile
                  ? "Dodaj do ekranu głównego"
                  : "Zainstaluj aplikację"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isMobile
                  ? "Kliknij poniżej aby zainstalować apkę. Wszystkie pliki zostaną pobrane — apka będzie działać pełnoekranowo i offline."
                  : "Na telefonie otwórz menu przeglądarki i wybierz „Dodaj do ekranu głównego” aby używać apki pełnoekranowo i offline."}
              </p>

              <div className="space-y-2">
                {deferredPrompt ? (
                  <button
                    onClick={handleInstall}
                    className="w-full rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-black hover:bg-amber-400 transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Pobierz i zainstaluj
                  </button>
                ) : (
                  <button
                    onClick={handleInstall}
                    className="w-full rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-black hover:bg-amber-400 transition-colors"
                  >
                    OK, rozumiem
                  </button>
                )}
                <button
                  onClick={handleDismiss}
                  className="w-full rounded-lg border border-border py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1"
                >
                  <X className="h-3.5 w-3.5" />
                  Zamknij
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

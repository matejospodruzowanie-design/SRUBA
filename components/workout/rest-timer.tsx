"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, SkipForward, Plus, Volume2, VolumeX } from "lucide-react";
import { formatTime } from "@/lib/fitness-utils";

interface RestTimerProps {
  defaultSeconds: number;
  onComplete?: () => void;
  onSkip?: () => void;
  nextExerciseName?: string | null;
}

export function RestTimer({ defaultSeconds, onComplete, onSkip, nextExerciseName }: RestTimerProps) {
  const [targetTime, setTargetTime] = useState<number>(Date.now() + defaultSeconds * 1000);
  const [remaining, setRemaining] = useState(defaultSeconds);
  const [isRunning, setIsRunning] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastTickRef = useRef<number>(0);

  // Reset target time when defaultSeconds changes
  useEffect(() => {
    setTargetTime(Date.now() + defaultSeconds * 1000);
    setRemaining(defaultSeconds);
  }, [defaultSeconds]);

  const playBeep = useCallback((freq: number, duration: number, vol: number) => {
    if (!soundEnabled) return;
    try {
      const ctx = audioCtxRef.current ?? new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      audioCtxRef.current = ctx;
      if (ctx.state === "suspended") ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      gain.gain.value = vol;
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Web Audio not available
    }
  }, [soundEnabled]);

  // Timestamp-based countdown — works correctly in background tabs
  useEffect(() => {
    if (!isRunning) return;

    const tick = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.round((targetTime - now) / 1000));
      setRemaining(diff);

      // Tick sound at < 10s
      if (diff <= 10 && diff > 0 && diff !== lastTickRef.current) {
        lastTickRef.current = diff;
        playBeep(660, 0.1, 0.08);
      }

      // Completion
      if (diff <= 0) {
        setIsRunning(false);
        playBeep(880, 0.5, 0.3);
        // Vibrate on mobile
        try { navigator.vibrate?.(200); } catch { /* ignore */ }
        onComplete?.();
      }
    };

    tick(); // immediate check
    intervalRef.current = setInterval(tick, 250); // check every 250ms for smooth ring

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, targetTime, playBeep, onComplete]);

  const toggleTimer = () => setIsRunning(!isRunning);
  const skip = () => {
    setIsRunning(false);
    onSkip?.();
  };
  const addTime = (s: number) => {
    setTargetTime((prev) => prev + s * 1000);
    setRemaining((prev) => prev + s);
    if (!isRunning) setIsRunning(true);
  };

  const totalSeconds = Math.max(remaining, defaultSeconds); // use larger of current or default for ring
  const progress = totalSeconds > 0 ? ((totalSeconds - remaining) / totalSeconds) * 100 : 0;

  // Color transition: green (resting) → amber (almost done) → red (go!)
  const timerColor =
    remaining <= 5 ? "text-red-400" : remaining <= 15 ? "text-amber-400" : "text-green-400";

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Odpoczynek
        </span>
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label={soundEnabled ? "Wycisz dźwięk" : "Włącz dźwięk"}
        >
          {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </button>
      </div>

      {/* Timer display with circular ring */}
      <div className="relative flex items-center justify-center">
        {/* SVG circular countdown ring */}
        <svg className="absolute w-36 h-36 -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke="#27272a"
            strokeWidth="4"
          />
          <circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke={remaining <= 5 ? "#f87171" : remaining <= 15 ? "#fbbf24" : "#4ade80"}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 54}`}
            strokeDashoffset={`${Math.max(0, 2 * Math.PI * 54 * (1 - Math.min(progress, 100) / 100))}`}
            className="transition-all duration-300 ease-linear"
          />
        </svg>
        <span className={`text-4xl font-mono font-bold tracking-tight relative z-10 ${timerColor}`}>
          {formatTime(Math.max(0, remaining))}
        </span>
      </div>

      {/* Next exercise hint */}
      {nextExerciseName && (
        <p className="text-xs text-muted-foreground text-center">
          Następne: <span className="text-foreground font-medium">{nextExerciseName}</span>
        </p>
      )}

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => addTime(30)}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-border/50 transition-colors"
        >
          <Plus className="h-3 w-3" /> 30s
        </button>

        <button
          onClick={toggleTimer}
          className="h-10 w-10 rounded-full bg-amber-500 text-black flex items-center justify-center hover:bg-amber-400 transition-colors"
          aria-label={isRunning ? "Pauza" : "Wznów odliczanie"}
        >
          {isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
        </button>

        <button
          onClick={skip}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-border/50 transition-colors"
        >
          <SkipForward className="h-3 w-3" /> Pomiń
        </button>
      </div>

      {/* Preset buttons — reset and start */}
      <div className="flex justify-center gap-2">
        {[60, 90, 120, 180].map((s) => (
          <button
            key={s}
            onClick={() => {
              setTargetTime(Date.now() + s * 1000);
              setRemaining(s);
              setIsRunning(true);
            }}
            className={`rounded-full px-3 py-1 text-xs transition-colors ${
              defaultSeconds === s
                ? "bg-amber-500/20 text-amber-400"
                : "text-muted-foreground hover:text-foreground hover:bg-border/50"
            }`}
          >
            {s >= 60 ? `${s / 60}m` : `${s}s`}
          </button>
        ))}
      </div>

      {/* "Next set" prompt */}
      {remaining <= 0 && (
        <div className="text-center animate-pulse">
          <p className="text-sm font-semibold text-amber-400">
            Czas na kolejną serię!
          </p>
        </div>
      )}
    </div>
  );
}

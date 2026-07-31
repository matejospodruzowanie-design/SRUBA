"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, SkipForward, Plus, Volume2, VolumeX } from "lucide-react";
import { formatTime } from "@/lib/fitness-utils";

interface RestTimerProps {
  defaultSeconds: number;
  onComplete?: () => void;
  onSkip?: () => void;
}

export function RestTimer({ defaultSeconds, onComplete, onSkip }: RestTimerProps) {
  const [seconds, setSeconds] = useState(defaultSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    setSeconds(defaultSeconds);
  }, [defaultSeconds]);

  const playBeep = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = audioCtxRef.current ?? new AudioContext();
      audioCtxRef.current = ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.value = 0.3;
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.stop(ctx.currentTime + 0.5);
    } catch {
      // Web Audio not available
    }
  }, [soundEnabled]);

  useEffect(() => {
    if (isRunning && seconds > 0) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]); // Only re-run when isRunning changes

  // Fire side effects when timer hits 0 (pure effect, outside state updater)
  useEffect(() => {
    if (seconds === 0 && isRunning) {
      setIsRunning(false);
      playBeep();
      onComplete?.();
    }
  }, [seconds, isRunning, playBeep, onComplete]);

  const toggleTimer = () => setIsRunning(!isRunning);
  const skip = () => {
    setIsRunning(false);
    setSeconds(defaultSeconds);
    onSkip?.();
  };
  const addTime = (s: number) => setSeconds((prev) => prev + s);

  const progress = defaultSeconds > 0
    ? ((defaultSeconds - seconds) / defaultSeconds) * 100
    : 0;

  // Color transition: green (resting) → amber (almost done) → red (go!)
  const timerColor =
    seconds <= 5 ? "text-red-400" : seconds <= 15 ? "text-amber-400" : "text-green-400";

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Odpoczynek
        </span>
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </button>
      </div>

      {/* Timer display */}
      <div className="text-center">
        <span className={`text-5xl font-mono font-bold tracking-tight ${timerColor}`}>
          {formatTime(seconds)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-border overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-linear"
          style={{
            width: `${progress}%`,
            backgroundColor:
              seconds <= 5 ? "#f87171" : seconds <= 15 ? "#fbbf24" : "#4ade80",
          }}
        />
      </div>

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

      {/* Preset buttons */}
      <div className="flex justify-center gap-2">
        {[60, 90, 120, 180].map((s) => (
          <button
            key={s}
            onClick={() => { setSeconds(s); setIsRunning(false); }}
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
      {seconds === 0 && (
        <div className="text-center animate-pulse">
          <p className="text-sm font-semibold text-amber-400">
            Czas na kolejną serię!
          </p>
        </div>
      )}
    </div>
  );
}

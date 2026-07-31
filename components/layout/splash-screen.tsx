"use client";

import { useState, useEffect } from "react";

/**
 * Full-screen splash animation on app startup.
 * Shows on cold start, auto-dismisses after animation.
 */
const SPLASH_KEY = "sruba-splash-shown";

export function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  // Generate random particle positions only on client to avoid hydration mismatch
  const [particles, setParticles] = useState<Array<{ left: string; top: string; delay: string; duration: string }>>([]);

  useEffect(() => {
    if (sessionStorage.getItem(SPLASH_KEY)) {
      setVisible(false);
      return;
    }
    sessionStorage.setItem(SPLASH_KEY, "1");

    // Generate particles client-side only
    setParticles(
      Array.from({ length: 6 }, (_, i) => ({
        left: `${20 + Math.random() * 60}%`,
        top: `${20 + Math.random() * 60}%`,
        delay: `${i * 0.3}s`,
        duration: `${2 + Math.random() * 2}s`,
      }))
    );

    const fadeTimer = setTimeout(() => setFadeOut(true), 2200);
    const removeTimer = setTimeout(() => setVisible(false), 2700);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#09090b] transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl animate-pulse-glow"
          style={{
            background:
              "radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)",
          }}
        />
        {/* Floating particles — rendered only after client-side positions are generated */}
        {particles.map((p, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-amber-400/30 animate-float"
            style={{
              left: p.left,
              top: p.top,
              animationDelay: p.delay,
              animationDuration: p.duration,
            }}
          />
        ))}
      </div>

      {/* Logo container */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Barbell icon — slides down */}
        <div
          className="animate-slide-down opacity-0"
          style={{ animationDelay: "0.1s", animationFillMode: "forwards" }}
        >
          <svg
            viewBox="0 0 120 40"
            className="h-8 w-24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Bar */}
            <rect x="0" y="17" width="120" height="6" rx="3" fill="#52525b" />
            {/* Left plates */}
            <rect x="8" y="8" width="18" height="24" rx="4" fill="#a1a1aa" />
            <rect x="4" y="11" width="10" height="18" rx="3" fill="#d4d4d8" />
            {/* Right plates */}
            <rect x="94" y="8" width="18" height="24" rx="4" fill="#a1a1aa" />
            <rect x="106" y="11" width="10" height="18" rx="3" fill="#d4d4d8" />
            {/* Grip marks */}
            <line x1="38" y1="14" x2="38" y2="26" stroke="#71717a" strokeWidth="1.5" />
            <line x1="82" y1="14" x2="82" y2="26" stroke="#71717a" strokeWidth="1.5" />
          </svg>
        </div>

        {/* ŚRUBA text — screws in */}
        <h1
          className="text-6xl font-black tracking-tighter opacity-0 animate-scale-in"
          style={{
            animationDelay: "0.4s",
            animationFillMode: "forwards",
            background: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 40%, #f59e0b 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: "drop-shadow(0 0 30px rgba(245,158,11,0.3))",
          }}
        >
          ŚRUBA
        </h1>

        {/* Tagline — fades in */}
        <p
          className="text-sm text-zinc-500 tracking-widest uppercase opacity-0 animate-fade-in"
          style={{
            animationDelay: "0.9s",
            animationFillMode: "forwards",
          }}
        >
          Twój trener na siłowni
        </p>

        {/* Loading dots */}
        <div
          className="flex gap-1.5 opacity-0 animate-fade-in mt-4"
          style={{
            animationDelay: "1.3s",
            animationFillMode: "forwards",
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-2 w-2 rounded-full bg-amber-500 animate-bounce"
              style={{
                animationDelay: `${i * 0.15}s`,
                animationDuration: "0.8s",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

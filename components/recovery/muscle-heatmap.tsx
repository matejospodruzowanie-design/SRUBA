"use client";

import { useState } from "react";
import { MUSCLE_GROUPS } from "@/lib/constants";
import { recoveryColor, recoveryLabel } from "@/lib/recovery-utils";

// Anatomical muscle positions — front and back views
// Map muscle group → { front: [x,y], back: [x,y], label }
const ANATOMY_MAP: Record<string, {
  label: string;
  front?: { cx: number; cy: number; rx: number; ry: number };
  back?: { cx: number; cy: number; rx: number; ry: number };
}> = {
  chest:    { label: "Klatka",    front: { cx: 100, cy: 82, rx: 42, ry: 28 } },
  shoulders:{ label: "Barki",     front: { cx: 60, cy: 74, rx: 18, ry: 14 } },
  biceps:   { label: "Biceps",    front: { cx: 44, cy: 112, rx: 14, ry: 24 } },
  triceps:  { label: "Triceps",   back:  { cx: 156, cy: 112, rx: 14, ry: 24 } },
  forearms: { label: "Przedramiona", front: { cx: 40, cy: 148, rx: 12, ry: 20 } },
  back:     { label: "Plecy",     back:  { cx: 100, cy: 84, rx: 44, ry: 36 } },
  traps:    { label: "Kaptury",   back:  { cx: 100, cy: 58, rx: 32, ry: 14 } },
  abs:      { label: "Brzuch",    front: { cx: 100, cy: 118, rx: 30, ry: 26 } },
  quads:    { label: "Czworogłowe", front: { cx: 74, cy: 192, rx: 20, ry: 36 } },
  hamstrings:{ label: "Dwugłowe", back:  { cx: 126, cy: 192, rx: 20, ry: 36 } },
  glutes:   { label: "Pośladki",  back:  { cx: 100, cy: 160, rx: 34, ry: 22 } },
  calves:   { label: "Łydki",     front: { cx: 72, cy: 240, rx: 14, ry: 22 } },
  lower_back:{ label: "Dolny odc. pleców", back: { cx: 100, cy: 128, rx: 28, ry: 16 } },
};

interface MuscleStatus {
  muscleGroup: string;
  readiness: number;
}

interface Props {
  muscles: MuscleStatus[];
}

// ─── SVG Body Silhouette — Front ───
function FrontBody() {
  return (
    <g>
      {/* Head */}
      <ellipse cx="100" cy="30" rx="16" ry="20" fill="#18181b" stroke="#3f3f46" strokeWidth="1.5" />
      {/* Neck */}
      <rect x="90" y="48" width="20" height="10" rx="4" fill="#18181b" stroke="#3f3f46" strokeWidth="1" />
      {/* Torso — trapezoid shape */}
      <path
        d="M68 56 L62 150 Q60 160 80 162 L120 162 Q140 160 138 150 L132 56 Z"
        fill="#18181b" stroke="#3f3f46" strokeWidth="1.5"
      />
      {/* Left arm */}
      <path d="M68 60 Q55 62 48 90 Q44 110 40 150" stroke="#3f3f46" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <ellipse cx="66" cy="68" rx="16" ry="10" fill="#18181b" stroke="#3f3f46" strokeWidth="1.5" />
      <ellipse cx="40" cy="155" rx="12" ry="8" fill="#18181b" stroke="#3f3f46" strokeWidth="1" />
      {/* Left forearm */}
      <path d="M44 125 Q42 138 40 150" stroke="#3f3f46" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Right arm */}
      <path d="M132 60 Q145 62 152 90 Q156 110 160 150" stroke="#3f3f46" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <ellipse cx="134" cy="68" rx="16" ry="10" fill="#18181b" stroke="#3f3f46" strokeWidth="1.5" />
      <ellipse cx="160" cy="155" rx="12" ry="8" fill="#18181b" stroke="#3f3f46" strokeWidth="1" />
      {/* Left leg */}
      <path d="M78 160 Q70 180 66 220 Q64 240 62 260" stroke="#3f3f46" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <ellipse cx="72" cy="168" rx="18" ry="14" fill="#18181b" stroke="#3f3f46" strokeWidth="1.5" />
      <ellipse cx="62" cy="265" rx="14" ry="6" fill="#18181b" stroke="#3f3f46" strokeWidth="1" />
      {/* Right leg */}
      <path d="M122 160 Q130 180 134 220 Q136 240 138 260" stroke="#3f3f46" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <ellipse cx="128" cy="168" rx="18" ry="14" fill="#18181b" stroke="#3f3f46" strokeWidth="1.5" />
      <ellipse cx="138" cy="265" rx="14" ry="6" fill="#18181b" stroke="#3f3f46" strokeWidth="1" />
    </g>
  );
}

// ─── SVG Body Silhouette — Back ───
function BackBody() {
  return (
    <g>
      {/* Head */}
      <ellipse cx="100" cy="30" rx="16" ry="20" fill="#18181b" stroke="#3f3f46" strokeWidth="1.5" />
      {/* Neck */}
      <rect x="90" y="48" width="20" height="10" rx="4" fill="#18181b" stroke="#3f3f46" strokeWidth="1" />
      {/* Torso */}
      <path
        d="M68 56 L62 150 Q60 160 80 162 L120 162 Q140 160 138 150 L132 56 Z"
        fill="#18181b" stroke="#3f3f46" strokeWidth="1.5"
      />
      {/* Arms */}
      <path d="M68 60 Q55 62 48 90 Q44 110 40 150" stroke="#3f3f46" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <ellipse cx="66" cy="68" rx="16" ry="10" fill="#18181b" stroke="#3f3f46" strokeWidth="1.5" />
      <ellipse cx="40" cy="155" rx="12" ry="8" fill="#18181b" stroke="#3f3f46" strokeWidth="1" />
      <path d="M132 60 Q145 62 152 90 Q156 110 160 150" stroke="#3f3f46" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <ellipse cx="134" cy="68" rx="16" ry="10" fill="#18181b" stroke="#3f3f46" strokeWidth="1.5" />
      <ellipse cx="160" cy="155" rx="12" ry="8" fill="#18181b" stroke="#3f3f46" strokeWidth="1" />
      {/* Legs */}
      <path d="M78 160 Q70 180 66 220 Q64 240 62 260" stroke="#3f3f46" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <ellipse cx="72" cy="168" rx="18" ry="14" fill="#18181b" stroke="#3f3f46" strokeWidth="1.5" />
      <ellipse cx="62" cy="265" rx="14" ry="6" fill="#18181b" stroke="#3f3f46" strokeWidth="1" />
      <path d="M122 160 Q130 180 134 220 Q136 240 138 260" stroke="#3f3f46" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <ellipse cx="128" cy="168" rx="18" ry="14" fill="#18181b" stroke="#3f3f46" strokeWidth="1.5" />
      <ellipse cx="138" cy="265" rx="14" ry="6" fill="#18181b" stroke="#3f3f46" strokeWidth="1" />
    </g>
  );
}

// ─── Muscle overlay region ───
function MuscleRegion({
  cx, cy, rx, ry,
  readiness,
  label,
}: {
  cx: number; cy: number; rx: number; ry: number;
  readiness: number;
  label: string;
}) {
  const color = recoveryColor(readiness);
  const isFatigued = readiness < 80;

  return (
    <g>
      {/* Outer glow — animated when fatigued */}
      {isFatigued && (
        <ellipse
          cx={cx} cy={cy} rx={rx + 5} ry={ry + 5}
          fill={color} opacity={0.12}
        >
          <animate attributeName="opacity" values="0.12;0.22;0.12" dur="2s" repeatCount="indefinite" />
          <animate attributeName="rx" values={`${rx + 5};${rx + 8};${rx + 5}`} dur="2s" repeatCount="indefinite" />
          <animate attributeName="ry" values={`${ry + 5};${ry + 8};${ry + 5}`} dur="2s" repeatCount="indefinite" />
        </ellipse>
      )}
      {/* Muscle shape — translucent colored area */}
      <ellipse
        cx={cx} cy={cy} rx={rx} ry={ry}
        fill={color} opacity={0.35}
        stroke={color} strokeWidth={0.8} strokeOpacity={0.5}
      />
      {/* Inner highlight */}
      <ellipse
        cx={cx} cy={cy} rx={rx * 0.6} ry={ry * 0.5}
        fill={color} opacity={0.25}
      />
      {/* Center dot */}
      <circle cx={cx} cy={cy} r={3} fill={color} opacity={0.9} />
      <title>{label}: {readiness}% gotowości</title>
    </g>
  );
}

// ─── Main component ───

export function MuscleHeatmap({ muscles }: Props) {
  const [view, setView] = useState<"front" | "back">("front");
  const statusMap = new Map(muscles.map((m) => [m.muscleGroup, m.readiness]));

  const activeGroups = MUSCLE_GROUPS.filter((mg) => {
    const pos = ANATOMY_MAP[mg.id];
    if (!pos) return false;
    if (view === "front" && pos.front) return true;
    if (view === "back" && pos.back) return true;
    return false;
  });

  return (
    <div className="space-y-4">
      {/* View toggle */}
      <div className="flex justify-center gap-1">
        <button
          onClick={() => setView("front")}
          className={`rounded-full px-4 py-1 text-xs font-medium transition-colors ${
            view === "front"
              ? "bg-amber-500 text-black"
              : "text-muted-foreground hover:text-foreground bg-border/30"
          }`}
        >
          Przód
        </button>
        <button
          onClick={() => setView("back")}
          className={`rounded-full px-4 py-1 text-xs font-medium transition-colors ${
            view === "back"
              ? "bg-amber-500 text-black"
              : "text-muted-foreground hover:text-foreground bg-border/30"
          }`}
        >
          Tył
        </button>
      </div>

      {/* Body diagram */}
      <div className="flex justify-center">
        <div className="relative w-[200px] h-[290px]">
          <svg
            viewBox="0 0 200 300"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Body silhouette */}
            {view === "front" ? <FrontBody /> : <BackBody />}

            {/* Muscle regions for current view */}
            {activeGroups.map((mg) => {
              const pos = ANATOMY_MAP[mg.id];
              const coords = view === "front" ? pos?.front : pos?.back;
              if (!coords) return null;
              const readiness = statusMap.get(mg.id) ?? 100;
              return (
                <MuscleRegion
                  key={mg.id}
                  cx={coords.cx}
                  cy={coords.cy}
                  rx={coords.rx}
                  ry={coords.ry}
                  readiness={readiness}
                  label={pos?.label ?? mg.label}
                />
              );
            })}
          </svg>
        </div>
      </div>

      {/* Readiness bars */}
      <div className="space-y-1.5">
        {MUSCLE_GROUPS.map((mg) => {
          const readiness = statusMap.get(mg.id) ?? 100;
          const color = recoveryColor(readiness);
          return (
            <div key={mg.id} className="flex items-center gap-2 text-xs">
              <span className="w-24 text-muted-foreground truncate">
                {mg.label}
              </span>
              <div className="flex-1 h-2.5 rounded-full bg-zinc-900 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${readiness}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
              <span
                className="w-16 text-right tabular-nums font-medium"
                style={{ color }}
              >
                {readiness}%
              </span>
              <span className="w-20 text-right text-muted-foreground hidden sm:inline">
                {recoveryLabel(readiness)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

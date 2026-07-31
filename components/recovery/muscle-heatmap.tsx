"use client";

import { MUSCLE_GROUPS } from "@/lib/constants";
import { recoveryColor, recoveryLabel } from "@/lib/recovery-utils";

// Map muscle groups to body positions for the heatmap diagram
// Positions are relative to a 200×320 body outline
const MUSCLE_POSITIONS: Record<string, { x: number; y: number; size: number }> = {
  chest: { x: 100, y: 62, size: 22 },
  shoulders: { x: 55, y: 58, size: 14 },
  biceps: { x: 45, y: 82, size: 10 },
  triceps: { x: 42, y: 90, size: 10 },
  forearms: { x: 40, y: 110, size: 8 },
  back: { x: 100, y: 72, size: 20 },
  traps: { x: 85, y: 52, size: 12 },
  abdominals: { x: 100, y: 100, size: 16 },
  abs: { x: 100, y: 100, size: 16 },
  quadriceps: { x: 70, y: 150, size: 18 },
  quads: { x: 70, y: 150, size: 18 },
  hamstrings: { x: 75, y: 170, size: 16 },
  glutes: { x: 95, y: 138, size: 16 },
  calves: { x: 70, y: 210, size: 12 },
  lower_back: { x: 100, y: 82, size: 14 },
};

interface MuscleStatus {
  muscleGroup: string;
  readiness: number;
}

interface Props {
  muscles: MuscleStatus[];
}

export function MuscleHeatmap({ muscles }: Props) {
  const statusMap = new Map(muscles.map((m) => [m.muscleGroup, m.readiness]));

  // Get all muscle groups, filling missing ones with 100% readiness
  const allGroups = MUSCLE_GROUPS.map((mg) => ({
    ...mg,
    readiness: statusMap.get(mg.id) ?? 100,
  }));

  return (
    <div className="space-y-4">
      {/* Body heatmap diagram */}
      <div className="flex justify-center">
        <div className="relative w-[200px] h-[280px]">
          {/* Body silhouette SVG */}
          <svg
            viewBox="0 0 200 320"
            className="w-full h-full"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Body outline */}
            <ellipse cx="100" cy="38" rx="18" ry="20" stroke="#3f3f46" strokeWidth="1.5" />
            <line x1="100" y1="56" x2="100" y2="130" stroke="#3f3f46" strokeWidth="1.5" />
            {/* Arms */}
            <line x1="75" y1="70" x2="35" y2="120" stroke="#3f3f46" strokeWidth="1.5" />
            <line x1="125" y1="70" x2="165" y2="120" stroke="#3f3f46" strokeWidth="1.5" />
            {/* Torso */}
            <rect x="65" y="60" width="70" height="90" rx="12" stroke="#3f3f46" strokeWidth="1.5" />
            {/* Legs */}
            <line x1="80" y1="148" x2="65" y2="240" stroke="#3f3f46" strokeWidth="1.5" />
            <line x1="120" y1="148" x2="135" y2="240" stroke="#3f3f46" strokeWidth="1.5" />
            {/* Feet */}
            <ellipse cx="63" cy="245" rx="10" ry="4" stroke="#3f3f46" strokeWidth="1" />
            <ellipse cx="137" cy="245" rx="10" ry="4" stroke="#3f3f46" strokeWidth="1" />

            {/* Muscle heat dots */}
            {allGroups.map((mg) => {
              const pos = MUSCLE_POSITIONS[mg.id];
              if (!pos) return null;
              const color = recoveryColor(mg.readiness);
              // Right side mirror for paired muscles
              const isRightSide =
                ["shoulders", "biceps", "triceps", "forearms"].includes(mg.id);
              const xPos = isRightSide ? 200 - pos.x : pos.x;

              const isFatigued = mg.readiness < 80;
              return (
                <g key={mg.id}>
                  {/* Outer glow ring — pulses when tired */}
                  {isFatigued && (
                    <circle
                      cx={xPos}
                      cy={pos.y}
                      r={pos.size + 6}
                      fill={color}
                      opacity={0.08}
                    >
                      <animate
                        attributeName="opacity"
                        values="0.08;0.18;0.08"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="r"
                        values={`${pos.size + 6};${pos.size + 9};${pos.size + 6}`}
                        dur="2s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}
                  {/* Glow */}
                  <circle
                    cx={xPos}
                    cy={pos.y}
                    r={pos.size + 4}
                    fill={color}
                    opacity={0.15}
                  />
                  {/* Main dot */}
                  <circle
                    cx={xPos}
                    cy={pos.y}
                    r={pos.size}
                    fill={color}
                    opacity={0.7}
                    stroke={color}
                    strokeWidth={1}
                    className="heatmap-dot"
                  />
                  {/* Inner highlight */}
                  <circle
                    cx={xPos}
                    cy={pos.y}
                    r={pos.size * 0.4}
                    fill={color}
                    opacity={0.9}
                  />
                  {/* Readiness label on hover — tooltip */}
                  <title>
                    {mg.label}: {mg.readiness}% gotowości
                  </title>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Readiness bars */}
      <div className="space-y-1.5">
        {allGroups.map((mg) => {
          const color = recoveryColor(mg.readiness);
          return (
            <div key={mg.id} className="flex items-center gap-2 text-xs">
              <span className="w-24 text-muted-foreground truncate">
                {mg.label}
              </span>
              <div className="flex-1 h-2.5 rounded-full bg-zinc-900 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${mg.readiness}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
              <span
                className="w-16 text-right tabular-nums font-medium"
                style={{ color }}
              >
                {mg.readiness}%
              </span>
              <span className="w-20 text-right text-muted-foreground hidden sm:inline">
                {recoveryLabel(mg.readiness)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

interface ChartPoint {
  workoutName: string;
  date: Date;
  maxWeight: number;
  maxReps: number;
  est1RM: number;
  totalVolume: number;
}

type ChartMode = "weight" | "volume" | "reps" | "est1rm";

const MODES: { key: ChartMode; label: string; unit: string }[] = [
  { key: "weight", label: "Max ciężar", unit: "kg" },
  { key: "volume", label: "Objętość", unit: "kg" },
  { key: "reps", label: "Powtórzenia", unit: "powt." },
  { key: "est1rm", label: "Est. 1RM", unit: "kg" },
];

export function ExerciseChart({ data }: { data: ChartPoint[] }) {
  const [mode, setMode] = useState<ChartMode>("weight");
  const current = MODES.find((m) => m.key === mode)!;

  // Time-scale axis (real timestamps) for interactive scrubbing
  const chartData = data.map((d) => ({
    ...d,
    t: new Date(d.date).getTime(),
    value:
      mode === "weight"
        ? d.maxWeight
        : mode === "volume"
        ? Math.round(d.totalVolume)
        : mode === "reps"
        ? d.maxReps
        : d.est1RM,
  }));

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-3">
      {/* Mode toggle */}
      <div className="flex gap-1.5 flex-wrap">
        {MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => setMode(m.key)}
            className={`rounded-full px-3 py-1 text-xs transition-colors ${
              mode === m.key
                ? "bg-amber-500/20 text-amber-400 font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Chart — time-scale x axis */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis
              dataKey="t"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(t) => format(new Date(t), "dd.MM")}
              tick={{ fontSize: 11, fill: "#71717a" }}
              axisLine={{ stroke: "#27272a" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#71717a" }}
              axisLine={false}
              tickLine={false}
              width={45}
            />
            <Tooltip
              contentStyle={{
                background: "#18181b",
                border: "1px solid #3f3f46",
                borderRadius: "12px",
                fontSize: "13px",
                color: "#fafafa",
              }}
              labelFormatter={(t) => format(new Date(Number(t)), "dd.MM.yyyy")}
              formatter={(value) => [`${value} ${current.unit}`, current.label]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ fill: "#f59e0b", r: 4, strokeWidth: 0 }}
              activeDot={{ fill: "#f59e0b", r: 6, strokeWidth: 2, stroke: "#fbbf24" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

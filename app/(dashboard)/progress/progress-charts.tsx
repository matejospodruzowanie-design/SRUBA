"use client";

import { useState, useTransition } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
} from "recharts";
import {
  TrendingUp,
  Dumbbell,
  Clock,
  Weight,
  Flame,
  Activity,
  Ruler,
  Trash2,
} from "lucide-react";
import { MUSCLE_GROUPS } from "@/lib/constants";
import { format } from "date-fns";
import { deleteBodyMeasurement } from "./actions";
import { pl } from "date-fns/locale";
import Link from "next/link";

// ─── Types ───

interface WeeklyVolumeItem {
  week: string;
  volume: number;
}

interface WorkoutFreqItem {
  week: string;
  count: number;
}

interface PRItem {
  id: string;
  exercise: { id: string; name: string };
  type: string;
  value: number;
  achievedAt: Date;
}

interface MuscleDistItem {
  group: string;
  count: number;
}

interface BodyMeasurement {
  id: string;
  date: Date;
  weightKg: number | null;
  bodyFatPct: number | null;
  chestCm: number | null;
  waistCm: number | null;
  hipsCm: number | null;
  armsCm: number | null;
  thighsCm: number | null;
}

interface Props {
  weeklyVolume: WeeklyVolumeItem[];
  workoutFreq: WorkoutFreqItem[];
  prs: PRItem[];
  muscleDist: MuscleDistItem[];
  totalStats: { totalWorkouts: number; totalSets: number; totalVolumeKg: number };
  bodyMeasurements: BodyMeasurement[];
  userWeight: number | null;
  userHeight: number | null;
  addMeasurementButton?: React.ReactNode;
}

// ─── Format helpers ───

const PR_LABELS: Record<string, string> = {
  weight: "Ciężar (kg)",
  est1rm: "Szacowany 1RM (kg)",
  volume: "Objętość serii (kg)",
  reps: "Powtórzenia",
};

function formatVolume(kg: number) {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`;
  return `${kg} kg`;
}

function formatWeekLabel(key: unknown) {
  if (typeof key !== "string") return String(key);
  const parts = key.split("-W");
  if (parts.length === 2) {
    return `W${parts[1]}`;
  }
  return key;
}

// ─── Empty state helper ───

function EmptyChart({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-48 text-muted-foreground/40">
      <Icon className="h-10 w-10 mb-2" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

// ─── Main component ───

export function ProgressCharts({
  weeklyVolume,
  workoutFreq,
  prs,
  muscleDist,
  totalStats,
  bodyMeasurements,
  userWeight,
  userHeight,
  addMeasurementButton,
}: Props) {
  const hasData = totalStats.totalWorkouts > 0;
  const [isPending, startTransition] = useTransition();
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  const handleDeleteMeasurement = (id: string) => {
    if (!confirm("Na pewno usunąć ten pomiar?")) return;
    setDeletedIds((prev) => new Set(prev).add(id));
    startTransition(() => {
      deleteBodyMeasurement(id);
    });
  };

  const visibleMeasurements = bodyMeasurements.filter((m) => !deletedIds.has(m.id));

  return (
    <div className="space-y-5 sm:space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Progress</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Wykresy, rekordy i statystyki
          </p>
        </div>
        {addMeasurementButton}
      </div>

      {/* Body stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
        {userHeight && (
          <div className="rounded-xl border border-border bg-card p-3 sm:p-4 space-y-0.5">
            <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Ruler className="h-3 w-3" /> Wzrost
            </span>
            <p className="text-sm sm:text-base font-bold">{userHeight} cm</p>
          </div>
        )}
        {userWeight && (
          <div className="rounded-xl border border-border bg-card p-3 sm:p-4 space-y-0.5">
            <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Weight className="h-3 w-3" /> Waga
            </span>
            <p className="text-sm sm:text-base font-bold">{userWeight} kg</p>
          </div>
        )}
        {userHeight && userWeight && (
          <div className="rounded-xl border border-border bg-card p-3 sm:p-4 space-y-0.5">
            <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Activity className="h-3 w-3" /> BMI
            </span>
            <p className="text-sm sm:text-base font-bold">
              {(userWeight / ((userHeight / 100) * (userHeight / 100))).toFixed(1)}
            </p>
          </div>
        )}
      </div>

      {/* Totals cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="rounded-xl border border-border bg-card p-3 sm:p-4 space-y-1">
          <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Dumbbell className="h-3 w-3" /> Treningi
          </span>
          <p className="text-lg sm:text-2xl font-bold text-amber-400">
            {totalStats.totalWorkouts}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 sm:p-4 space-y-1">
          <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Clock className="h-3 w-3" /> Serie
          </span>
          <p className="text-lg sm:text-2xl font-bold">{totalStats.totalSets}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 sm:p-4 space-y-1">
          <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Weight className="h-3 w-3" /> Objętość
          </span>
          <p className="text-lg sm:text-2xl font-bold text-amber-400">
            {formatVolume(totalStats.totalVolumeKg)}
          </p>
        </div>
      </div>

      {!hasData ? (
        /* Empty state */
        <div className="rounded-2xl border border-dashed border-zinc-800 p-10 sm:p-16 text-center">
          <div className="h-14 w-14 rounded-full bg-zinc-900 flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="h-6 w-6 text-zinc-600" />
          </div>
          <h3 className="text-base font-medium text-zinc-500">
            Brak danych treningowych
          </h3>
          <p className="text-sm text-zinc-600 mt-1 max-w-sm mx-auto">
            Wykonaj kilka treningów, aby zobaczyć statystyki i wykresy
          </p>
        </div>
      ) : (
        <>
          {/* Weekly volume chart */}
          <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
            <h3 className="text-sm font-semibold mb-4">
              📊 Objętość tygodniowa (kg)
            </h3>
            <div className="h-60 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyVolume}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis
                    dataKey="week"
                    tickFormatter={formatWeekLabel}
                    tick={{ fontSize: 11, fill: "#71717a" }}
                    axisLine={{ stroke: "#27272a" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#71717a" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) =>
                      v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#18181b",
                      border: "1px solid #27272a",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    labelFormatter={formatWeekLabel}
                    formatter={(value) => [`${value} kg`, "Objętość"]}
                  />
                  <Bar
                    dataKey="volume"
                    fill="#f59e0b"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Workout frequency chart */}
          <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
            <h3 className="text-sm font-semibold mb-4">
              📅 Treningów w tygodniu
            </h3>
            <div className="h-48 sm:h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={workoutFreq}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis
                    dataKey="week"
                    tickFormatter={formatWeekLabel}
                    tick={{ fontSize: 11, fill: "#71717a" }}
                    axisLine={{ stroke: "#27272a" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#71717a" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                    domain={[0, "auto"]}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#18181b",
                      border: "1px solid #27272a",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    labelFormatter={formatWeekLabel}
                    formatter={(value) => [`${value}`, "Treningów"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#f59e0b"
                    fill="#f59e0b20"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Muscle group distribution */}
          {muscleDist.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
              <h3 className="text-sm font-semibold mb-4">
                🎯 Rozkład partii mięśniowych
              </h3>
              <div className="space-y-2">
                {muscleDist.slice(0, 8).map((item) => {
                  const max = muscleDist[0]?.count ?? 1;
                  const pct = Math.round((item.count / max) * 100);
                  const groupInfo = MUSCLE_GROUPS.find(
                    (g) => g.id === item.group
                  );
                  return (
                    <div key={item.group} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-20 sm:w-28 truncate">
                        {groupInfo?.label ?? item.group}
                      </span>
                      <div className="flex-1 h-5 rounded-full bg-zinc-900 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: groupInfo?.color ?? "#f59e0b",
                          }}
                        />
                      </div>
                      <span className="text-xs tabular-nums w-10 text-right text-muted-foreground">
                        {item.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* PR history */}
          {prs.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
              <h3 className="text-sm font-semibold mb-4">
                🔥 Historia rekordów
              </h3>
              <div className="space-y-1 max-h-80 overflow-y-auto">
                {prs.slice(0, 15).map((pr) => (
                  <Link
                    key={pr.id}
                    href={`/progress/${pr.exercise.id}`}
                    className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-amber-500/10 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Flame className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
                      <span className="text-sm truncate hover:text-amber-400 transition-colors">
                        {pr.exercise.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                      <span className="text-xs text-muted-foreground hidden sm:inline">
                        {PR_LABELS[pr.type] ?? pr.type}
                      </span>
                      <span className="text-sm font-semibold tabular-nums text-amber-400">
                        {pr.type === "reps" ? `${pr.value}` : `${pr.value} kg`}
                      </span>
                      <span className="text-xs text-muted-foreground w-12 sm:w-16 text-right">
                        {format(new Date(pr.achievedAt), "dd.MM", {
                          locale: pl,
                        })}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Weight chart */}
          {bodyMeasurements.filter((m) => m.weightKg != null).length >= 2 && (
            <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
              <h3 className="text-sm font-semibold mb-4">
                ⚖️ Waga ciała
              </h3>
              <div className="h-48 sm:h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={bodyMeasurements
                      .filter((m) => m.weightKg != null)
                      .reverse()
                      .map((m) => ({
                        date: format(new Date(m.date), "dd.MM", { locale: pl }),
                        weight: m.weightKg!,
                      }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "#71717a" }}
                      axisLine={{ stroke: "#27272a" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#71717a" }}
                      axisLine={false}
                      tickLine={false}
                      domain={["dataMin - 2", "dataMax + 2"]}
                      width={45}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#18181b",
                        border: "1px solid #27272a",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={(value) => [`${value} kg`, "Waga"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={{ fill: "#f59e0b", r: 3 }}
                      activeDot={{ fill: "#f59e0b", r: 5, strokeWidth: 2, stroke: "#fbbf24" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Body fat % chart */}
          {bodyMeasurements.filter((m) => m.bodyFatPct != null).length >= 2 && (
            <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
              <h3 className="text-sm font-semibold mb-4">
                📉 Body fat %
              </h3>
              <div className="h-48 sm:h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={bodyMeasurements
                      .filter((m) => m.bodyFatPct != null)
                      .reverse()
                      .map((m) => ({
                        date: format(new Date(m.date), "dd.MM", { locale: pl }),
                        bf: m.bodyFatPct!,
                      }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "#71717a" }}
                      axisLine={{ stroke: "#27272a" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#71717a" }}
                      axisLine={false}
                      tickLine={false}
                      domain={["dataMin - 2", "dataMax + 2"]}
                      width={45}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#18181b",
                        border: "1px solid #27272a",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={(value) => [`${value}%`, "BF%"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="bf"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={{ fill: "#22c55e", r: 3 }}
                      activeDot={{ fill: "#22c55e", r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Circumference trends */}
          {bodyMeasurements.filter((m) => m.chestCm != null || m.waistCm != null || m.armsCm != null).length >= 2 && (
            <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
              <h3 className="text-sm font-semibold mb-4">
                📏 Obwody (cm)
              </h3>
              <div className="h-48 sm:h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={bodyMeasurements
                      .filter((m) => m.chestCm != null || m.waistCm != null || m.armsCm != null)
                      .reverse()
                      .map((m) => ({
                        date: format(new Date(m.date), "dd.MM", { locale: pl }),
                        chest: m.chestCm ?? null,
                        waist: m.waistCm ?? null,
                        arms: m.armsCm ?? null,
                      }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "#71717a" }}
                      axisLine={{ stroke: "#27272a" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#71717a" }}
                      axisLine={false}
                      tickLine={false}
                      domain={["dataMin - 3", "dataMax + 3"]}
                      width={45}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#18181b",
                        border: "1px solid #27272a",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Line type="monotone" dataKey="chest" stroke="#ef4444" strokeWidth={2} dot={{ fill: "#ef4444", r: 2 }} connectNulls />
                    <Line type="monotone" dataKey="waist" stroke="#f59e0b" strokeWidth={2} dot={{ fill: "#f59e0b", r: 2 }} connectNulls />
                    <Line type="monotone" dataKey="arms" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6", r: 2 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-2 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Klatka</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Talia</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Biceps</span>
              </div>
            </div>
          )}

          {/* Body measurements */}
          {bodyMeasurements.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
              <h3 className="text-sm font-semibold mb-4">
                📏 Historia pomiarów
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-muted-foreground border-b border-border">
                      <th className="text-left py-2 pr-3">Data</th>
                      <th className="text-right py-2 px-2">Waga</th>
                      <th className="text-right py-2 px-2 hidden sm:table-cell">
                        BF%
                      </th>
                      <th className="text-right py-2 px-2 hidden sm:table-cell">
                        Klatka
                      </th>
                      <th className="text-right py-2 px-2 hidden sm:table-cell">
                        Talia
                      </th>
                      <th className="text-right py-2 pl-2">Biceps</th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {visibleMeasurements.slice(0, 10).map((m) => (
                      <tr
                        key={m.id}
                        className="border-b border-border/30 hover:bg-zinc-900/30 transition-colors"
                      >
                        <td className="py-2 pr-3">
                          {format(new Date(m.date), "dd.MM.yy")}
                        </td>
                        <td className="text-right py-2 px-2 tabular-nums font-medium">
                          {m.weightKg ? `${m.weightKg} kg` : "—"}
                        </td>
                        <td className="text-right py-2 px-2 tabular-nums hidden sm:table-cell">
                          {m.bodyFatPct ? `${m.bodyFatPct}%` : "—"}
                        </td>
                        <td className="text-right py-2 px-2 tabular-nums hidden sm:table-cell">
                          {m.chestCm ? `${m.chestCm} cm` : "—"}
                        </td>
                        <td className="text-right py-2 px-2 tabular-nums hidden sm:table-cell">
                          {m.waistCm ? `${m.waistCm} cm` : "—"}
                        </td>
                        <td className="text-right py-2 pl-2 tabular-nums">
                          {m.armsCm ? `${m.armsCm} cm` : "—"}
                        </td>
                        <td className="py-2 pl-1">
                          <button
                            onClick={() => handleDeleteMeasurement(m.id)}
                            disabled={isPending}
                            className="text-muted-foreground/30 hover:text-red-400 transition-colors disabled:opacity-30"
                            title="Usuń pomiar"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

"use client";

import {
  startOfWeek,
  addDays,
  format,
  isToday,
} from "date-fns";

const DAY_NAMES = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];

export function WeekStrip() {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="rounded-xl border border-border bg-card px-3 py-3 sm:px-4">
      <div className="flex items-center justify-between">
        {days.map((day, i) => {
          const dayIsToday = isToday(day);
          return (
            <div
              key={i}
              className="flex flex-col items-center gap-1 min-w-[36px]"
            >
              <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">
                {DAY_NAMES[i]}
              </span>
              <span
                className={`flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-full text-sm font-medium transition-colors ${
                  dayIsToday
                    ? "bg-amber-500 text-black font-bold"
                    : "text-muted-foreground"
                }`}
              >
                {format(day, "d")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

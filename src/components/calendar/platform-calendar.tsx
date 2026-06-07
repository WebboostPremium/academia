"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: "class" | "assignment" | "event";
  link?: string;
  color?: string;
}

const TYPE_COLORS = {
  class: "bg-primary text-primary-foreground",
  assignment: "bg-accent text-accent-foreground",
  event: "bg-secondary text-secondary-foreground",
};

interface PlatformCalendarProps {
  events: CalendarEvent[];
  month?: Date;
  onSelectEvent?: (event: CalendarEvent) => void;
}

export function PlatformCalendar({ events, month = new Date(), onSelectEvent }: PlatformCalendarProps) {
  const year = month.getFullYear();
  const mon = month.getMonth();
  const firstDay = new Date(year, mon, 1).getDay();
  const daysInMonth = new Date(year, mon + 1, 0).getDate();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;

  const eventsByDay = useMemo(() => {
    const map = new Map<number, CalendarEvent[]>();
    for (const e of events) {
      if (e.date.getFullYear() !== year || e.date.getMonth() !== mon) continue;
      const day = e.date.getDate();
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(e);
    }
    return map;
  }, [events, year, mon]);

  const cells: Array<number | null> = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  return (
    <div className="card-ring overflow-hidden">
      <div className="border-b bg-muted/40 px-4 py-3 text-center font-serif font-semibold capitalize">
        {month.toLocaleDateString("es", { month: "long", year: "numeric" })}
      </div>
      <div className="grid grid-cols-7 border-b text-center text-xs font-medium text-muted-foreground">
        {weekDays.map((d) => (
          <div key={d} className="border-r px-1 py-2 last:border-r-0">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          const dayEvents = day ? eventsByDay.get(day) ?? [] : [];
          const isToday =
            day &&
            day === new Date().getDate() &&
            mon === new Date().getMonth() &&
            year === new Date().getFullYear();
          return (
            <div
              key={i}
              className={cn(
                "min-h-[72px] border-b border-r p-1 text-xs last:border-r-0 sm:min-h-[88px] sm:p-2",
                !day && "bg-muted/20"
              )}
            >
              {day && (
                <>
                  <span className={cn("inline-flex size-6 items-center justify-center rounded-full", isToday && "bg-primary text-primary-foreground font-semibold")}>
                    {day}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {dayEvents.slice(0, 2).map((e) => (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => onSelectEvent?.(e)}
                        className={cn("block w-full truncate rounded px-1 py-0.5 text-left text-[10px] sm:text-xs", TYPE_COLORS[e.type])}
                      >
                        {e.title}
                      </button>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="text-[10px] text-muted-foreground">+{dayEvents.length - 2} más</span>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

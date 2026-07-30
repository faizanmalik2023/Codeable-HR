"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarProps {
  selected?: Date | null;
  onSelect?: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
  highlightedDates?: Date[];
  className?: string;
}

const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

function isDisabled(date: Date, minDate?: Date, maxDate?: Date, disabledDates?: Date[]) {
  if (minDate && startOfDay(date) < startOfDay(minDate)) return true;
  if (maxDate && startOfDay(date) > startOfDay(maxDate)) return true;
  return !!disabledDates?.some((d) => isSameDay(d, date));
}

/** Years offered in the jump dropdown. Wide enough for a birthday at one end and a
 *  future joining date at the other; narrowed by min/max when the caller sets them. */
function yearRange(minDate?: Date, maxDate?: Date) {
  const now = new Date().getFullYear();
  const from = minDate ? minDate.getFullYear() : now - 80;
  const to = maxDate ? maxDate.getFullYear() : now + 10;
  return Array.from({ length: Math.max(1, to - from + 1) }, (_, i) => to - i);
}

export function Calendar({
  selected,
  onSelect,
  minDate,
  maxDate,
  disabledDates,
  highlightedDates,
  className,
}: CalendarProps) {
  const today = React.useMemo(() => new Date(), []);
  const [view, setView] = React.useState(() => {
    const base = selected ?? today;
    return { month: base.getMonth(), year: base.getFullYear() };
  });

  // Follow the value when it's set from outside (typing in the field, or Today).
  React.useEffect(() => {
    if (selected) setView({ month: selected.getMonth(), year: selected.getFullYear() });
  }, [selected]);

  const years = React.useMemo(() => yearRange(minDate, maxDate), [minDate, maxDate]);

  const shift = (by: number) => {
    const d = new Date(view.year, view.month + by, 1);
    setView({ month: d.getMonth(), year: d.getFullYear() });
  };

  // Monday-first grid: getDay() is Sunday-based, so rotate it.
  const firstWeekday = (new Date(view.year, view.month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const daysInPrev = new Date(view.year, view.month, 0).getDate();

  const cells: { day: number; outside: boolean; date: Date }[] = [];
  for (let i = firstWeekday - 1; i >= 0; i--) {
    cells.push({ day: daysInPrev - i, outside: true, date: new Date(view.year, view.month - 1, daysInPrev - i) });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, outside: false, date: new Date(view.year, view.month, d) });
  }
  // Pad to whole weeks so the grid never reflows height between months.
  while (cells.length % 7 !== 0) {
    const d = cells.length - firstWeekday - daysInMonth + 1;
    cells.push({ day: d, outside: true, date: new Date(view.year, view.month + 1, d) });
  }

  const selectClass =
    "h-8 cursor-pointer rounded-lg border-0 bg-transparent px-2 text-sm font-semibold text-foreground " +
    "hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className={cn("w-[17.5rem] select-none", className)}>
      {/* Month + year are dropdowns, not just arrows — reaching 1995 by stepping
          months is the whole reason the old picker was unusable for a birthday. */}
      <div className="mb-3 flex items-center justify-between gap-1">
        <div className="flex items-center gap-0.5">
          <select
            aria-label="Month"
            className={selectClass}
            value={view.month}
            onChange={(e) => setView((v) => ({ ...v, month: Number(e.target.value) }))}
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i}>{m}</option>
            ))}
          </select>
          <select
            aria-label="Year"
            className={selectClass}
            value={view.year}
            onChange={(e) => setView((v) => ({ ...v, year: Number(e.target.value) }))}
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => shift(-1)}
            className="rounded-lg p-1.5 text-foreground-muted transition-colors hover:bg-secondary hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => shift(1)}
            className="rounded-lg p-1.5 text-foreground-muted transition-colors hover:bg-secondary hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mb-1 grid grid-cols-7">
        {DAYS.map((d) => (
          <div key={d} className="flex h-8 items-center justify-center text-[0.6875rem] font-medium uppercase tracking-wide text-foreground-subtle">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map(({ day, outside, date }, i) => {
          const isSelected = !!selected && isSameDay(date, selected);
          const isToday = isSameDay(date, today);
          const off = isDisabled(date, minDate, maxDate, disabledDates);
          const highlighted = highlightedDates?.some((d) => isSameDay(d, date));

          return (
            <button
              key={`${date.getTime()}-${i}`}
              type="button"
              disabled={off}
              onClick={() => !off && onSelect?.(date)}
              className={cn(
                "relative mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                outside && "text-foreground-subtle/50",
                !outside && !isSelected && "text-foreground hover:bg-secondary",
                isSelected && "bg-primary font-semibold text-primary-foreground hover:bg-primary",
                !isSelected && isToday && "font-semibold text-primary",
                off && "cursor-not-allowed opacity-30 hover:bg-transparent"
              )}
            >
              {day}
              {/* Today keeps a dot rather than a ring, so it stays legible when selected. */}
              {isToday && !isSelected && (
                <span className="absolute bottom-1 h-1 w-1 rounded-full bg-primary" />
              )}
              {highlighted && !isSelected && (
                <span className="absolute bottom-1 h-1 w-1 rounded-full bg-accent" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

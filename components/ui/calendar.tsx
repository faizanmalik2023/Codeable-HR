"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
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

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function isDateDisabled(
  date: Date,
  minDate?: Date,
  maxDate?: Date,
  disabledDates?: Date[]
): boolean {
  if (minDate && date < minDate) return true;
  if (maxDate && date > maxDate) return true;
  if (disabledDates?.some((d) => isSameDay(d, date))) return true;
  return false;
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
  const today = new Date();
  const [currentMonth, setCurrentMonth] = React.useState(
    selected ? new Date(selected.getFullYear(), selected.getMonth(), 1) : new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [direction, setDirection] = React.useState(0);

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay();

  const prevMonth = () => {
    setDirection(-1);
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setDirection(1);
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return (
    <div className={cn("w-full max-w-[320px]", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={prevMonth}
          className="p-2 rounded-lg hover:bg-secondary transition-colors"
        >
          <ChevronLeft className="h-4 w-4 text-foreground-muted" />
        </button>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={`${currentMonth.getFullYear()}-${currentMonth.getMonth()}`}
            initial={{ opacity: 0, x: direction * 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -20 }}
            transition={{ duration: 0.15 }}
            className="text-sm font-semibold text-foreground"
          >
            {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </motion.span>
        </AnimatePresence>
        <button
          type="button"
          onClick={nextMonth}
          className="p-2 rounded-lg hover:bg-secondary transition-colors"
        >
          <ChevronRight className="h-4 w-4 text-foreground-muted" />
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS.map((day) => (
          <div
            key={day}
            className="h-8 flex items-center justify-center text-xs font-medium text-foreground-muted"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${currentMonth.getFullYear()}-${currentMonth.getMonth()}`}
          initial={{ opacity: 0, x: direction * 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -30 }}
          transition={{ duration: 0.15 }}
          className="grid grid-cols-7 gap-1"
        >
          {days.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="h-9" />;
            }

            const date = new Date(
              currentMonth.getFullYear(),
              currentMonth.getMonth(),
              day
            );
            const isSelected = selected && isSameDay(date, selected);
            const isToday = isSameDay(date, today);
            const isDisabled = isDateDisabled(date, minDate, maxDate, disabledDates);
            const isHighlighted = highlightedDates?.some((d) => isSameDay(d, date));
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;

            return (
              <button
                key={day}
                type="button"
                onClick={() => !isDisabled && onSelect?.(date)}
                disabled={isDisabled}
                className={cn(
                  "h-9 w-full rounded-lg text-sm font-medium transition-all duration-150",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : isToday
                    ? "bg-primary-muted text-primary"
                    : isHighlighted
                    ? "bg-accent-muted text-accent"
                    : isWeekend
                    ? "text-foreground-muted hover:bg-secondary"
                    : "text-foreground hover:bg-secondary",
                  isDisabled && "opacity-30 cursor-not-allowed hover:bg-transparent"
                )}
              >
                {day}
              </button>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

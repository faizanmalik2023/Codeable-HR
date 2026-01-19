"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar as CalendarIcon, ArrowRight, X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

interface DateRange {
  start: Date | null;
  end: Date | null;
}

interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (range: DateRange) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  error?: string;
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

function isInRange(date: Date, start: Date | null, end: Date | null): boolean {
  if (!start || !end) return false;
  return date >= start && date <= end;
}

function countDays(start: Date | null, end: Date | null): number {
  if (!start || !end) return 0;
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

export function DateRangePicker({
  value = { start: null, end: null },
  onChange,
  placeholder = "Select dates",
  minDate,
  maxDate,
  disabled,
  error,
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectingEnd, setSelectingEnd] = React.useState(false);
  const [hoverDate, setHoverDate] = React.useState<Date | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const today = new Date();
  const [leftMonth, setLeftMonth] = React.useState(
    value.start
      ? new Date(value.start.getFullYear(), value.start.getMonth(), 1)
      : new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const rightMonth = new Date(leftMonth.getFullYear(), leftMonth.getMonth() + 1, 1);

  // Close on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDateClick = (date: Date) => {
    if (!selectingEnd || !value.start) {
      // Selecting start date
      onChange?.({ start: date, end: null });
      setSelectingEnd(true);
    } else {
      // Selecting end date
      if (date < value.start) {
        onChange?.({ start: date, end: value.start });
      } else {
        onChange?.({ start: value.start, end: date });
      }
      setSelectingEnd(false);
      setIsOpen(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.({ start: null, end: null });
    setSelectingEnd(false);
  };

  const prevMonth = () => {
    setLeftMonth(new Date(leftMonth.getFullYear(), leftMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setLeftMonth(new Date(leftMonth.getFullYear(), leftMonth.getMonth() + 1, 1));
  };

  const renderMonth = (monthDate: Date) => {
    const daysInMonth = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth() + 1,
      0
    ).getDate();

    const firstDayOfMonth = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth(),
      1
    ).getDay();

    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return (
      <div className="w-[280px]">
        <div className="text-center text-sm font-semibold text-foreground mb-3">
          {MONTHS[monthDate.getMonth()]} {monthDate.getFullYear()}
        </div>

        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {DAYS.map((day) => (
            <div
              key={day}
              className="h-8 flex items-center justify-center text-xs font-medium text-foreground-muted"
            >
              {day.slice(0, 2)}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0.5">
          {days.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="h-9" />;
            }

            const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
            const isStart = value.start && isSameDay(date, value.start);
            const isEnd = value.end && isSameDay(date, value.end);
            const inRange = isInRange(date, value.start, value.end);
            const inHoverRange = selectingEnd && value.start && hoverDate &&
              isInRange(date, value.start, hoverDate > value.start ? hoverDate : value.start);
            const isToday = isSameDay(date, today);
            const isDisabled = (minDate && date < minDate) || (maxDate && date > maxDate);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;

            return (
              <button
                key={day}
                type="button"
                onClick={() => !isDisabled && handleDateClick(date)}
                onMouseEnter={() => setHoverDate(date)}
                onMouseLeave={() => setHoverDate(null)}
                disabled={isDisabled}
                className={cn(
                  "h-9 w-full text-sm font-medium transition-all duration-100 relative",
                  "focus:outline-none",
                  // Range background
                  (inRange || inHoverRange) && !isStart && !isEnd && "bg-primary/10",
                  // Start/End styling
                  isStart && "bg-primary text-primary-foreground rounded-l-lg",
                  isEnd && "bg-primary text-primary-foreground rounded-r-lg",
                  isStart && isEnd && "rounded-lg",
                  // Default styling
                  !isStart && !isEnd && !inRange && !inHoverRange && (
                    isToday
                      ? "text-primary font-semibold"
                      : isWeekend
                      ? "text-foreground-muted hover:bg-secondary"
                      : "text-foreground hover:bg-secondary"
                  ),
                  // Rounded corners for range
                  inRange && !isStart && !isEnd && "rounded-none",
                  isDisabled && "opacity-30 cursor-not-allowed hover:bg-transparent"
                )}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const dayCount = countDays(value.start, value.end);

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "flex h-11 w-full items-center justify-between rounded-xl border bg-transparent px-4 text-left",
          "transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary",
          "disabled:cursor-not-allowed disabled:opacity-50",
          isOpen ? "border-primary ring-2 ring-ring/20" : "border-input",
          error && "border-destructive"
        )}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <CalendarIcon className="h-4 w-4 text-foreground-muted shrink-0" />
          {value.start ? (
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-foreground truncate">{formatDate(value.start)}</span>
              {value.end && (
                <>
                  <ArrowRight className="h-3.5 w-3.5 text-foreground-muted shrink-0" />
                  <span className="text-foreground truncate">{formatDate(value.end)}</span>
                </>
              )}
              {dayCount > 0 && (
                <span className="text-xs text-foreground-muted bg-secondary px-2 py-0.5 rounded-full shrink-0">
                  {dayCount} {dayCount === 1 ? "day" : "days"}
                </span>
              )}
            </div>
          ) : (
            <span className="text-foreground-subtle">{placeholder}</span>
          )}
        </div>
        {(value.start || value.end) && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 rounded-full hover:bg-secondary transition-colors shrink-0 ml-2"
          >
            <X className="h-3.5 w-3.5 text-foreground-muted" />
          </button>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-2 p-4 rounded-xl border border-border bg-card shadow-lg"
          >
            {/* Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={prevMonth}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
              >
                <ChevronLeft className="h-4 w-4 text-foreground-muted" />
              </button>
              <span className="text-sm text-foreground-muted">
                {selectingEnd ? "Select end date" : "Select start date"}
              </span>
              <button
                type="button"
                onClick={nextMonth}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
              >
                <ChevronRight className="h-4 w-4 text-foreground-muted" />
              </button>
            </div>

            {/* Calendars */}
            <div className="flex gap-6">
              {renderMonth(leftMonth)}
              <div className="hidden md:block">
                {renderMonth(rightMonth)}
              </div>
            </div>

            {/* Quick select hint */}
            {value.start && !value.end && (
              <p className="text-xs text-foreground-subtle text-center mt-4 pt-4 border-t border-border">
                Click another date to complete your selection
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}

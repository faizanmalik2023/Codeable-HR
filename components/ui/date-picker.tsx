"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { toWireDate } from "@/lib/format";

interface DatePickerProps {
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  /** Ignored — a native date input renders the locale's own format hint. */
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  error?: string;
  className?: string;
}

/** `YYYY-MM-DD` → local midnight, so `toWireDate` round-trips it unchanged.
 *  `new Date("YYYY-MM-DD")` would parse as UTC and shift the day west of GMT. */
function fromWire(v: string): Date | null {
  const [y, m, d] = v.split("-").map(Number);
  return y && m && d ? new Date(y, m - 1, d) : null;
}

/**
 * Native `<input type="date">`. Typing works, and the browser's own picker jumps
 * years/months directly instead of stepping a month at a time — both of which the
 * previous custom popover calendar couldn't do.
 */
export function DatePicker({
  value,
  onChange,
  minDate,
  maxDate,
  disabled,
  error,
  className,
}: DatePickerProps) {
  return (
    <div className={cn("relative", className)}>
      <input
        type="date"
        value={value ? toWireDate(value) : ""}
        onChange={(e) => onChange?.(fromWire(e.target.value))}
        min={minDate ? toWireDate(minDate) : undefined}
        max={maxDate ? toWireDate(maxDate) : undefined}
        disabled={disabled}
        aria-invalid={!!error}
        className={cn(
          "h-11 w-full rounded-[var(--radius)] border bg-transparent px-4 text-left text-foreground",
          // Keeps the browser's calendar panel + indicator icon readable in both themes.
          "scheme-light dark:scheme-dark",
          "transition-all duration-200",
          "focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error ? "border-destructive" : "border-input"
        )}
      />
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}

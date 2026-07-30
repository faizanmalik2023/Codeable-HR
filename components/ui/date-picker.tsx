"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "./calendar";

interface DatePickerProps {
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  error?: string;
  className?: string;
}

const pad = (n: number) => String(n).padStart(2, "0");
const format = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;

/**
 * Parse what someone actually types. Day-first (Pakistan convention, and what the
 * field displays), tolerant of `-` and `.` separators and a 2-digit year. Returns
 * null for anything it can't read, so the caller can fall back to the last good
 * value instead of committing a wrong date.
 *
 * Deliberately NOT `new Date(str)`: that reads "05/06/2001" as May 6th (US order),
 * which silently produces the wrong birthday rather than failing.
 */
function parseTyped(input: string): Date | null {
  const m = input.trim().match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2}|\d{4})$/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  let year = Number(m[3]);
  if (m[3].length === 2) year += year > 50 ? 1900 : 2000;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const d = new Date(year, month - 1, day);
  // Rejects the likes of 31/02 — JS would roll it over to March.
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null;
  return d;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "dd/mm/yyyy",
  minDate,
  maxDate,
  disabled,
  error,
  className,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [text, setText] = React.useState(value ? format(value) : "");
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Keep the field in step with the value when it changes from outside (form reset,
  // Today, Clear) — but never while the user is mid-type, or it would fight them.
  const [typing, setTyping] = React.useState(false);
  React.useEffect(() => {
    if (!typing) setText(value ? format(value) : "");
  }, [value, typing]);

  React.useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const commitTyped = () => {
    setTyping(false);
    if (!text.trim()) {
      onChange?.(null);
      return;
    }
    const parsed = parseTyped(text);
    if (parsed) onChange?.(parsed);
    else setText(value ? format(value) : ""); // unreadable — put back what was there
  };

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <div
        className={cn(
          "flex h-11 w-full items-center gap-2 rounded-[var(--radius)] border bg-transparent pl-4 pr-2",
          "transition-all duration-200",
          "focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/20",
          disabled && "cursor-not-allowed opacity-50",
          error ? "border-destructive" : isOpen ? "border-primary" : "border-input"
        )}
      >
        <input
          type="text"
          inputMode="numeric"
          value={text}
          disabled={disabled}
          placeholder={placeholder}
          aria-invalid={!!error}
          onChange={(e) => {
            setTyping(true);
            setText(e.target.value);
          }}
          onBlur={commitTyped}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitTyped();
              setIsOpen(false);
            } else if (e.key === "Escape") setIsOpen(false);
          }}
          className="h-full w-full bg-transparent text-foreground placeholder:text-foreground-subtle focus:outline-none disabled:cursor-not-allowed"
        />
        {value && !disabled && (
          <button
            type="button"
            aria-label="Clear date"
            onClick={() => {
              onChange?.(null);
              setText("");
            }}
            className="shrink-0 rounded-full p-1 text-foreground-muted transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          type="button"
          aria-label="Open calendar"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen((o) => !o)}
          className={cn(
            "shrink-0 rounded-lg p-1.5 transition-colors hover:bg-secondary",
            isOpen ? "text-primary" : "text-foreground-muted"
          )}
        >
          <CalendarIcon className="h-4 w-4" />
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute z-50 mt-2 rounded-[var(--radius-lg)] border border-border bg-card p-3 shadow-[var(--shadow-md)]"
          >
            <Calendar
              selected={value}
              onSelect={(d) => {
                setTyping(false);
                onChange?.(d);
                setIsOpen(false);
              }}
              minDate={minDate}
              maxDate={maxDate}
            />
            <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
              <button
                type="button"
                onClick={() => {
                  onChange?.(null);
                  setText("");
                  setIsOpen(false);
                }}
                className="rounded-lg px-2 py-1 text-sm text-foreground-muted transition-colors hover:bg-secondary hover:text-foreground"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => {
                  setTyping(false);
                  onChange?.(new Date());
                  setIsOpen(false);
                }}
                className="rounded-lg px-2 py-1 text-sm font-medium text-primary transition-colors hover:bg-primary-muted"
              >
                Today
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}

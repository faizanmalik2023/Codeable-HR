"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
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

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  minDate,
  maxDate,
  disabled,
  error,
  className,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

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

  const handleSelect = (date: Date) => {
    onChange?.(date);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.(null);
  };

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
        <div className="flex items-center gap-3">
          <CalendarIcon className="h-4 w-4 text-foreground-muted" />
          <span className={cn(value ? "text-foreground" : "text-foreground-subtle")}>
            {value ? formatDate(value) : placeholder}
          </span>
        </div>
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 rounded-full hover:bg-secondary transition-colors"
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
            <Calendar
              selected={value}
              onSelect={handleSelect}
              minDate={minDate}
              maxDate={maxDate}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}

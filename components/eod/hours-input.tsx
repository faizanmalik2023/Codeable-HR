"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface HoursInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
}

export function HoursInput({
  value,
  onChange,
  min = 0,
  max = 24,
  step = 0.5,
  disabled,
  className,
}: HoursInputProps) {
  const handleDecrement = () => {
    const newValue = Math.max(min, value - step);
    onChange(newValue);
  };

  const handleIncrement = () => {
    const newValue = Math.min(max, value + step);
    onChange(newValue);
  };

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-4">
        {/* Decrement button */}
        <motion.button
          type="button"
          onClick={handleDecrement}
          disabled={disabled || value <= min}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl border border-border",
            "bg-secondary/50 text-foreground-muted",
            "transition-all duration-200",
            "hover:bg-secondary hover:border-border-hover",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            "focus:outline-none focus:ring-2 focus:ring-ring/20"
          )}
          whileTap={{ scale: 0.95 }}
        >
          <Minus className="h-4 w-4" />
        </motion.button>

        {/* Value display */}
        <div className="flex-1 text-center">
          <motion.div
            key={value}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-foreground"
          >
            {value}
          </motion.div>
          <p className="text-sm text-foreground-muted">hours</p>
        </div>

        {/* Increment button */}
        <motion.button
          type="button"
          onClick={handleIncrement}
          disabled={disabled || value >= max}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl border border-border",
            "bg-secondary/50 text-foreground-muted",
            "transition-all duration-200",
            "hover:bg-secondary hover:border-border-hover",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            "focus:outline-none focus:ring-2 focus:ring-ring/20"
          )}
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="h-4 w-4" />
        </motion.button>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
        {/* Hour markers */}
        <div className="absolute inset-0 flex justify-between px-0.5">
          {[0, 2, 4, 6, 8].map((hour) => (
            <div
              key={hour}
              className="w-0.5 h-full bg-background/50"
              style={{ opacity: hour <= value ? 0.3 : 0.1 }}
            />
          ))}
        </div>
      </div>

      {/* Quick select buttons */}
      <div className="flex justify-center gap-2">
        {[4, 6, 8].map((hours) => (
          <button
            key={hours}
            type="button"
            onClick={() => onChange(hours)}
            disabled={disabled}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200",
              value === hours
                ? "bg-primary text-primary-foreground"
                : "bg-secondary/50 text-foreground-muted hover:bg-secondary"
            )}
          >
            {hours}h
          </button>
        ))}
      </div>
    </div>
  );
}

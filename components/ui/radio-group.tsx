"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

interface RadioGroupProps {
  value?: string;
  onChange?: (value: string) => void;
  options: RadioOption[];
  name: string;
  disabled?: boolean;
  orientation?: "horizontal" | "vertical";
  className?: string;
}

export function RadioGroup({
  value,
  onChange,
  options,
  name,
  disabled,
  orientation = "horizontal",
  className,
}: RadioGroupProps) {
  return (
    <div
      className={cn(
        "flex gap-3",
        orientation === "vertical" ? "flex-col" : "flex-row flex-wrap",
        className
      )}
      role="radiogroup"
    >
      {options.map((option) => {
        const isSelected = value === option.value;

        return (
          <label
            key={option.value}
            className={cn(
              "relative flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer",
              "transition-all duration-200",
              isSelected
                ? "border-primary bg-primary-muted/50 shadow-sm"
                : "border-border bg-card hover:border-border-hover hover:bg-card-hover",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={isSelected}
              onChange={(e) => onChange?.(e.target.value)}
              disabled={disabled}
              className="sr-only"
            />

            {/* Custom radio indicator */}
            <div
              className={cn(
                "relative h-5 w-5 rounded-full border-2 transition-all duration-200",
                isSelected ? "border-primary" : "border-foreground-subtle"
              )}
            >
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute inset-1 rounded-full bg-primary"
                />
              )}
            </div>

            <div className="flex-1">
              <p
                className={cn(
                  "text-sm font-medium",
                  isSelected ? "text-primary" : "text-foreground"
                )}
              >
                {option.label}
              </p>
              {option.description && (
                <p className="text-xs text-foreground-muted mt-0.5">
                  {option.description}
                </p>
              )}
            </div>
          </label>
        );
      })}
    </div>
  );
}

// Simpler toggle button group variant
interface ToggleGroupProps {
  value?: string;
  onChange?: (value: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  className?: string;
}

export function ToggleGroup({
  value,
  onChange,
  options,
  disabled,
  className,
}: ToggleGroupProps) {
  return (
    <div
      className={cn(
        "inline-flex p-1 rounded-xl bg-secondary/50 border border-border",
        className
      )}
    >
      {options.map((option) => {
        const isSelected = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange?.(option.value)}
            disabled={disabled}
            className={cn(
              "relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
              isSelected
                ? "text-primary-foreground"
                : "text-foreground-muted hover:text-foreground",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {isSelected && (
              <motion.div
                layoutId="toggle-active"
                className="absolute inset-0 bg-primary rounded-lg shadow-sm"
                transition={{ type: "spring", duration: 0.3, bounce: 0.15 }}
              />
            )}
            <span className="relative z-10">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

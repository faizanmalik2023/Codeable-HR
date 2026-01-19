"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LeaveBalanceCardProps {
  type: string;
  icon: React.ReactNode;
  remaining: number;
  total: number;
  color: "primary" | "warning" | "accent" | "success";
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

const colorStyles = {
  primary: {
    bg: "bg-primary-muted/50",
    border: "border-primary/20",
    selectedBorder: "border-primary",
    text: "text-primary",
    progress: "bg-primary",
    progressBg: "bg-primary/20",
  },
  warning: {
    bg: "bg-warning-muted/50",
    border: "border-warning/20",
    selectedBorder: "border-warning",
    text: "text-warning",
    progress: "bg-warning",
    progressBg: "bg-warning/20",
  },
  accent: {
    bg: "bg-accent-muted/50",
    border: "border-accent/20",
    selectedBorder: "border-accent",
    text: "text-accent",
    progress: "bg-accent",
    progressBg: "bg-accent/20",
  },
  success: {
    bg: "bg-success-muted/50",
    border: "border-success/20",
    selectedBorder: "border-success",
    text: "text-success",
    progress: "bg-success",
    progressBg: "bg-success/20",
  },
};

export function LeaveBalanceCard({
  type,
  icon,
  remaining,
  total,
  color,
  isSelected,
  onClick,
  className,
}: LeaveBalanceCardProps) {
  const styles = colorStyles[color];
  const percentage = (remaining / total) * 100;
  const isLow = remaining <= 2;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={cn(
        "relative w-full p-4 rounded-xl border-2 text-left transition-all duration-200",
        styles.bg,
        isSelected ? styles.selectedBorder : styles.border,
        isSelected && "shadow-md",
        onClick && "cursor-pointer hover:shadow-md",
        !onClick && "cursor-default",
        className
      )}
      whileHover={onClick ? { scale: 1.02 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
    >
      {/* Selection indicator */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={cn(
            "absolute top-3 right-3 h-5 w-5 rounded-full flex items-center justify-center",
            styles.progress
          )}
        >
          <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
            <path
              d="M2.5 6L5 8.5L9.5 3.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>
      )}

      <div className="flex items-start gap-3">
        <div className={cn("p-2 rounded-lg", styles.bg, styles.text)}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{type}</p>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className={cn("text-2xl font-bold", styles.text)}>
              {remaining}
            </span>
            <span className="text-sm text-foreground-muted">/ {total} days</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className={cn("h-1.5 rounded-full mt-3", styles.progressBg)}>
        <motion.div
          className={cn("h-full rounded-full", styles.progress)}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* Low balance warning */}
      {isLow && (
        <p className="text-xs text-foreground-muted mt-2">
          {remaining === 0 ? "No days remaining" : `Only ${remaining} ${remaining === 1 ? "day" : "days"} left`}
        </p>
      )}
    </motion.button>
  );
}

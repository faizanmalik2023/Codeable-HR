"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatSummaryProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  variant?: "default" | "success" | "warning" | "destructive" | "muted";
  onClick?: () => void;
  className?: string;
}

const variantStyles = {
  default: {
    bg: "bg-card",
    iconBg: "bg-secondary",
    iconColor: "text-foreground-muted",
    valueColor: "text-foreground",
  },
  success: {
    bg: "bg-success-muted/30",
    iconBg: "bg-success-muted",
    iconColor: "text-success",
    valueColor: "text-success",
  },
  warning: {
    bg: "bg-warning-muted/30",
    iconBg: "bg-warning-muted",
    iconColor: "text-warning",
    valueColor: "text-warning",
  },
  destructive: {
    bg: "bg-destructive-muted/30",
    iconBg: "bg-destructive-muted",
    iconColor: "text-destructive",
    valueColor: "text-destructive",
  },
  muted: {
    bg: "bg-secondary/50",
    iconBg: "bg-secondary",
    iconColor: "text-foreground-muted",
    valueColor: "text-foreground-muted",
  },
};

export function StatSummary({
  label,
  value,
  icon: Icon,
  trend,
  trendLabel,
  variant = "default",
  onClick,
  className,
}: StatSummaryProps) {
  const styles = variantStyles[variant];

  return (
    <motion.div
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl border border-border",
        styles.bg,
        onClick && "cursor-pointer hover:border-border-hover",
        className
      )}
      onClick={onClick}
      whileHover={onClick ? { scale: 1.02 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
    >
      <div className={cn("p-3 rounded-xl", styles.iconBg)}>
        <Icon className={cn("h-5 w-5", styles.iconColor)} />
      </div>
      <div>
        <p className="text-sm text-foreground-muted">{label}</p>
        <div className="flex items-baseline gap-2">
          <p className={cn("text-2xl font-bold", styles.valueColor)}>{value}</p>
          {trendLabel && (
            <span className={cn(
              "text-xs font-medium",
              trend === "up" ? "text-success" : trend === "down" ? "text-destructive" : "text-foreground-muted"
            )}>
              {trend === "up" ? "↑" : trend === "down" ? "↓" : ""} {trendLabel}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Simple inline stat
export function InlineStat({
  label,
  value,
  icon: Icon,
  variant = "default",
}: Pick<StatSummaryProps, "label" | "value" | "icon" | "variant">) {
  const styles = variantStyles[variant];

  return (
    <div className="flex items-center gap-2">
      <div className={cn("p-1.5 rounded-lg", styles.iconBg)}>
        <Icon className={cn("h-3.5 w-3.5", styles.iconColor)} />
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className={cn("text-lg font-semibold", styles.valueColor)}>{value}</span>
        <span className="text-sm text-foreground-muted">{label}</span>
      </div>
    </div>
  );
}

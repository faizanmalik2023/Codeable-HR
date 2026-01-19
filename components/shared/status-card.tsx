"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    positive: boolean;
  };
  variant?: "default" | "primary" | "success" | "warning" | "accent";
  className?: string;
  onClick?: () => void;
}

const variantStyles = {
  default: {
    bg: "bg-secondary/50",
    icon: "bg-secondary text-foreground-muted",
  },
  primary: {
    bg: "bg-primary-muted",
    icon: "bg-primary text-primary-foreground",
  },
  success: {
    bg: "bg-success-muted",
    icon: "bg-success text-success-foreground",
  },
  warning: {
    bg: "bg-warning-muted",
    icon: "bg-warning text-warning-foreground",
  },
  accent: {
    bg: "bg-accent-muted",
    icon: "bg-accent text-accent-foreground",
  },
};

export function StatusCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
  className,
  onClick,
}: StatusCardProps) {
  const styles = variantStyles[variant];

  return (
    <motion.div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border bg-card p-5 cursor-pointer",
        "transition-all duration-300 hover:shadow-lg hover:border-border-hover",
        "group",
        className
      )}
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Background decoration */}
      <div
        className={cn(
          "absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-50 transition-transform duration-300 group-hover:scale-110",
          styles.bg
        )}
      />

      <div className="relative flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground-muted">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {subtitle && (
            <p className="text-xs text-foreground-subtle">{subtitle}</p>
          )}
          {trend && (
            <div
              className={cn(
                "inline-flex items-center gap-1 text-xs font-medium",
                trend.positive ? "text-success" : "text-destructive"
              )}
            >
              <span>{trend.positive ? "↑" : "↓"}</span>
              <span>{trend.value}</span>
            </div>
          )}
        </div>

        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110",
            styles.icon
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </motion.div>
  );
}

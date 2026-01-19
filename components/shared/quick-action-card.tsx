"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { LucideIcon, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
  variant?: "default" | "primary" | "subtle";
  badge?: string;
  className?: string;
}

export function QuickActionCard({
  title,
  description,
  icon: Icon,
  href,
  onClick,
  variant = "default",
  badge,
  className,
}: QuickActionCardProps) {
  const isPrimary = variant === "primary";

  return (
    <motion.button
      className={cn(
        "relative w-full overflow-hidden rounded-xl p-5 text-left transition-all duration-300",
        "group focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isPrimary
          ? "bg-primary text-primary-foreground hover:bg-primary-hover shadow-lg shadow-primary/20"
          : "border border-border bg-card hover:border-border-hover hover:shadow-md",
        className
      )}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Shimmer effect on hover */}
      <motion.div
        className={cn(
          "absolute inset-0 -translate-x-full bg-gradient-to-r opacity-0 transition-opacity group-hover:opacity-100",
          isPrimary
            ? "from-transparent via-white/10 to-transparent"
            : "from-transparent via-primary/5 to-transparent"
        )}
        initial={{ x: "-100%" }}
        whileHover={{ x: "100%" }}
        transition={{ duration: 0.6 }}
      />

      <div className="relative flex items-start gap-4">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110",
            isPrimary
              ? "bg-white/20"
              : "bg-primary-muted text-primary"
          )}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3
              className={cn(
                "font-semibold",
                isPrimary ? "text-primary-foreground" : "text-foreground"
              )}
            >
              {title}
            </h3>
            {badge && (
              <span
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold",
                  isPrimary
                    ? "bg-white/20 text-primary-foreground"
                    : "bg-warning-muted text-warning"
                )}
              >
                {badge}
              </span>
            )}
          </div>
          <p
            className={cn(
              "text-sm mt-1",
              isPrimary ? "text-primary-foreground/80" : "text-foreground-muted"
            )}
          >
            {description}
          </p>
        </div>

        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300",
            "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0",
            isPrimary ? "bg-white/20" : "bg-secondary"
          )}
        >
          <ArrowRight
            className={cn(
              "h-4 w-4",
              isPrimary ? "text-primary-foreground" : "text-foreground-muted"
            )}
          />
        </div>
      </div>
    </motion.button>
  );
}

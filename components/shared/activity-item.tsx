"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityItemProps {
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  title: string;
  description: string;
  time: string;
  isNew?: boolean;
  onClick?: () => void;
}

export function ActivityItem({
  icon: Icon,
  iconColor = "text-foreground-muted",
  iconBg = "bg-secondary",
  title,
  description,
  time,
  isNew,
  onClick,
}: ActivityItemProps) {
  return (
    <motion.div
      className={cn(
        "flex items-start gap-4 p-4 rounded-xl cursor-pointer",
        "transition-colors duration-200 hover:bg-secondary/50",
        isNew && "bg-primary-muted/30"
      )}
      onClick={onClick}
      whileHover={{ x: 4 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
          iconBg
        )}
      >
        <Icon className={cn("h-5 w-5", iconColor)} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground">{title}</p>
          {isNew && (
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
          )}
        </div>
        <p className="text-sm text-foreground-muted mt-0.5 line-clamp-1">
          {description}
        </p>
      </div>

      <span className="text-xs text-foreground-subtle whitespace-nowrap">
        {time}
      </span>
    </motion.div>
  );
}

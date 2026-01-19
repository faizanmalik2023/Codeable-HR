"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { FileText, FileEdit, CheckCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type EODStatus = "not_started" | "draft" | "submitted";

interface EODStatusBadgeProps {
  status: EODStatus;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const statusConfig = {
  not_started: {
    label: "Not Started",
    description: "Start writing today's EOD",
    icon: Clock,
    color: "text-foreground-muted",
    bg: "bg-secondary",
    border: "border-border",
  },
  draft: {
    label: "Draft",
    description: "Continue where you left off",
    icon: FileEdit,
    color: "text-warning",
    bg: "bg-warning-muted",
    border: "border-warning/20",
  },
  submitted: {
    label: "Submitted",
    description: "Today's EOD is complete",
    icon: CheckCircle,
    color: "text-success",
    bg: "bg-success-muted",
    border: "border-success/20",
  },
};

const sizeConfig = {
  sm: {
    container: "px-2.5 py-1 gap-1.5",
    icon: "h-3.5 w-3.5",
    text: "text-xs",
  },
  md: {
    container: "px-3 py-1.5 gap-2",
    icon: "h-4 w-4",
    text: "text-sm",
  },
  lg: {
    container: "px-4 py-2 gap-2.5",
    icon: "h-5 w-5",
    text: "text-base",
  },
};

export function EODStatusBadge({
  status,
  size = "md",
  showLabel = true,
  className,
}: EODStatusBadgeProps) {
  const config = statusConfig[status];
  const sizes = sizeConfig[size];
  const Icon = config.icon;

  return (
    <motion.div
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        config.bg,
        config.border,
        sizes.container,
        className
      )}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Icon className={cn(sizes.icon, config.color)} />
      {showLabel && (
        <span className={cn(sizes.text, config.color)}>{config.label}</span>
      )}
    </motion.div>
  );
}

export function EODStatusCard({
  status,
  className,
}: {
  status: EODStatus;
  className?: string;
}) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <motion.div
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl border",
        config.bg,
        config.border,
        className
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className={cn("p-2.5 rounded-lg", config.bg)}>
        <Icon className={cn("h-6 w-6", config.color)} />
      </div>
      <div>
        <p className={cn("font-semibold", config.color)}>{config.label}</p>
        <p className="text-sm text-foreground-muted">{config.description}</p>
      </div>
    </motion.div>
  );
}

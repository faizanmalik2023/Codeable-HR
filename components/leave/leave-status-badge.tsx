"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Clock, CheckCircle, XCircle, Ban } from "lucide-react";
import { cn } from "@/lib/utils";

type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";

interface LeaveStatusBadgeProps {
  status: LeaveStatus;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

const statusConfig = {
  pending: {
    label: "Pending",
    icon: Clock,
    color: "text-warning",
    bg: "bg-warning-muted",
    border: "border-warning/20",
  },
  approved: {
    label: "Approved",
    icon: CheckCircle,
    color: "text-success",
    bg: "bg-success-muted",
    border: "border-success/20",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    color: "text-destructive",
    bg: "bg-destructive-muted",
    border: "border-destructive/20",
  },
  cancelled: {
    label: "Cancelled",
    icon: Ban,
    color: "text-foreground-muted",
    bg: "bg-secondary",
    border: "border-border",
  },
};

const sizeConfig = {
  sm: {
    container: "px-2 py-0.5 gap-1",
    icon: "h-3 w-3",
    text: "text-xs",
  },
  md: {
    container: "px-2.5 py-1 gap-1.5",
    icon: "h-3.5 w-3.5",
    text: "text-xs",
  },
  lg: {
    container: "px-3 py-1.5 gap-2",
    icon: "h-4 w-4",
    text: "text-sm",
  },
};

export function LeaveStatusBadge({
  status,
  size = "md",
  showIcon = true,
  className,
}: LeaveStatusBadgeProps) {
  const config = statusConfig[status];
  const sizes = sizeConfig[size];
  const Icon = config.icon;

  return (
    <motion.span
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
      {showIcon && <Icon className={cn(sizes.icon, config.color)} />}
      <span className={cn(sizes.text, config.color)}>{config.label}</span>
    </motion.span>
  );
}

export function LeaveStatusDot({
  status,
  className,
}: {
  status: LeaveStatus;
  className?: string;
}) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex h-2 w-2 rounded-full",
        status === "pending" && "animate-pulse",
        className
      )}
      style={{
        backgroundColor: `hsl(var(--${status === "pending" ? "warning" : status === "approved" ? "success" : status === "rejected" ? "destructive" : "foreground-muted"}))`,
      }}
    />
  );
}

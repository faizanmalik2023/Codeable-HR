"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface TeamMemberRowProps {
  name: string;
  role: string;
  avatar?: string;
  status?: React.ReactNode;
  meta?: React.ReactNode;
  action?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function TeamMemberRow({
  name,
  role,
  avatar,
  status,
  meta,
  action,
  onClick,
  className,
}: TeamMemberRowProps) {
  return (
    <motion.div
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl transition-colors",
        onClick && "cursor-pointer hover:bg-secondary/50",
        className
      )}
      onClick={onClick}
      whileHover={onClick ? { x: 4 } : undefined}
      transition={{ duration: 0.15 }}
    >
      <Avatar name={name} src={avatar} size="md" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-foreground truncate">{name}</p>
          {status}
        </div>
        <p className="text-sm text-foreground-muted truncate">{role}</p>
      </div>

      {meta && <div className="hidden sm:block">{meta}</div>}

      {action ? (
        action
      ) : onClick ? (
        <ChevronRight className="h-4 w-4 text-foreground-subtle" />
      ) : null}
    </motion.div>
  );
}

// EOD Status indicator for team members
interface EODStatusIndicatorProps {
  status: "not_submitted" | "draft" | "submitted";
}

export function EODStatusIndicator({ status }: EODStatusIndicatorProps) {
  const config = {
    not_submitted: {
      label: "Not Submitted",
      variant: "destructive" as const,
      dot: "bg-destructive",
    },
    draft: {
      label: "Draft",
      variant: "warning" as const,
      dot: "bg-warning",
    },
    submitted: {
      label: "Submitted",
      variant: "success" as const,
      dot: "bg-success",
    },
  };

  const { label, variant, dot } = config[status];

  return (
    <Badge variant={variant} className="gap-1.5 text-xs">
      <span className={cn("h-1.5 w-1.5 rounded-full", dot, status === "not_submitted" && "animate-pulse")} />
      {label}
    </Badge>
  );
}

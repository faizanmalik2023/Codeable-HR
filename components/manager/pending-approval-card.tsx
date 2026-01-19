"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, Check, X, ChevronRight } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PendingApprovalCardProps {
  id: string;
  employeeName: string;
  employeeRole: string;
  employeeAvatar?: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason?: string;
  submittedAt: string;
  onApprove?: () => void;
  onReject?: () => void;
  onViewDetails?: () => void;
  isLoading?: boolean;
  className?: string;
}

export function PendingApprovalCard({
  id,
  employeeName,
  employeeRole,
  employeeAvatar,
  leaveType,
  startDate,
  endDate,
  days,
  reason,
  submittedAt,
  onApprove,
  onReject,
  onViewDetails,
  isLoading,
  className,
}: PendingApprovalCardProps) {
  const isSameDay = startDate === endDate;

  return (
    <motion.div
      className={cn(
        "p-4 rounded-xl border border-warning/20 bg-warning-muted/20",
        "hover:border-warning/30 hover:bg-warning-muted/30 transition-all",
        className
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header with employee info */}
      <div className="flex items-start gap-4 mb-4">
        <Avatar name={employeeName} src={employeeAvatar} size="md" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground">{employeeName}</p>
          <p className="text-sm text-foreground-muted">{employeeRole}</p>
        </div>
        <Badge variant="warning" className="shrink-0">
          {leaveType}
        </Badge>
      </div>

      {/* Leave details */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4 text-sm">
        <div className="flex items-center gap-2 text-foreground">
          <Calendar className="h-4 w-4 text-foreground-muted" />
          <span>
            {formatDate(new Date(startDate))}
            {!isSameDay && <> — {formatDate(new Date(endDate))}</>}
          </span>
        </div>
        <Badge variant="muted">{days} {days === 1 ? "day" : "days"}</Badge>
        <div className="flex items-center gap-2 text-foreground-muted">
          <Clock className="h-3.5 w-3.5" />
          <span className="text-xs">Requested {formatDate(new Date(submittedAt))}</span>
        </div>
      </div>

      {/* Reason if provided */}
      {reason && (
        <p className="text-sm text-foreground-muted mb-4 line-clamp-2">
          "{reason}"
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="success"
          onClick={onApprove}
          disabled={isLoading}
          className="gap-1.5"
        >
          <Check className="h-4 w-4" />
          Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onReject}
          disabled={isLoading}
          className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive-muted"
        >
          <X className="h-4 w-4" />
          Decline
        </Button>
        <div className="flex-1" />
        <Button
          size="sm"
          variant="ghost"
          onClick={onViewDetails}
          className="gap-1 text-foreground-muted"
        >
          Details
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}

// Compact version for dashboard
export function PendingApprovalCompact({
  employeeName,
  employeeAvatar,
  leaveType,
  startDate,
  endDate,
  days,
  onViewDetails,
}: Pick<PendingApprovalCardProps, "employeeName" | "employeeAvatar" | "leaveType" | "startDate" | "endDate" | "days" | "onViewDetails">) {
  const isSameDay = startDate === endDate;

  return (
    <motion.button
      onClick={onViewDetails}
      className="w-full flex items-center gap-3 p-3 rounded-xl bg-warning-muted/30 hover:bg-warning-muted/50 transition-colors text-left"
      whileHover={{ x: 4 }}
      transition={{ duration: 0.15 }}
    >
      <Avatar name={employeeName} src={employeeAvatar} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{employeeName}</p>
        <p className="text-xs text-foreground-muted">
          {formatDate(new Date(startDate))}
          {!isSameDay && ` — ${formatDate(new Date(endDate))}`}
          {" · "}{days}d {leaveType}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 text-foreground-subtle shrink-0" />
    </motion.button>
  );
}

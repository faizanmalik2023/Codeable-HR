"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { enumHelper } from "@/lib/enums";
import type {
  ProjectMilestoneStatus,
  ProjectPriority,
  ProjectStatus,
  ProjectTaskStatus,
} from "@/lib/api/projects-mgmt";

/* ------------------------------------------------------------------ */
/* Local label + tone maps (server has no enumHelper for these yet)     */
/* ------------------------------------------------------------------ */
export const ProjectStatusEnum = enumHelper<ProjectStatus>({
  planning: { label: "Planning", tone: "muted" },
  active: { label: "Active", tone: "success" },
  on_hold: { label: "On Hold", tone: "warning" },
  completed: { label: "Completed", tone: "default" },
  archived: { label: "Archived", tone: "secondary" },
});

export const ProjectPriorityEnum = enumHelper<ProjectPriority>({
  low: { label: "Low", tone: "muted" },
  medium: { label: "Medium", tone: "secondary" },
  high: { label: "High", tone: "warning" },
  critical: { label: "Critical", tone: "destructive" },
});

export const ProjectTaskStatusEnum = enumHelper<ProjectTaskStatus>({
  todo: { label: "Todo", tone: "muted" },
  in_progress: { label: "In Progress", tone: "warning" },
  done: { label: "Done", tone: "success" },
});

export const ProjectMilestoneStatusEnum = enumHelper<ProjectMilestoneStatus>({
  pending: { label: "Pending", tone: "muted" },
  in_progress: { label: "In Progress", tone: "warning" },
  completed: { label: "Completed", tone: "success" },
});

/** Filter tabs for the list page. */
export const PROJECT_FILTERS = [
  "all",
  "active",
  "planning",
  "on_hold",
  "completed",
  "archived",
] as const;

/** Kanban columns in display order. */
export const TASK_COLUMNS: { value: ProjectTaskStatus; label: string }[] = [
  { value: "todo", label: "Todo" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

/**
 * Swatch palette for the project accent colour. These are stored data values
 * (the project's `color` field), not chrome — mirrors the `hex` hints in
 * `lib/enums.ts`.
 */
export const PROJECT_COLORS = [
  "#14b8a6",
  "#6366f1",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#10b981",
  "#3b82f6",
] as const;

export const DEFAULT_PROJECT_COLOR = PROJECT_COLORS[0];

/** Fallback project-member roles (server `project_member_role` preferred via useEnums). */
export const PROJECT_ROLE_FALLBACK = ["lead", "developer", "designer", "qa", "pm", "member"];
export const PROJECT_ROLE_LABELS: Record<string, string> = {
  lead: "Lead",
  developer: "Developer",
  designer: "Designer",
  qa: "QA",
  pm: "Project Manager",
  member: "Member",
};
export const roleLabel = (r?: string | null): string =>
  (r && PROJECT_ROLE_LABELS[r]) || (r ? r.replace(/_/g, " ") : "Member");

/* ------------------------------------------------------------------ */
/* Badges                                                              */
/* ------------------------------------------------------------------ */
export function ProjectStatusBadge({ status }: { status: string }) {
  return <Badge variant={ProjectStatusEnum.tone(status)}>{ProjectStatusEnum.label(status)}</Badge>;
}

export function ProjectPriorityBadge({ priority }: { priority: string }) {
  return (
    <Badge variant={ProjectPriorityEnum.tone(priority)}>
      {ProjectPriorityEnum.label(priority)}
    </Badge>
  );
}

export function TaskStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={ProjectTaskStatusEnum.tone(status)}>
      {ProjectTaskStatusEnum.label(status)}
    </Badge>
  );
}

export function MilestoneStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={ProjectMilestoneStatusEnum.tone(status)}>
      {ProjectMilestoneStatusEnum.label(status)}
    </Badge>
  );
}

/* ------------------------------------------------------------------ */
/* Progress bar                                                        */
/* ------------------------------------------------------------------ */
export function ProgressBar({
  value,
  color,
  className,
  showLabel = false,
}: {
  value?: number | null;
  color?: string | null;
  className?: string;
  showLabel?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value ?? 0)));
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%`, backgroundColor: color || undefined }}
        />
      </div>
      {showLabel && (
        <span className="w-9 shrink-0 text-right text-xs font-medium text-foreground-muted">
          {pct}%
        </span>
      )}
    </div>
  );
}

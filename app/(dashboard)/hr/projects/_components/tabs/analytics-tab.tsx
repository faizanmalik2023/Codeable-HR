"use client";

import { ListTodo, CheckCircle2, Clock, Users, BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { StatusCard } from "@/components/shared/status-card";
import { QueryState } from "@/components/shared/query-state";
import { SkeletonStats } from "@/components/ui/skeleton";
import type { ProjectAnalytics, ProjectSummary } from "@/lib/api/projects-mgmt";
import type { useProjectDetail } from "../../[id]/use-project-detail";
import { ProgressBar } from "../project-meta";

interface AnalyticsTabProps {
  summary: ProjectSummary;
  pd: ReturnType<typeof useProjectDetail>;
}

/** Reads a numeric metric from either the flat field or the nested `stats` map. */
function metric(a: ProjectAnalytics | undefined, keys: string[], fallback = 0): number {
  if (!a) return fallback;
  for (const k of keys) {
    const flat = (a as Record<string, unknown>)[k];
    if (typeof flat === "number") return flat;
    const nested = a.stats?.[k];
    if (typeof nested === "number") return nested;
  }
  return fallback;
}

export function AnalyticsTab({ summary, pd }: AnalyticsTabProps) {
  const { analytics } = pd;

  return (
    <QueryState
      isLoading={analytics.isLoading}
      isError={analytics.isError}
      error={analytics.error}
      data={analytics.data}
      onRetry={() => analytics.refetch()}
      skeleton={<SkeletonStats count={4} />}
      isEmpty={() => false}
    >
      {(a) => {
        const total = metric(a, ["total_tasks"], summary.open_task_count ?? 0);
        const done = metric(a, ["completed_tasks"]);
        const open = metric(a, ["open_tasks"], summary.open_task_count ?? 0);
        const hours = metric(a, ["total_hours"]);
        const memberCount = metric(a, ["member_count"], summary.member_count ?? 0);
        const memberRows = a?.members ?? [];
        const maxHours = Math.max(1, ...memberRows.map((m) => m.hours ?? 0));

        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatusCard title="Total Tasks" value={String(total)} icon={ListTodo} variant="primary" />
              <StatusCard title="Completed" value={String(done)} icon={CheckCircle2} variant="success" />
              <StatusCard title="Open Tasks" value={String(open)} icon={Clock} variant="warning" />
              <StatusCard title="Team Size" value={String(memberCount)} icon={Users} variant="accent" />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <Card className="space-y-4 p-5 lg:col-span-1">
                <h3 className="text-sm font-semibold text-foreground">Progress</h3>
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-xs text-foreground-muted">
                    <span>Overall completion</span>
                    <span className="font-medium text-foreground">{Math.round(summary.progress ?? 0)}%</span>
                  </div>
                  <ProgressBar value={summary.progress} color={summary.color} />
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
                  <span className="text-foreground-muted">Hours logged</span>
                  <span className="font-medium text-foreground">{hours}h</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground-muted">Milestones</span>
                  <span className="font-medium text-foreground">
                    {summary.completed_milestone_count ?? 0} / {summary.milestone_count ?? 0}
                  </span>
                </div>
              </Card>

              <Card className="p-5 lg:col-span-2">
                <h3 className="mb-4 text-sm font-semibold text-foreground">Contribution by member</h3>
                {memberRows.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <BarChart3 className="h-6 w-6 text-foreground-subtle" />
                    <p className="text-sm text-foreground-muted">No member data available.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {memberRows.map((m, i) => {
                      const name = m.user?.full_name || m.user?.name || m.full_name || "Member";
                      const h = m.hours ?? 0;
                      return (
                        <div key={m.user?.id ?? i} className="flex items-center gap-3">
                          <Avatar name={name} src={m.user?.avatar ?? undefined} size="sm" />
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-center justify-between text-sm">
                              <span className="truncate font-medium text-foreground">{name}</span>
                              <span className="shrink-0 text-xs text-foreground-muted">
                                {h}h{typeof m.task_count === "number" ? ` · ${m.task_count} tasks` : ""}
                              </span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-secondary">
                              <div
                                className="h-full rounded-full bg-primary"
                                style={{ width: `${Math.round((h / maxHours) * 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>
          </div>
        );
      }}
    </QueryState>
  );
}

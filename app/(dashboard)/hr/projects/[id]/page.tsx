"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { MoreVertical, Pencil, Trash2, ArrowLeftRight, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/empty-state";
import { ConfirmModal } from "@/components/ui/modal";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/shared/page-header";
import { useProjectDetail, type ProjectTab } from "./use-project-detail";
import { ProjectFormSheet } from "../_components/project-form-sheet";
import {
  ProgressBar,
  ProjectPriorityBadge,
  ProjectStatusBadge,
  ProjectStatusEnum,
} from "../_components/project-meta";
import { OverviewTab } from "../_components/tabs/overview-tab";
import { TeamTab } from "../_components/tabs/team-tab";
import { TasksTab } from "../_components/tabs/tasks-tab";
import { ActivityTab } from "../_components/tabs/activity-tab";
import { AnalyticsTab } from "../_components/tabs/analytics-tab";
import type { ProjectStatus } from "@/lib/api/projects-mgmt";

const TABS: { value: ProjectTab; label: string }[] = [
  { value: "overview", label: "Overview" },
  { value: "team", label: "Team" },
  { value: "tasks", label: "Tasks" },
  { value: "activity", label: "Activity" },
  { value: "analytics", label: "Analytics" },
];

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [tab, setTab] = React.useState<ProjectTab>("overview");
  const pd = useProjectDetail(id, tab);

  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const detail = pd.detail.data;
  const summary = detail?.summary;

  if (pd.detail.isLoading && !detail) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (pd.detail.isError || !summary) {
    return (
      <div className="space-y-6">
        <PageHeader title="Project" back />
        <ErrorState onRetry={() => pd.detail.refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={summary.name} description={summary.code} back />

      {/* Summary header card */}
      <Card className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span
              className="mt-1 h-10 w-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: summary.color || "hsl(var(--primary))" }}
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <ProjectStatusBadge status={summary.status} />
                <ProjectPriorityBadge priority={summary.priority} />
              </div>
              {summary.client_name && (
                <p className="mt-2 text-sm text-foreground-muted">
                  Client: <span className="text-foreground">{summary.client_name}</span>
                </p>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="outline" size="icon" aria-label="Manage project">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4" /> Edit project
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>
                <span className="flex items-center gap-1.5">
                  <ArrowLeftRight className="h-3.5 w-3.5" /> Change status
                </span>
              </DropdownMenuLabel>
              {(Object.keys(ProjectStatusEnum.map) as ProjectStatus[]).map((s) => (
                <DropdownMenuItem
                  key={s}
                  onClick={() => {
                    if (s !== summary.status) pd.updateProject.mutate({ status: s });
                  }}
                >
                  <span className="flex w-4 justify-center">
                    {s === summary.status && <Check className="h-4 w-4 text-primary" />}
                  </span>
                  {ProjectStatusEnum.label(s)}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive onClick={() => setDeleteOpen(true)}>
                <Trash2 className="h-4 w-4" /> Archive project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs text-foreground-muted">
            <span>Progress</span>
            <span className="font-medium text-foreground">{Math.round(summary.progress ?? 0)}%</span>
          </div>
          <ProgressBar value={summary.progress} color={summary.color} />
        </div>
      </Card>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as ProjectTab)}>
        <TabsList className="flex-wrap">
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab summary={summary} milestones={detail.milestones ?? []} pd={pd} />
        </TabsContent>
        <TabsContent value="team">
          <TeamTab projectId={id} members={detail.members ?? []} pd={pd} />
        </TabsContent>
        <TabsContent value="tasks">
          <TasksTab members={detail.members ?? []} milestones={detail.milestones ?? []} pd={pd} />
        </TabsContent>
        <TabsContent value="activity">
          <ActivityTab pd={pd} />
        </TabsContent>
        <TabsContent value="analytics">
          <AnalyticsTab summary={summary} pd={pd} />
        </TabsContent>
      </Tabs>

      {/* Edit sheet */}
      <ProjectFormSheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        project={summary}
        isPending={pd.updateProject.isPending}
        onSubmit={(body) => pd.updateProject.mutate(body, { onSuccess: () => setEditOpen(false) })}
      />

      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => pd.removeProject.mutate(undefined, { onSettled: () => setDeleteOpen(false) })}
        title="Archive project?"
        description="This project will be archived and hidden from active lists."
        confirmLabel="Archive"
        variant="destructive"
        isLoading={pd.removeProject.isPending}
      />
    </div>
  );
}

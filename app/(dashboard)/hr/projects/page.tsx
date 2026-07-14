"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, FolderKanban, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarGroup } from "@/components/ui/avatar";
import { FilterTabs } from "@/components/ui/filter-tabs";
import { PageHeader } from "@/components/shared/page-header";
import { QueryState } from "@/components/shared/query-state";
import { SkeletonCard } from "@/components/ui/skeleton";
import { getInitials } from "@/lib/format";
import { useProjects } from "./use-projects";
import { ProjectFormSheet } from "./_components/project-form-sheet";
import {
  PROJECT_FILTERS,
  ProgressBar,
  ProjectPriorityBadge,
  ProjectStatusBadge,
  ProjectStatusEnum,
} from "./_components/project-meta";
import type { ProjectSummary } from "@/lib/api/projects-mgmt";

export default function HRProjectsPage() {
  const router = useRouter();
  const { search, setSearch, status, setStatus, page, setPage, items, counts, pagination, query, create } =
    useProjects();
  const [formOpen, setFormOpen] = React.useState(false);

  const tabs = PROJECT_FILTERS.map((value) => ({
    value,
    label: value === "all" ? "All" : ProjectStatusEnum.label(value),
    count: value === "all" ? undefined : counts[value],
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Manage projects, teams, tasks and milestones"
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" /> New Project
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          icon={<Search className="h-4 w-4" />}
          placeholder="Search projects…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <FilterTabs tabs={tabs} value={status} onChange={setStatus} />
      </div>

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        data={items}
        onRetry={() => query.refetch()}
        skeleton={
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        }
        emptyIcon={FolderKanban}
        emptyTitle="No projects yet"
        emptyDescription="Create your first project to start tracking work."
        emptyAction={{ label: "New Project", onClick: () => setFormOpen(true) }}
      >
        {(list) => (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {list.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => router.push(`/hr/projects/${project.id}`)}
              />
            ))}
          </div>
        )}
      </QueryState>

      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between text-sm text-foreground-muted">
          <span>
            Page {pagination.current_page} of {pagination.total_pages}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.total_pages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <ProjectFormSheet
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={(body) =>
          create.mutate(body, {
            onSuccess: () => setFormOpen(false),
          })
        }
        isPending={create.isPending}
      />
    </div>
  );
}

function ProjectCard({
  project,
  onClick,
}: {
  project: ProjectSummary;
  onClick: () => void;
}) {
  const previews = project.members_preview ?? [];
  return (
    <Card hover className="flex cursor-pointer flex-col gap-4 p-5" onClick={onClick}>
      <div className="flex items-start gap-3">
        <span
          className="mt-1 h-8 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: project.color || "hsl(var(--primary))" }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold text-foreground">{project.name}</h3>
          </div>
          <p className="text-xs font-medium uppercase tracking-wide text-foreground-subtle">
            {project.code}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <ProjectStatusBadge status={project.status} />
        <ProjectPriorityBadge priority={project.priority} />
      </div>

      {project.client_name && (
        <p className="text-sm text-foreground-muted">
          Client: <span className="text-foreground">{project.client_name}</span>
        </p>
      )}

      <div>
        <div className="mb-1.5 flex items-center justify-between text-xs text-foreground-muted">
          <span>Progress</span>
          <span className="font-medium text-foreground">{Math.round(project.progress ?? 0)}%</span>
        </div>
        <ProgressBar value={project.progress} color={project.color} />
      </div>

      <div className="flex items-center justify-between border-t border-border pt-3">
        {previews.length > 0 ? (
          <AvatarGroup max={4} size="sm">
            {previews.map((m, i) => (
              <Avatar key={m.id ?? i} name={m.full_name || m.name || getInitials(m.name)} src={m.avatar ?? undefined} />
            ))}
          </AvatarGroup>
        ) : (
          <span className="flex items-center gap-1.5 text-xs text-foreground-muted">
            <Users className="h-3.5 w-3.5" /> No members
          </span>
        )}
        <span className="text-xs text-foreground-muted">
          {project.member_count ?? previews.length} member
          {(project.member_count ?? previews.length) === 1 ? "" : "s"}
        </span>
      </div>
    </Card>
  );
}

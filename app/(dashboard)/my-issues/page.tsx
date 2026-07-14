"use client";

import { useRouter } from "next/navigation";
import { Plus, Shield, MessageSquare, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FilterTabs } from "@/components/ui/filter-tabs";
import { SkeletonList } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { QueryState } from "@/components/shared/query-state";
import { useEnums, toOptions } from "@/lib/api/enums";
import {
  IssueStatusEnum,
  IssuePriorityEnum,
  ISSUE_CATEGORY_LABELS,
  ISSUE_FILTERS,
} from "@/lib/enums";
import { timeAgo } from "@/lib/format";
import type { IssueModel } from "@/types";
import { useMyIssues } from "./use-my-issues";

export default function MyIssuesPage() {
  const router = useRouter();
  const { status, setStatus, items, counts, pagination, page, setPage, query } =
    useMyIssues();
  const enums = useEnums();

  const categoryLabel = (value: string) => {
    const opts = toOptions(enums.data?.ticket_category, ISSUE_CATEGORY_LABELS);
    return opts.find((o) => o.value === value)?.label ?? ISSUE_CATEGORY_LABELS[value as keyof typeof ISSUE_CATEGORY_LABELS] ?? value;
  };

  const tabs = ISSUE_FILTERS.map((value) => ({
    value,
    label: value === "all" ? "All" : IssueStatusEnum.label(value),
    count: value === "all" ? undefined : counts[value],
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="HR Help"
        description="Raise an issue and chat privately with HR"
        actions={
          <Button onClick={() => router.push("/my-issues/new")}>
            <Plus className="h-4 w-4" /> Raise Issue
          </Button>
        }
      />

      {/* Privacy notice */}
      <div className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-primary/15 bg-primary-muted/30 p-4">
        <div className="rounded-lg bg-primary-muted p-2">
          <Shield className="h-4 w-4 text-primary" />
        </div>
        <p className="text-sm text-foreground-muted">
          Your conversations are private. Only HR can see what you share here.
        </p>
      </div>

      <FilterTabs tabs={tabs} value={status} onChange={setStatus} />

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        data={query.data ? items : undefined}
        onRetry={() => query.refetch()}
        skeleton={<SkeletonList items={4} />}
        emptyIcon={MessageSquare}
        emptyTitle="No issues yet"
        emptyDescription="Raise an issue and HR will get back to you here."
        emptyAction={{ label: "Raise Issue", onClick: () => router.push("/my-issues/new") }}
      >
        {(list) => (
          <div className="space-y-3">
            {list.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                categoryLabel={categoryLabel(issue.category)}
                onClick={() => router.push(`/my-issues/${issue.id}`)}
              />
            ))}
          </div>
        )}
      </QueryState>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-foreground-muted">
          <span>
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function IssueCard({
  issue,
  categoryLabel,
  onClick,
}: {
  issue: IssueModel;
  categoryLabel: string;
  onClick: () => void;
}) {
  return (
    <Card hover className="cursor-pointer p-4" onClick={onClick}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-start justify-between gap-3">
            <h3 className="line-clamp-1 font-medium text-foreground">{issue.title}</h3>
            <Badge variant={IssueStatusEnum.tone(issue.status)} className="shrink-0">
              {IssueStatusEnum.label(issue.status)}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge variant="muted" className="font-normal">
              {categoryLabel}
            </Badge>
            <Badge variant={IssuePriorityEnum.tone(issue.priority)} className="font-normal">
              {IssuePriorityEnum.label(issue.priority)}
            </Badge>
            {issue.created_at && (
              <span className="text-foreground-subtle">· {timeAgo(issue.created_at)}</span>
            )}
          </div>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 self-center text-foreground-subtle" />
      </div>
    </Card>
  );
}

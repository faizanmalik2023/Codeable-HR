"use client";

import { useRouter } from "next/navigation";
import { Shield, MessageSquare, ChevronRight, EyeOff } from "lucide-react";
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
import { useHrIssues } from "./use-hr-issues";

export default function HrIssuesPage() {
  const router = useRouter();
  const { status, setStatus, items, counts, pagination, page, setPage, query } =
    useHrIssues();
  const enums = useEnums();

  const categoryLabel = (value: string) => {
    const opts = toOptions(enums.data?.ticket_category, ISSUE_CATEGORY_LABELS);
    return (
      opts.find((o) => o.value === value)?.label ??
      ISSUE_CATEGORY_LABELS[value as keyof typeof ISSUE_CATEGORY_LABELS] ??
      value
    );
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
        description="Triage and respond to employee issues"
      />

      {/* Confidentiality notice */}
      <div className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-primary/15 bg-primary-muted/30 p-4">
        <div className="rounded-lg bg-primary-muted p-2">
          <Shield className="h-4 w-4 text-primary" />
        </div>
        <p className="text-sm text-foreground-muted">
          Employee conversations are confidential. Handle every issue with care.
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
        emptyTitle="No issues here"
        emptyDescription="Employee issues will appear here for you to triage."
      >
        {(list) => (
          <div className="space-y-3">
            {list.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                categoryLabel={categoryLabel(issue.category)}
                onClick={() => router.push(`/hr/issues/${issue.id}`)}
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
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
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
            {issue.is_anonymous && (
              <Badge variant="outline" className="gap-1 font-normal">
                <EyeOff className="h-3 w-3" /> Anonymous
              </Badge>
            )}
            {issue.created_date && (
              <span className="text-foreground-subtle">· {timeAgo(issue.created_date)}</span>
            )}
          </div>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 self-center text-foreground-subtle" />
      </div>
    </Card>
  );
}

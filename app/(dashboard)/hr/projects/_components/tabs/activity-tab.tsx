"use client";

import { CalendarDays } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { QueryState } from "@/components/shared/query-state";
import { SkeletonList } from "@/components/ui/skeleton";
import { formatOrdinalDate } from "@/lib/format";
import type { useProjectDetail } from "../../[id]/use-project-detail";

interface ActivityTabProps {
  pd: ReturnType<typeof useProjectDetail>;
}

export function ActivityTab({ pd }: ActivityTabProps) {
  const { eods, eodPage, setEodPage } = pd;
  const items = eods.data?.items ?? [];
  const pagination = eods.data?.pagination;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Recent EOD Reports</h3>
      <QueryState
        isLoading={eods.isLoading}
        isError={eods.isError}
        error={eods.error}
        data={items}
        onRetry={() => eods.refetch()}
        skeleton={<SkeletonList items={4} />}
        emptyIcon={CalendarDays}
        emptyTitle="No activity yet"
        emptyDescription="EOD reports logged against this project will appear here."
      >
        {(list) => (
          <div className="space-y-3">
            {list.map((eod) => {
              const name = eod.employee?.full_name || eod.employee?.name || "Team member";
              return (
                <Card key={eod.id} className="flex gap-3 p-4">
                  <Avatar name={name} src={eod.employee?.avatar ?? undefined} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-medium text-foreground">{name}</p>
                      <span className="shrink-0 text-xs text-foreground-muted">
                        {formatOrdinalDate(eod.date)}
                      </span>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-foreground-muted">{eod.summary}</p>
                    {typeof eod.hours === "number" && (
                      <p className="mt-1.5 text-xs font-medium text-foreground-subtle">{eod.hours}h logged</p>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </QueryState>

      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between text-sm text-foreground-muted">
          <span>
            Page {pagination.current_page} of {pagination.total_pages}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={eodPage <= 1} onClick={() => setEodPage(eodPage - 1)}>
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={eodPage >= pagination.total_pages}
              onClick={() => setEodPage(eodPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

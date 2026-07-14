"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FilterTabs } from "@/components/ui/filter-tabs";
import { Sheet } from "@/components/ui/sheet";
import { PageHeader } from "@/components/shared/page-header";
import { QueryState } from "@/components/shared/query-state";
import { SkeletonList } from "@/components/ui/skeleton";
import { EodStatusEnum, EOD_READ_FILTERS } from "@/lib/enums";
import { formatOrdinalDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useTeamMemberEod } from "./use-team-member-eod";
import type { EodReportModel } from "@/types";

const READ_LABELS: Record<string, string> = { all: "All", unread: "Unread", read: "Read" };

export default function TeamMemberEodPage() {
  const params = useParams<{ id: string }>();
  const employeeId = params.id;
  const { query, markRead } = useTeamMemberEod(employeeId);
  const [readFilter, setReadFilter] = React.useState("all");
  const [selected, setSelected] = React.useState<EodReportModel | null>(null);

  const open = (r: EodReportModel) => {
    if (!r.is_read) markRead.mutate(r.id);
    setSelected(r);
  };

  const filterItems = (items: EodReportModel[]) =>
    items.filter((r) =>
      readFilter === "unread" ? !r.is_read : readFilter === "read" ? r.is_read : true
    );

  return (
    <div className="space-y-6">
      <PageHeader title="Team Member EOD" description="Reports from this member" back />

      <FilterTabs
        tabs={EOD_READ_FILTERS.map((v) => ({ value: v, label: READ_LABELS[v] }))}
        value={readFilter}
        onChange={setReadFilter}
      />

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        data={query.data?.items}
        onRetry={() => query.refetch()}
        skeleton={<SkeletonList items={3} />}
        emptyIcon={FileText}
        emptyTitle="No reports found"
      >
        {(items) => {
          const filtered = filterItems(items);
          if (filtered.length === 0)
            return <p className="py-10 text-center text-sm text-foreground-muted">No {readFilter} reports.</p>;
          return (
            <div className="space-y-3">
              {filtered.map((r) => (
                <Card
                  key={r.id}
                  hover
                  className={cn("cursor-pointer p-4", !r.is_read && "border-primary/30 bg-primary-muted/20")}
                  onClick={() => open(r)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{formatOrdinalDate(r.date)}</p>
                        {!r.is_read && <span className="h-2 w-2 rounded-full bg-primary" />}
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-foreground-muted">{r.summary}</p>
                    </div>
                    <Badge variant={EodStatusEnum.tone(r.status)}>{EodStatusEnum.label(r.status)}</Badge>
                  </div>
                </Card>
              ))}
            </div>
          );
        }}
      </QueryState>

      <Sheet open={!!selected} onClose={() => setSelected(null)} title="EOD Report" size="md">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-foreground-muted">{formatOrdinalDate(selected.date)}</p>
              <Badge variant={EodStatusEnum.tone(selected.status)}>{EodStatusEnum.label(selected.status)}</Badge>
            </div>
            <Field label="Summary" value={selected.summary} />
            {selected.blockers && <Field label="Blockers" value={selected.blockers} />}
            {selected.tomorrow_plan && <Field label="Tomorrow's plan" value={selected.tomorrow_plan} />}
            <Field label="Hours" value={`${selected.hours ?? 0}h`} />
          </div>
        )}
      </Sheet>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-foreground-muted">{label}</p>
      <p className="whitespace-pre-wrap text-sm text-foreground">{value}</p>
    </div>
  );
}

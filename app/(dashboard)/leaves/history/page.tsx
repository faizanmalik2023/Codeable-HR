"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, CalendarDays } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FilterTabs } from "@/components/ui/filter-tabs";
import { DataTable, type DataTableColumn } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import {
  LeaveStatusEnum,
  LEAVE_FILTERS,
  LEAVE_TYPE_LABELS,
  LEAVE_DURATION_LABELS,
} from "@/lib/enums";
import { formatDateRange } from "@/lib/format";
import { useLeaveHistory } from "./use-leave-history";
import { LeaveDetailsDialog } from "../leave-details-dialog";
import type { LeaveModel } from "@/types";

function typeLabel(leave: LeaveModel): string {
  return (
    leave.leave_type_name ||
    LEAVE_TYPE_LABELS[leave.leave_type as keyof typeof LEAVE_TYPE_LABELS] ||
    String(leave.leave_type)
  );
}

export default function LeaveHistoryPage() {
  const router = useRouter();
  const { status, setStatus, items, counts, pagination, page, setPage, query } =
    useLeaveHistory();
  const [selected, setSelected] = React.useState<LeaveModel | null>(null);

  const tabs = LEAVE_FILTERS.map((value) => ({
    value,
    label: value === "all" ? "All" : LeaveStatusEnum.label(value),
    count: value === "all" ? undefined : counts[value],
  }));

  const columns: DataTableColumn<LeaveModel>[] = [
    {
      key: "dates",
      header: "Date range",
      render: (r) => (
        <span className="font-medium text-foreground">
          {formatDateRange(r.date_from, r.date_to)}
        </span>
      ),
    },
    { key: "type", header: "Type", render: (r) => typeLabel(r) },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <Badge variant={LeaveStatusEnum.tone(r.status)}>{LeaveStatusEnum.label(r.status)}</Badge>
      ),
    },
    {
      key: "duration",
      header: "Duration",
      render: (r) =>
        r.duration
          ? LEAVE_DURATION_LABELS[r.duration]
          : typeof r.total_days === "number"
            ? `${r.total_days} ${r.total_days === 1 ? "day" : "days"}`
            : "—",
    },
    {
      key: "reason",
      header: "Reason",
      className: "max-w-xs",
      render: (r) => (
        <span className="line-clamp-1 text-foreground-muted">{r.reason || "—"}</span>
      ),
    },
  ];

  const totalItems = pagination?.totalItems ?? items.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave History"
        description="All your leave requests"
        back
        actions={
          <Button onClick={() => router.push("/leaves/apply")}>
            <Plus className="h-4 w-4" /> Apply Leave
          </Button>
        }
      />

      <FilterTabs tabs={tabs} value={status} onChange={setStatus} />

      {!query.isLoading && (
        <p className="text-sm text-foreground-muted">
          {totalItems} {totalItems === 1 ? "request" : "requests"}
        </p>
      )}

      <Card className="p-2">
        <DataTable
          columns={columns}
          data={items}
          rowKey={(r) => r.id}
          onRowClick={(r) => setSelected(r)}
          isLoading={query.isLoading}
          empty={
            <EmptyState
              icon={CalendarDays}
              title="No leave requests"
              description="You have no leave requests in this category."
              action={{ label: "Apply Leave", onClick: () => router.push("/leaves/apply") }}
            />
          }
        />
      </Card>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-foreground-muted">
          <span>
            Page {pagination.currentPage} of {pagination.totalPages}
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
              disabled={page >= pagination.totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <LeaveDetailsDialog
        leave={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

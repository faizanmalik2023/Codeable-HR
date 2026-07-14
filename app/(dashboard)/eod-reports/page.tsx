"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Users, Pencil, Trash2, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FilterTabs } from "@/components/ui/filter-tabs";
import { Sheet, SheetFooter } from "@/components/ui/sheet";
import { ConfirmModal } from "@/components/ui/modal";
import { DataTable, type DataTableColumn } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { EodStatusEnum, EOD_FILTERS } from "@/lib/enums";
import { formatOrdinalDate } from "@/lib/format";
import { isManagerUser, useAuthStore } from "@/stores/auth-store";
import { useEodReports } from "./use-eod-reports";
import type { EodReportModel } from "@/types";

export default function EodReportsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isManager = isManagerUser(user);
  const { status, setStatus, items, counts, pagination, page, setPage, query, remove, forbidden } =
    useEodReports();
  const [selected, setSelected] = React.useState<EodReportModel | null>(null);
  const [toDelete, setToDelete] = React.useState<EodReportModel | null>(null);

  const tabs = EOD_FILTERS.map((value) => ({
    value,
    label: value === "all" ? "All" : EodStatusEnum.label(value),
    count: value === "all" ? undefined : counts[value],
  }));

  const columns: DataTableColumn<EodReportModel>[] = [
    {
      key: "date",
      header: "Date",
      render: (r) => <span className="font-medium text-foreground">{formatOrdinalDate(r.date)}</span>,
    },
    { key: "project", header: "Project", render: (r) => r.project_name ?? "—" },
    {
      key: "summary",
      header: "Summary",
      className: "max-w-xs",
      render: (r) => <span className="line-clamp-1 text-foreground-muted">{r.summary}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <Badge variant={EodStatusEnum.tone(r.status)}>{EodStatusEnum.label(r.status)}</Badge>,
    },
    { key: "hours", header: "Hours", align: "right", render: (r) => `${r.hours ?? 0}h` },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (r) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          {r.can_edit && (
            <Button variant="ghost" size="icon-sm" onClick={() => router.push(`/eod-reports/submit?id=${r.id}`)} aria-label="Edit">
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {r.can_delete && (
            <Button variant="ghost" size="icon-sm" onClick={() => setToDelete(r)} aria-label="Delete">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  // Admins (and any role the backend forbids from personal EODs) review by team.
  if (forbidden) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="EOD Reports"
          description="Review end-of-day reports by team member"
          actions={
            <Button onClick={() => router.push("/eod-reports/team")}>
              <Users className="h-4 w-4" /> Team EODs
            </Button>
          }
        />
        <EmptyState
          icon={Users}
          title="Reviewed by team"
          description="Your role reviews end-of-day reports per team member rather than keeping a personal log."
          action={{ label: "View Team EODs", onClick: () => router.push("/eod-reports/team") }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="EOD Reports"
        description="Your end-of-day reports"
        actions={
          <div className="flex items-center gap-2">
            {isManager && (
              <Button variant="outline" onClick={() => router.push("/eod-reports/team")}>
                <Users className="h-4 w-4" /> Team
              </Button>
            )}
            <Button onClick={() => router.push("/eod-reports/submit")}>
              <Plus className="h-4 w-4" /> Submit EOD
            </Button>
          </div>
        }
      />

      <FilterTabs tabs={tabs} value={status} onChange={setStatus} />

      <Card className="p-2">
        <DataTable
          columns={columns}
          data={items}
          rowKey={(r) => r.id}
          onRowClick={(r) => setSelected(r)}
          isLoading={query.isLoading}
          empty={
            <EmptyState
              icon={FileText}
              title="No reports yet"
              description="Submit your first end-of-day report."
              action={{ label: "Submit EOD", onClick: () => router.push("/eod-reports/submit") }}
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

      {/* Detail drawer */}
      <Sheet open={!!selected} onClose={() => setSelected(null)} title="EOD Report" size="md">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground-muted">{formatOrdinalDate(selected.date)}</p>
                {selected.project_name && (
                  <p className="font-medium text-foreground">{selected.project_name}</p>
                )}
              </div>
              <Badge variant={EodStatusEnum.tone(selected.status)}>{EodStatusEnum.label(selected.status)}</Badge>
            </div>
            <DetailField label="Summary" value={selected.summary} />
            {selected.blockers && <DetailField label="Blockers" value={selected.blockers} />}
            {selected.tomorrow_plan && <DetailField label="Tomorrow's plan" value={selected.tomorrow_plan} />}
            <DetailField label="Hours" value={`${selected.hours ?? 0}h`} />
          </div>
        )}
        {selected?.can_edit && (
          <SheetFooter>
            <Button
              variant="outline"
              onClick={() => {
                router.push(`/eod-reports/submit?id=${selected.id}`);
                setSelected(null);
              }}
            >
              <Pencil className="h-4 w-4" /> Edit
            </Button>
          </SheetFooter>
        )}
      </Sheet>

      <ConfirmModal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) remove.mutate(toDelete.id, { onSettled: () => setToDelete(null) });
        }}
        title="Delete report?"
        description="This EOD report will be permanently removed."
        confirmLabel="Delete"
        variant="destructive"
        isLoading={remove.isPending}
      />
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-foreground-muted">{label}</p>
      <p className="whitespace-pre-wrap text-sm text-foreground">{value}</p>
    </div>
  );
}

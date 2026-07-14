"use client";

import * as React from "react";
import { CalendarDays, Check, X, Info, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { FilterTabs } from "@/components/ui/filter-tabs";
import { Modal, ConfirmModal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DataTable, type DataTableColumn } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { LeaveStatusEnum, LEAVE_FILTERS, LEAVE_TYPE_LABELS } from "@/lib/enums";
import { formatDateRange } from "@/lib/format";
import { useLeaveRequests } from "./use-leave-requests";
import { LeaveDetailsDialog } from "../../leaves/leave-details-dialog";
import type { LeaveModel } from "@/types";

const DEFAULT_REJECTION = "Leave request rejected by HR";

function typeLabel(leave: LeaveModel): string {
  return (
    leave.leave_type_name ||
    LEAVE_TYPE_LABELS[leave.leave_type as keyof typeof LEAVE_TYPE_LABELS] ||
    String(leave.leave_type)
  );
}

export default function HrLeaveRequestsPage() {
  const {
    status,
    setStatus,
    page,
    setPage,
    items,
    counts,
    pagination,
    query,
    onLeaveToday,
    decide,
  } = useLeaveRequests();

  const [selected, setSelected] = React.useState<LeaveModel | null>(null);
  const [confirmApprove, setConfirmApprove] = React.useState(false);
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState(DEFAULT_REJECTION);

  const tabs = LEAVE_FILTERS.map((value) => ({
    value,
    label: value === "all" ? "All" : LeaveStatusEnum.label(value),
    count: value === "all" ? undefined : counts[value],
  }));

  const closeDialog = () => setSelected(null);

  const onApprove = () => {
    if (!selected) return;
    decide.mutate(
      { id: selected.id, body: { decision: "approve" } },
      {
        onSuccess: () => {
          setConfirmApprove(false);
          closeDialog();
        },
        onError: () => setConfirmApprove(false),
      }
    );
  };

  const onReject = () => {
    if (!selected) return;
    decide.mutate(
      {
        id: selected.id,
        body: { decision: "reject", rejection_reason: rejectReason.trim() || DEFAULT_REJECTION },
      },
      {
        onSuccess: () => {
          setRejectOpen(false);
          closeDialog();
        },
        onError: () => setRejectOpen(false),
      }
    );
  };

  const columns: DataTableColumn<LeaveModel>[] = [
    {
      key: "employee",
      header: "Employee",
      render: (r) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={r.employee?.full_name} src={r.employee?.avatar ?? undefined} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">
              {r.employee?.full_name ?? "—"}
            </p>
            {r.employee?.department && (
              <p className="truncate text-xs text-foreground-muted">{r.employee.department}</p>
            )}
          </div>
        </div>
      ),
    },
    { key: "type", header: "Type", render: (r) => typeLabel(r) },
    {
      key: "dates",
      header: "Date range",
      render: (r) => (
        <span className="text-foreground-muted">{formatDateRange(r.date_from, r.date_to)}</span>
      ),
    },
    {
      key: "days",
      header: "Days",
      align: "right",
      render: (r) =>
        typeof r.total_days === "number"
          ? `${r.total_days} ${r.total_days === 1 ? "day" : "days"}`
          : "—",
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <Badge variant={LeaveStatusEnum.tone(r.status)}>{LeaveStatusEnum.label(r.status)}</Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Leave Requests" description="Review and action company-wide leave" />

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-primary/15 bg-primary-muted/40 p-4">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <p className="text-sm text-foreground-muted">
          Pending requests await your decision. Approving or rejecting notifies the employee
          instantly.
        </p>
      </div>

      {/* On leave today */}
      {onLeaveToday.length > 0 && (
        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-foreground-muted" />
            <p className="text-sm font-semibold text-foreground">On Leave Today</p>
            <Badge variant="muted">{onLeaveToday.length}</Badge>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {onLeaveToday.map((leave) => (
              <div
                key={leave.id}
                className="flex w-56 shrink-0 items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-secondary/30 p-3"
              >
                <Avatar
                  name={leave.employee?.full_name}
                  src={leave.employee?.avatar ?? undefined}
                  size="sm"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {leave.employee?.full_name ?? "—"}
                  </p>
                  <p className="truncate text-xs text-foreground-muted">
                    {typeLabel(leave)} · {formatDateRange(leave.date_from, leave.date_to)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <FilterTabs tabs={tabs} value={status} onChange={setStatus} />

      <p className="text-sm text-foreground-muted">
        {items.length} {items.length === 1 ? "request" : "requests"}
        {status !== "all" ? ` · ${LeaveStatusEnum.label(status)}` : ""}
      </p>

      <Card className="p-2">
        <DataTable
          columns={columns}
          data={items}
          rowKey={(r) => r.id}
          onRowClick={(r) => setSelected(r)}
          isLoading={query.isLoading && !query.data}
          empty={
            <EmptyState
              icon={CalendarDays}
              title="No leave requests"
              description="No requests match this filter."
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

      {/* Detail drawer — approve/reject only when pending */}
      <LeaveDetailsDialog
        leave={selected}
        open={!!selected}
        onClose={closeDialog}
        showEmployee
        footer={
          selected?.status === "pending" ? (
            <>
              <Button
                variant="destructive"
                onClick={() => {
                  setRejectReason(DEFAULT_REJECTION);
                  setRejectOpen(true);
                }}
              >
                <X className="h-4 w-4" /> Reject
              </Button>
              <Button variant="success" onClick={() => setConfirmApprove(true)}>
                <Check className="h-4 w-4" /> Approve
              </Button>
            </>
          ) : undefined
        }
      />

      {/* Approve confirmation */}
      <ConfirmModal
        open={confirmApprove}
        onClose={() => setConfirmApprove(false)}
        onConfirm={onApprove}
        title="Approve leave request?"
        description="The employee will be notified that their leave has been approved."
        confirmLabel="Approve"
        isLoading={decide.isPending}
      />

      {/* Reject reason modal */}
      <Modal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Reject leave request"
        description="Let the employee know why their request was declined."
      >
        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">Reason</Label>
            <Textarea
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setRejectOpen(false)} disabled={decide.isPending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={onReject} isLoading={decide.isPending}>
              Reject Request
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

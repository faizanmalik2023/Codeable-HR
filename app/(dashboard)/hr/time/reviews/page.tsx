"use client";

import * as React from "react";
import { ClipboardCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Modal, ConfirmModal } from "@/components/ui/modal";
import { FilterTabs } from "@/components/ui/filter-tabs";
import { SkeletonList } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { QueryState } from "@/components/shared/query-state";
import { formatOrdinalDate } from "@/lib/format";
import { formatTime } from "@/lib/utils";
import type { AttendanceReviewModel } from "@/lib/api/hr-attendance";
import { useAttendanceReviews } from "./use-attendance-reviews";

const TABS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];

const REASON_LABEL: Record<string, string> = {
  overtime: "Overtime",
  backdated_checkout: "Backdated checkout",
  checkout_conflict: "Checkout conflict",
};

const hm = (h?: { hours: number; minutes: number }) =>
  h ? `${h.hours}h ${String(h.minutes).padStart(2, "0")}m` : "—";

export default function AttendanceReviewsPage() {
  const { status, setStatus, page, setPage, items, pagination, query, decide } =
    useAttendanceReviews();

  const [approving, setApproving] = React.useState<AttendanceReviewModel | null>(null);
  const [rejecting, setRejecting] = React.useState<AttendanceReviewModel | null>(null);
  const [note, setNote] = React.useState("");

  const onApprove = () => {
    if (!approving) return;
    decide.mutate(
      { id: approving.id, decision: "approve" },
      { onSuccess: () => setApproving(null) }
    );
  };

  const onReject = () => {
    if (!rejecting) return;
    decide.mutate(
      { id: rejecting.id, decision: "reject", note: note.trim() || undefined },
      {
        onSuccess: () => {
          setRejecting(null);
          setNote("");
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        back
        title="Attendance Reviews"
        description="Overtime and checkout corrections awaiting a decision"
      />

      <FilterTabs tabs={TABS} value={status} onChange={setStatus} />

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        data={query.data}
        onRetry={() => query.refetch()}
        isEmpty={(d) => (d.items?.length ?? 0) === 0}
        skeleton={<SkeletonList items={4} />}
        emptyIcon={ClipboardCheck}
        emptyTitle="Nothing to review"
        emptyDescription={
          status === "pending"
            ? "No attendance days are waiting on a decision."
            : "No reviews match this filter."
        }
      >
        {() => (
          <div className="space-y-3">
            {items.map((r) => (
              <ReviewCard
                key={r.id}
                r={r}
                onApprove={() => setApproving(r)}
                onReject={() => setRejecting(r)}
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

      <ConfirmModal
        open={Boolean(approving)}
        onClose={() => setApproving(null)}
        onConfirm={onApprove}
        title="Approve these hours?"
        description="The recorded time stands and the employee is notified."
        confirmLabel="Approve"
        isLoading={decide.isPending}
      />

      <Modal
        open={Boolean(rejecting)}
        onClose={() => setRejecting(null)}
        title="Cap this day at shift hours?"
        description="The day is capped at the employee's shift length and they're notified."
      >
        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">Note (optional)</Label>
            <Textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Why the extra time isn't counted"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setRejecting(null)} disabled={decide.isPending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={onReject} isLoading={decide.isPending}>
              Cap at shift hours
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ReviewCard({
  r,
  onApprove,
  onReject,
}: {
  r: AttendanceReviewModel;
  onApprove: () => void;
  onReject: () => void;
}) {
  const name = r.employee?.full_name ?? r.employee?.name ?? "Employee";
  const pending = (r.status ?? "pending") === "pending";
  const machineDisagrees =
    r.recorded_check_out_time && r.check_out_time !== r.recorded_check_out_time;

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start gap-3">
        <Avatar name={name} src={r.employee?.avatar ?? undefined} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-foreground">{name}</p>
            {r.employee?.employee_code && (
              <span className="text-xs text-foreground-subtle">{r.employee.employee_code}</span>
            )}
            {(r.reasons ?? []).map((reason) => (
              <Badge key={reason} variant="warning">
                {REASON_LABEL[reason] ?? reason}
              </Badge>
            ))}
            {!pending && (
              <Badge variant={r.status === "approved" ? "success" : "destructive"}>
                {r.status}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-foreground-muted">
            {r.date ? formatOrdinalDate(r.date) : "—"} · worked {hm(r.hours_worked)}
            {typeof r.shift_hours === "number" && ` of a ${r.shift_hours}h shift`}
          </p>
          <p className="mt-0.5 text-xs text-foreground-subtle">
            In {r.check_in_time ? formatTime(r.check_in_time) : "—"} · out{" "}
            {r.check_out_time ? formatTime(r.check_out_time) : "—"}
            {machineDisagrees && ` (machine recorded ${formatTime(r.recorded_check_out_time!)})`}
            {r.unclosed && " · day never closed"}
          </p>
          {r.adjustment?.requested_out && (
            <p className="mt-0.5 text-xs text-foreground-subtle">
              Proposed checkout {formatTime(r.adjustment.requested_out)}
              {r.adjustment.note && ` — “${r.adjustment.note}”`}
            </p>
          )}
          {!pending && r.review_note && (
            <p className="mt-0.5 text-xs text-foreground-subtle">Note: {r.review_note}</p>
          )}
        </div>
        {pending && (
          <div className="flex shrink-0 gap-2">
            <Button size="sm" variant="outline" onClick={onReject}>
              Reject
            </Button>
            <Button size="sm" onClick={onApprove}>
              Approve
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

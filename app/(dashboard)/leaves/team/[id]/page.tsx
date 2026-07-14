"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { CalendarDays, Check, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { FilterTabs } from "@/components/ui/filter-tabs";
import { Modal, ConfirmModal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/page-header";
import { QueryState } from "@/components/shared/query-state";
import { SkeletonList } from "@/components/ui/skeleton";
import {
  LeaveStatusEnum,
  LEAVE_FILTERS,
  LEAVE_TYPE_LABELS,
} from "@/lib/enums";
import { formatDateRange } from "@/lib/format";
import { useTeamMemberLeaves } from "./use-team-member-leaves";
import { LeaveDetailsDialog } from "../../leave-details-dialog";
import type { LeaveModel } from "@/types";

const DEFAULT_REJECTION = "Leave request rejected";

function typeLabel(leave: LeaveModel): string {
  return (
    leave.leave_type_name ||
    LEAVE_TYPE_LABELS[leave.leave_type as keyof typeof LEAVE_TYPE_LABELS] ||
    String(leave.leave_type)
  );
}

export default function TeamMemberLeavesPage() {
  const params = useParams<{ id: string }>();
  const employeeId = params.id;
  const { query, decide } = useTeamMemberLeaves(employeeId);

  const [statusFilter, setStatusFilter] = React.useState("all");
  const [selected, setSelected] = React.useState<LeaveModel | null>(null);
  const [confirmApprove, setConfirmApprove] = React.useState(false);
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState(DEFAULT_REJECTION);

  const items = query.data?.items ?? [];
  const member = items.find((i) => i.employee?.full_name)?.employee;
  const filtered =
    statusFilter === "all" ? items : items.filter((i) => i.status === statusFilter);

  const counts = React.useMemo(() => {
    const c: Record<string, number> = { pending: 0, approved: 0, rejected: 0 };
    for (const i of items) c[i.status] = (c[i.status] ?? 0) + 1;
    return c;
  }, [items]);

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

  return (
    <div className="space-y-6">
      <PageHeader title="Team Member Leaves" description="Review leave requests" back />

      {/* Member header */}
      {member && (
        <Card className="flex items-center gap-3 p-4">
          <Avatar name={member.full_name} src={member.avatar ?? undefined} size="lg" />
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-foreground">{member.full_name}</p>
            {member.designation && (
              <p className="truncate text-sm text-foreground-muted">{member.designation}</p>
            )}
          </div>
        </Card>
      )}

      <FilterTabs tabs={tabs} value={statusFilter} onChange={setStatusFilter} />

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        data={query.data?.items}
        onRetry={() => query.refetch()}
        skeleton={<SkeletonList items={4} />}
        emptyIcon={CalendarDays}
        emptyTitle="No leave requests"
        emptyDescription="This member hasn't requested any leave yet."
      >
        {() => {
          if (filtered.length === 0)
            return (
              <p className="py-10 text-center text-sm text-foreground-muted">
                No {statusFilter} requests.
              </p>
            );
          return (
            <div className="space-y-3">
              {filtered.map((leave) => (
                <Card
                  key={leave.id}
                  hover
                  className="flex cursor-pointer items-center justify-between gap-3 p-4"
                  onClick={() => setSelected(leave)}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                      <CalendarDays className="h-5 w-5 text-foreground-muted" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {formatDateRange(leave.date_from, leave.date_to)}
                      </p>
                      <p className="truncate text-xs text-foreground-muted">
                        {typeLabel(leave)}
                        {typeof leave.total_days === "number" && (
                          <> · {leave.total_days} {leave.total_days === 1 ? "day" : "days"}</>
                        )}
                      </p>
                    </div>
                  </div>
                  <Badge variant={LeaveStatusEnum.tone(leave.status)}>
                    {LeaveStatusEnum.label(leave.status)}
                  </Badge>
                </Card>
              ))}
            </div>
          );
        }}
      </QueryState>

      {/* Details dialog — actions only when pending */}
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

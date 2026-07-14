"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Sheet } from "@/components/ui/sheet";
import { LeaveStatusEnum, LEAVE_TYPE_LABELS, HALF_DAY_LABELS } from "@/lib/enums";
import { formatDateRange, formatOrdinalDate } from "@/lib/format";
import type { LeaveModel } from "@/types";

interface LeaveDetailsDialogProps {
  leave: LeaveModel | null;
  open: boolean;
  onClose: () => void;
  /** Optional actions rendered in a sticky footer (e.g. approve/reject). */
  footer?: React.ReactNode;
  /** Show the applicant's name (manager views). */
  showEmployee?: boolean;
}

function typeLabel(leave: LeaveModel): string {
  return (
    leave.leave_type_name ||
    LEAVE_TYPE_LABELS[leave.leave_type as keyof typeof LEAVE_TYPE_LABELS] ||
    String(leave.leave_type)
  );
}

/** Read-only leave details drawer, reused across employee + manager screens. */
export function LeaveDetailsDialog({
  leave,
  open,
  onClose,
  footer,
  showEmployee,
}: LeaveDetailsDialogProps) {
  return (
    <Sheet open={open} onClose={onClose} title="Leave Details" size="md">
      {leave && (
        <div className="flex h-full flex-col">
          <div className="flex-1 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-lg font-semibold text-foreground">{typeLabel(leave)}</p>
                <p className="mt-0.5 text-sm text-foreground-muted">
                  {formatDateRange(leave.date_from, leave.date_to)}
                </p>
              </div>
              <Badge variant={LeaveStatusEnum.tone(leave.status)}>
                {LeaveStatusEnum.label(leave.status)}
              </Badge>
            </div>

            {showEmployee && leave.employee?.full_name && (
              <Field label="Applicant" value={leave.employee.full_name} />
            )}

            <div className="grid grid-cols-2 gap-4">
              {typeof leave.total_days === "number" && (
                <Field
                  label="Total days"
                  value={`${leave.total_days} ${leave.total_days === 1 ? "day" : "days"}`}
                />
              )}
              {leave.half_day && (
                <Field label="Half day" value={HALF_DAY_LABELS[leave.half_day]} />
              )}
              {typeof leave.paid_days === "number" && (
                <Field
                  label="Paid days"
                  value={`${leave.paid_days} ${leave.paid_days === 1 ? "day" : "days"}`}
                />
              )}
              {typeof leave.unpaid_days === "number" && leave.unpaid_days > 0 && (
                <Field
                  label="Unpaid days"
                  value={`${leave.unpaid_days} ${leave.unpaid_days === 1 ? "day" : "days"}`}
                />
              )}
            </div>

            {leave.reason && <Field label="Reason" value={leave.reason} />}
            {leave.applied_date && (
              <Field label="Applied on" value={formatOrdinalDate(leave.applied_date)} />
            )}

            {(leave.approver?.full_name || leave.response_date || leave.response_note) && (
              <div className="rounded-[var(--radius-lg)] border border-border bg-secondary/30 p-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-foreground-muted">
                  {leave.status === "rejected" ? "Rejection details" : "Approval details"}
                </p>
                {leave.approver?.full_name && (
                  <p className="text-sm text-foreground">
                    {leave.status === "rejected" ? "Rejected" : "Approved"} by{" "}
                    <span className="font-medium">{leave.approver.full_name}</span>
                  </p>
                )}
                {leave.response_date && (
                  <p className="mt-0.5 text-xs text-foreground-muted">
                    {formatOrdinalDate(leave.response_date)}
                  </p>
                )}
                {leave.response_note && (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-foreground-muted">
                    {leave.response_note}
                  </p>
                )}
              </div>
            )}
          </div>

          {footer && (
            <div className="mt-6 flex items-center justify-end gap-3 border-t border-border pt-4">
              {footer}
            </div>
          )}
        </div>
      )}
    </Sheet>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-foreground-muted">
        {label}
      </p>
      <p className="whitespace-pre-wrap text-sm text-foreground">{value}</p>
    </div>
  );
}

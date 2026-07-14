"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, ReceiptText, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { FilterTabs } from "@/components/ui/filter-tabs";
import { Sheet, SheetFooter } from "@/components/ui/sheet";
import { Modal } from "@/components/ui/modal";
import { DataTable, type DataTableColumn } from "@/components/ui/table";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import {
  ExpenseStatusEnum,
  EXPENSE_FILTERS,
  EXPENSE_CATEGORY_LABELS,
  type ExpenseCategory,
} from "@/lib/enums";
import { formatMoney, formatOrdinalDate } from "@/lib/format";
import { useExpenseClaims } from "./use-expense-claims";
import type { ExpenseClaimModel } from "@/types";

const categoryLabel = (r: ExpenseClaimModel) =>
  r.category_display ?? EXPENSE_CATEGORY_LABELS[r.category as ExpenseCategory] ?? r.category;

export default function ExpenseClaimsPage() {
  const router = useRouter();
  const { isReviewer, status, setStatus, items, counts, pagination, page, setPage, query, decide } =
    useExpenseClaims();
  const [selected, setSelected] = React.useState<ExpenseClaimModel | null>(null);
  const [rejecting, setRejecting] = React.useState(false);
  const [reason, setReason] = React.useState("");

  const tabs = EXPENSE_FILTERS.map((value) => ({
    value,
    label: value === "all" ? "All" : ExpenseStatusEnum.label(value),
    count: value === "all" ? undefined : counts[value],
  }));

  const columns: DataTableColumn<ExpenseClaimModel>[] = [
    ...(isReviewer
      ? [
          {
            key: "employee",
            header: "Employee",
            render: (r: ExpenseClaimModel) => (
              <div className="flex items-center gap-2">
                <Avatar name={r.employee?.full_name ?? r.employee?.name} size="xs" />
                <span className="font-medium text-foreground">
                  {r.employee?.full_name ?? r.employee?.name ?? "—"}
                </span>
              </div>
            ),
          } as DataTableColumn<ExpenseClaimModel>,
        ]
      : []),
    {
      key: "date",
      header: "Date",
      render: (r) => (
        <span className="font-medium text-foreground">
          {formatOrdinalDate(r.date ?? r.applied_date)}
        </span>
      ),
    },
    { key: "category", header: "Category", render: (r) => categoryLabel(r) },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      render: (r) => <span className="font-medium text-foreground">{formatMoney(r.amount)}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <Badge variant={ExpenseStatusEnum.tone(r.status)}>{ExpenseStatusEnum.label(r.status)}</Badge>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expense Claims"
        description={
          isReviewer
            ? "Review and decide employee expense claims"
            : "Submit and track your reimbursable expenses"
        }
        actions={
          <Button onClick={() => router.push("/expense-claims/submit")}>
            <Plus className="h-4 w-4" /> New Expense
          </Button>
        }
      />

      <FilterTabs tabs={tabs} value={status} onChange={setStatus} />

      {query.isError && items.length === 0 ? (
        <ErrorState
          message={query.error instanceof Error ? query.error.message : undefined}
          onRetry={() => query.refetch()}
        />
      ) : (
        <Card className="p-2">
          <DataTable
            columns={columns}
            data={items}
            rowKey={(r) => r.id}
            onRowClick={(r) => setSelected(r)}
            isLoading={query.isLoading}
            empty={
              <EmptyState
                icon={ReceiptText}
                title="No expenses yet"
                description="Submit your first expense claim to get reimbursed."
                action={{ label: "New Expense", onClick: () => router.push("/expense-claims/submit") }}
              />
            }
          />
        </Card>
      )}

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

      {/* Read-only detail drawer */}
      <Sheet open={!!selected} onClose={() => setSelected(null)} title="Expense Claim" size="md">
        {selected && (
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-foreground-muted">
                  {formatOrdinalDate(selected.date ?? selected.applied_date)}
                </p>
                <p className="mt-0.5 text-2xl font-bold text-foreground">{formatMoney(selected.amount)}</p>
              </div>
              <Badge variant={ExpenseStatusEnum.tone(selected.status)}>{ExpenseStatusEnum.label(selected.status)}</Badge>
            </div>

            {isReviewer && selected.employee && (
              <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/40 p-3">
                <Avatar name={selected.employee.full_name ?? selected.employee.name} size="sm" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {selected.employee.full_name ?? selected.employee.name}
                  </p>
                  {selected.employee.employee_code && (
                    <p className="text-xs text-foreground-muted">{selected.employee.employee_code}</p>
                  )}
                </div>
              </div>
            )}

            <DetailField label="Category" value={categoryLabel(selected)} />
            {selected.description && <DetailField label="Description" value={selected.description} />}

            {selected.attachments && selected.attachments.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-foreground-muted">
                  Receipts
                </p>
                <div className="space-y-2">
                  {selected.attachments.map((a, i) => (
                    <a
                      key={a.key ?? a.url ?? i}
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-secondary"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span className="truncate">{a.name ?? "View receipt"}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {selected.response_note && (
              <div className="rounded-xl border border-border bg-secondary/40 p-4">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-foreground-muted">
                  Reviewer response
                </p>
                <p className="whitespace-pre-wrap text-sm text-foreground">{selected.response_note}</p>
                {selected.response_date && (
                  <p className="mt-2 text-xs text-foreground-subtle">
                    {formatOrdinalDate(selected.response_date)}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
        {isReviewer && selected?.status === "pending" && (
          <SheetFooter>
            <Button variant="outline" onClick={() => setRejecting(true)}>
              Reject
            </Button>
            <Button
              variant="success"
              isLoading={decide.isPending}
              onClick={() =>
                decide.mutate(
                  { id: selected.id, body: { decision: "approve" } },
                  { onSuccess: () => setSelected(null) }
                )
              }
            >
              Approve
            </Button>
          </SheetFooter>
        )}
      </Sheet>

      {/* Reject reason */}
      <Modal open={rejecting} onClose={() => setRejecting(false)} title="Reject expense" size="sm">
        <Textarea
          rows={4}
          placeholder="Reason for rejection"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setRejecting(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            isLoading={decide.isPending}
            onClick={() => {
              if (!selected) return;
              decide.mutate(
                { id: selected.id, body: { decision: "reject", rejection_reason: reason || undefined } },
                {
                  onSuccess: () => {
                    setRejecting(false);
                    setReason("");
                    setSelected(null);
                  },
                }
              );
            }}
          >
            Reject expense
          </Button>
        </div>
      </Modal>
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

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Banknote, Repeat } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { FilterTabs } from "@/components/ui/filter-tabs";
import { DataTable, type DataTableColumn } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { QueryState } from "@/components/shared/query-state";
import { SkeletonList } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/format";
import {
  LOAN_FILTERS,
  LOAN_STATUS_LABELS,
  LOAN_STATUS_TONE,
  estInstallments,
  type Loan,
  type LoanStatus,
} from "@/lib/api/admin-loans";
import { useLoans } from "./use-loans";

export default function AdminLoansPage() {
  const router = useRouter();
  const { status, setStatus, page, setPage, query, items, counts, pagination } =
    useLoans();

  const tabs = LOAN_FILTERS.map((value) => ({
    value,
    label: value === "all" ? "All" : LOAN_STATUS_LABELS[value as LoanStatus],
    count: value === "all" ? undefined : counts[value],
  }));

  const deductionLabel = (loan: Loan) =>
    loan.monthly_deduction && loan.monthly_deduction > 0
      ? formatMoney(loan.monthly_deduction)
      : "Dynamic";

  const installmentsLabel = (loan: Loan) => {
    const n = estInstallments(loan.balance_remaining, loan.monthly_deduction);
    return n === null ? "—" : `${n} left`;
  };

  const columns: DataTableColumn<Loan>[] = [
    {
      key: "employee",
      header: "Employee",
      render: (l) => (
        <div className="flex items-center gap-3">
          <Avatar
            src={l.employee?.avatar ?? undefined}
            name={l.employee?.full_name}
            size="sm"
          />
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">
              {l.employee?.full_name ?? "—"}
            </p>
            {l.employee?.employee_code && (
              <p className="truncate text-xs text-foreground-muted">
                {l.employee.employee_code}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (l) => (
        <Badge variant={LOAN_STATUS_TONE[l.status] ?? "muted"}>
          {LOAN_STATUS_LABELS[l.status] ?? l.status}
        </Badge>
      ),
    },
    {
      key: "principal",
      header: "Principal",
      align: "right",
      render: (l) => (
        <span className="text-foreground">{formatMoney(l.principal)}</span>
      ),
    },
    {
      key: "balance",
      header: "Balance",
      align: "right",
      render: (l) => (
        <span className="font-medium text-foreground">
          {formatMoney(l.balance_remaining)}
        </span>
      ),
    },
    {
      key: "monthly",
      header: "Monthly",
      align: "right",
      render: (l) => (
        <span
          className={
            l.monthly_deduction && l.monthly_deduction > 0
              ? "text-foreground"
              : "inline-flex items-center gap-1 text-foreground-muted"
          }
        >
          {(!l.monthly_deduction || l.monthly_deduction <= 0) && (
            <Repeat className="h-3.5 w-3.5" />
          )}
          {deductionLabel(l)}
        </span>
      ),
    },
    {
      key: "installments",
      header: "Est. installments",
      align: "right",
      render: (l) => (
        <span className="text-foreground-muted">{installmentsLabel(l)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Loans"
        description="Employee loan ledger"
        actions={
          <Button onClick={() => router.push("/admin/loans/new")}>
            <Plus className="h-4 w-4" /> Create Loan
          </Button>
        }
      />

      <FilterTabs tabs={tabs} value={status} onChange={setStatus} />

      <Card className="p-2">
        <QueryState
          isLoading={query.isLoading}
          isError={query.isError}
          error={query.error}
          data={query.data?.items}
          onRetry={() => query.refetch()}
          skeleton={<SkeletonList items={6} />}
          emptyIcon={Banknote}
          emptyTitle="No loans yet"
          emptyDescription="Create a loan to start tracking employee repayments."
          emptyAction={{
            label: "Create Loan",
            onClick: () => router.push("/admin/loans/new"),
          }}
        >
          {(rows) => (
            <DataTable
              columns={columns}
              data={rows}
              rowKey={(l) => l.id}
              onRowClick={(l) => router.push(`/admin/loans/${l.id}`)}
              isLoading={query.isFetching && !query.data}
              empty={
                <EmptyState
                  icon={Banknote}
                  title="No loans yet"
                  description="Create a loan to start tracking employee repayments."
                />
              }
            />
          )}
        </QueryState>
      </Card>

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

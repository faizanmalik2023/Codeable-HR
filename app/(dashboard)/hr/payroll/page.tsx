"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Wallet, CheckCircle2, Clock, Sparkles, AlertTriangle, Receipt } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Select } from "@/components/ui/select";
import { ConfirmModal } from "@/components/ui/modal";
import { DataTable, type DataTableColumn } from "@/components/ui/table";
import { SkeletonStats } from "@/components/ui/skeleton";
import { StatusCard } from "@/components/shared/status-card";
import { PageHeader } from "@/components/shared/page-header";
import { QueryState } from "@/components/shared/query-state";
import { SalarySlipStatusEnum } from "@/lib/enums";
import { formatMoney } from "@/lib/format";
import { usePayroll } from "./use-payroll";
import type { PayrollSlip } from "@/lib/api/payroll";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const MONTH_OPTIONS = MONTH_NAMES.map((label, i) => ({
  value: String(i + 1),
  label,
}));

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => {
  const y = CURRENT_YEAR - 4 + i;
  return { value: String(y), label: String(y) };
});

export default function HrPayrollPage() {
  const router = useRouter();
  const { month, year, setMonth, setYear, query, slips, summary, generate, release } =
    usePayroll();

  const [confirmGenerate, setConfirmGenerate] = React.useState(false);
  const [confirmRelease, setConfirmRelease] = React.useState(false);

  const skipped = generate.data?.skipped ?? 0;
  const showSummary = slips.length > 0 || query.isFetching;

  const columns: DataTableColumn<PayrollSlip>[] = [
    {
      key: "employee",
      header: "Employee",
      render: (s) => (
        <div className="flex items-center gap-3">
          <Avatar
            src={s.employee?.avatar}
            name={s.employee?.full_name}
            size="sm"
          />
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">
              {s.employee?.full_name ?? "—"}
            </p>
            {s.employee?.employee_code && (
              <p className="truncate text-xs text-foreground-muted">
                {s.employee.employee_code}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (s) => (
        <Badge variant={SalarySlipStatusEnum.tone(s.status)}>
          {SalarySlipStatusEnum.label(s.status)}
        </Badge>
      ),
    },
    {
      key: "net",
      header: "Net",
      align: "right",
      render: (s) => (
        <span className="font-medium text-foreground">{formatMoney(s.net)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-24">
      <PageHeader
        title="Payroll"
        description="Generate, review and release monthly payslips"
        actions={
          <div className="flex items-center gap-2">
            <Select
              options={MONTH_OPTIONS}
              value={String(month)}
              onChange={(v) => setMonth(Number(v))}
              className="w-40"
            />
            <Select
              options={YEAR_OPTIONS}
              value={String(year)}
              onChange={(v) => setYear(Number(v))}
              className="w-28"
            />
          </div>
        }
      />

      {/* Summary */}
      {showSummary &&
        (query.isLoading && !query.data ? (
          <SkeletonStats count={3} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatusCard
              title="Net to disburse"
              value={formatMoney(summary.netTotal)}
              subtitle={`${MONTH_NAMES[month - 1]} ${year}`}
              icon={Wallet}
              variant="primary"
            />
            <StatusCard
              title="Sent"
              value={String(summary.sent)}
              subtitle="Released payslips"
              icon={CheckCircle2}
              variant="success"
            />
            <StatusCard
              title="Pending"
              value={String(summary.pending)}
              subtitle="Awaiting release"
              icon={Clock}
              variant="warning"
            />
          </div>
        ))}

      {/* Salary-config skipped banner (after a generate run) */}
      {skipped > 0 && (
        <Card className="flex items-center gap-4 border-warning/30 bg-warning-muted/40 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-warning text-warning-foreground">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-foreground">
              {skipped} employee{skipped === 1 ? "" : "s"} need salary config
            </p>
            <p className="text-sm text-foreground-muted">
              These employees were skipped because their compensation isn&apos;t set up yet.
            </p>
          </div>
        </Card>
      )}

      {/* Slips */}
      <Card className="p-2">
        <QueryState
          isLoading={query.isLoading}
          isError={query.isError}
          error={query.error}
          data={query.data?.items}
          onRetry={() => query.refetch()}
          emptyIcon={Receipt}
          emptyTitle="No payslips yet"
          emptyDescription={`Generate payslips for ${MONTH_NAMES[month - 1]} ${year} to get started.`}
          emptyAction={{
            label: "Generate payslips",
            onClick: () => setConfirmGenerate(true),
          }}
        >
          {(items) => (
            <DataTable
              columns={columns}
              data={items}
              rowKey={(s) => s.id}
              onRowClick={(s) => router.push(`/payroll/slip/${s.id}`)}
              isLoading={query.isFetching && !query.data}
            />
          )}
        </QueryState>
      </Card>

      {/* Sticky Release All bar */}
      {summary.pending > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/90 backdrop-blur-sm md:pl-[240px]">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 p-4">
            <div className="text-sm">
              <p className="font-medium text-foreground">
                {summary.pending} payslip{summary.pending === 1 ? "" : "s"} pending release
              </p>
              <p className="text-foreground-muted">
                {formatMoney(summary.netTotal)} total for {MONTH_NAMES[month - 1]} {year}
              </p>
            </div>
            <Button onClick={() => setConfirmRelease(true)} isLoading={release.isPending}>
              <Sparkles className="h-4 w-4" /> Release All
            </Button>
          </div>
        </div>
      )}

      {/* Generate confirm */}
      <ConfirmModal
        open={confirmGenerate}
        onClose={() => setConfirmGenerate(false)}
        onConfirm={() =>
          generate.mutate(undefined, { onSettled: () => setConfirmGenerate(false) })
        }
        title={`Generate payslips for ${MONTH_NAMES[month - 1]} ${year}?`}
        description="This creates a payslip for every employee with a salary configured. Existing slips are left untouched."
        confirmLabel="Generate"
        isLoading={generate.isPending}
      />

      {/* Release-all confirm */}
      <ConfirmModal
        open={confirmRelease}
        onClose={() => setConfirmRelease(false)}
        onConfirm={() =>
          release.mutate(undefined, { onSettled: () => setConfirmRelease(false) })
        }
        title={`Release all pending payslips?`}
        description={`${summary.pending} payslip${summary.pending === 1 ? "" : "s"} will be sent to employees for ${MONTH_NAMES[month - 1]} ${year}. This cannot be undone.`}
        confirmLabel="Release All"
        isLoading={release.isPending}
      />
    </div>
  );
}

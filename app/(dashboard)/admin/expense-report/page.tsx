"use client";

import * as React from "react";
import { Wallet, Repeat, Coins, Hash, HandCoins, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { StatusCard } from "@/components/shared/status-card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { SkeletonStats } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/format";
import { CURRENCY_SYMBOL, type ExpenseCurrency } from "@/lib/enums";
import {
  prettify,
  type AdminExpenseReport,
  type ExpenseBreakdownItem,
} from "@/lib/api/admin-expenses";
import { useExpenseReport } from "./use-expense-report";

function itemLabel(i: ExpenseBreakdownItem): string {
  return i.label ?? prettify(i.type ?? i.key);
}

export default function ExpenseReportPage() {
  const { from, to, setFrom, setTo, query } = useExpenseReport();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expense Report"
        description="Financial summary for a date range"
        back
      />

      {/* Date-range bar */}
      <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Label className="mb-2 block">From</Label>
          <DatePicker value={from} onChange={setFrom} maxDate={to ?? undefined} />
        </div>
        <div className="flex-1">
          <Label className="mb-2 block">To</Label>
          <DatePicker value={to} onChange={setTo} minDate={from ?? undefined} />
        </div>
      </Card>

      {query.isLoading && !query.data ? (
        <SkeletonStats count={4} />
      ) : query.isError && !query.data ? (
        <ErrorState
          message={query.error instanceof Error ? query.error.message : undefined}
          onRetry={() => query.refetch()}
        />
      ) : query.data ? (
        <Report data={query.data} />
      ) : (
        <EmptyState
          icon={FileText}
          title="Pick a date range"
          description="Select a start and end date to generate the report."
        />
      )}
    </div>
  );
}

function Report({ data }: { data: AdminExpenseReport }) {
  const currency: ExpenseCurrency = data.currency ?? "PKR";
  const total = data.total ?? data.total_amount ?? 0;
  const categories = data.by_category ?? [];
  const payments = data.by_payment_method ?? [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatusCard
          title="Total spend"
          value={formatMoney(total, currency)}
          icon={Wallet}
          variant="primary"
        />
        {typeof data.recurring_total === "number" && (
          <StatusCard
            title="Recurring"
            value={formatMoney(data.recurring_total, currency)}
            icon={Repeat}
            variant="accent"
          />
        )}
        {typeof data.one_time_total === "number" && (
          <StatusCard
            title="One-time"
            value={formatMoney(data.one_time_total, currency)}
            icon={Coins}
            variant="success"
          />
        )}
        {typeof data.reimbursable_total === "number" && (
          <StatusCard
            title="Reimbursable"
            value={formatMoney(data.reimbursable_total, currency)}
            icon={HandCoins}
            variant="warning"
          />
        )}
        {typeof data.count === "number" && (
          <StatusCard
            title="Entries"
            value={String(data.count)}
            icon={Hash}
            variant="default"
          />
        )}
      </div>

      {categories.length > 0 && (
        <BarSection
          title="By category"
          items={categories.map((c) => ({ label: itemLabel(c), amount: c.amount }))}
          currency={currency}
        />
      )}
      {payments.length > 0 && (
        <BarSection
          title="By payment method"
          items={payments.map((p) => ({ label: itemLabel(p), amount: p.amount }))}
          currency={currency}
        />
      )}
    </div>
  );
}

/* Simple horizontal div-bar chart (no chart library). */
function BarSection({
  title,
  items,
  currency,
}: {
  title: string;
  items: { label: string; amount: number }[];
  currency: ExpenseCurrency;
}) {
  const max = Math.max(1, ...items.map((i) => i.amount));
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-foreground">{title}</h2>
        <span className="text-xs text-foreground-muted">
          {CURRENCY_SYMBOL[currency]}
        </span>
      </div>
      <div className="space-y-3">
        {items.map((i, idx) => (
          <div key={`${i.label}-${idx}`}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-foreground">{i.label}</span>
              <span className="font-medium text-foreground">
                {formatMoney(i.amount, currency)}
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.max(2, (i.amount / max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

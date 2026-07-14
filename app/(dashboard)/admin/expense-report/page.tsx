"use client";

import * as React from "react";
import { Wallet, Repeat, Coins, FileText } from "lucide-react";
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
} from "@/lib/api/admin-expenses";
import { useExpenseReport } from "./use-expense-report";

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
  // Report amounts are already normalised to PKR (amount_pkr) server-side.
  const currency: ExpenseCurrency = "PKR";
  const summary = data.summary;
  const categories = summary.by_category ?? [];
  const payments = summary.by_payment_method ?? [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatusCard
          title="Total spend"
          value={formatMoney(summary.total_spend, currency)}
          icon={Wallet}
          variant="primary"
        />
        <StatusCard
          title="Recurring"
          value={formatMoney(summary.recurring_total, currency)}
          icon={Repeat}
          variant="accent"
        />
        <StatusCard
          title="One-time"
          value={formatMoney(summary.one_time_total, currency)}
          icon={Coins}
          variant="success"
        />
      </div>

      {categories.length > 0 && (
        <BarSection
          title="By category"
          items={categories.map((c) => ({
            label: prettify(c.category),
            amount: c.total,
          }))}
          currency={currency}
        />
      )}

      {payments.length > 0 && (
        <BarSection
          title="By payment method"
          items={payments.map((p) => ({
            label: prettify(p.payment_method),
            amount: p.total,
          }))}
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

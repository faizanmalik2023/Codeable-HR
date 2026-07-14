"use client";

import * as React from "react";
import { Wallet, Repeat, Coins, Hash, BarChart3, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SkeletonStats } from "@/components/ui/skeleton";
import { StatusCard } from "@/components/shared/status-card";
import { QueryState } from "@/components/shared/query-state";
import { PageHeader } from "@/components/shared/page-header";
import { formatMoney } from "@/lib/format";
import { CURRENCY_SYMBOL, type ExpenseCurrency } from "@/lib/enums";
import {
  prettify,
  type AdminExpenseAnalytics,
  type ExpenseBreakdownItem,
  type ExpenseTrendPoint,
} from "@/lib/api/admin-expenses";
import { useExpenseAnalytics } from "./use-expense-analytics";

/** Label for a breakdown/trend item across possible key shapes. */
function itemLabel(i: ExpenseBreakdownItem | ExpenseTrendPoint): string {
  return (
    i.label ??
    prettify(
      ("type" in i ? i.type : undefined) ??
        ("month" in i ? i.month : undefined) ??
        i.key,
    )
  );
}

export default function ExpenseAnalyticsPage() {
  const { query } = useExpenseAnalytics();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expense Analytics"
        description="Where the company is spending"
        back
      />

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        data={query.data}
        onRetry={() => query.refetch()}
        isEmpty={(d) => !d}
        skeleton={<SkeletonStats count={4} />}
        emptyIcon={BarChart3}
        emptyTitle="No analytics yet"
        emptyDescription="Analytics appear once expenses are recorded."
      >
        {(data) => <Analytics data={data} />}
      </QueryState>
    </div>
  );
}

function Analytics({ data }: { data: AdminExpenseAnalytics }) {
  const currency: ExpenseCurrency = data.currency ?? "PKR";
  const total = data.total ?? data.total_amount ?? 0;
  const categories = data.by_category ?? [];
  const payments = data.by_payment_method ?? [];
  const trend = data.monthly_trend ?? [];

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

      {trend.length > 0 && (
        <BarSection
          title="Monthly trend"
          items={trend.map((t) => ({ label: itemLabel(t), amount: t.amount }))}
          currency={currency}
        />
      )}

      {categories.length === 0 && payments.length === 0 && trend.length === 0 && (
        <Card className="flex flex-col items-center gap-2 p-10 text-center">
          <FileText className="h-8 w-8 text-foreground-muted" />
          <p className="text-sm text-foreground-muted">
            No breakdown data available yet.
          </p>
        </Card>
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

"use client";

import * as React from "react";
import { Wallet, Repeat, CalendarRange, TrendingDown, TrendingUp, BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SkeletonStats } from "@/components/ui/skeleton";
import { StatusCard } from "@/components/shared/status-card";
import { QueryState } from "@/components/shared/query-state";
import { PageHeader } from "@/components/shared/page-header";
import { formatMoney, formatCompact } from "@/lib/format";
import { cn } from "@/lib/utils";
import { prettify, type AdminExpenseAnalytics } from "@/lib/api/admin-expenses";
import { useExpenseAnalytics } from "./use-expense-analytics";

/** Every figure here is PKR — the server normalises to `amount_pkr` before summing. */
const CCY = "PKR" as const;

export default function ExpenseAnalyticsPage() {
  const { query } = useExpenseAnalytics();

  return (
    <div className="space-y-6">
      <PageHeader title="Expenses" description="Where the company's money goes" back />

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        data={query.data}
        onRetry={() => query.refetch()}
        isEmpty={(d) => !d}
        skeleton={<SkeletonStats count={4} />}
        emptyIcon={BarChart3}
        emptyTitle="No expenses yet"
        emptyDescription="This fills in as expenses are recorded."
      >
        {(data) => <Overview data={data} />}
      </QueryState>
    </div>
  );
}

function monthLabel(month?: string): string {
  if (!month) return "";
  const [y, m] = month.split("-");
  const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const i = Number(m) - 1;
  return i >= 0 && i < 12 ? `${names[i]} ${y?.slice(2) ?? ""}`.trim() : month;
}

function Overview({ data }: { data: AdminExpenseAnalytics }) {
  const t = data.totals;
  const categories = [...(data.by_category ?? [])].sort((a, b) => b.total - a.total);
  const trend = data.monthly_trend ?? [];
  const mom = t.mom_change_pct;

  return (
    <div className="space-y-6">
      {/* The four numbers that answer "how are we doing this month". */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatusCard
          title="This month"
          value={formatMoney(t.current_month_total ?? 0, CCY)}
          subtitle={
            mom === null || mom === undefined
              ? undefined
              : `${mom > 0 ? "+" : ""}${mom.toFixed(1)}% vs last month`
          }
          icon={mom !== null && mom !== undefined && mom > 0 ? TrendingUp : TrendingDown}
          variant={mom !== null && mom !== undefined && mom > 0 ? "warning" : "success"}
        />
        <StatusCard
          title="Average / month"
          value={formatMoney(t.avg_monthly_spend ?? 0, CCY)}
          icon={CalendarRange}
          variant="primary"
        />
        <StatusCard
          title="Recurring commitment"
          value={formatMoney(t.monthly_recurring_commitment ?? 0, CCY)}
          subtitle="Locked in every month"
          icon={Repeat}
          variant="accent"
        />
        <StatusCard
          title="Total recorded"
          value={formatMoney(t.total_spend, CCY)}
          subtitle={`${formatMoney(t.recurring_total, CCY)} recurring · ${formatMoney(t.one_time_total, CCY)} one-time`}
          icon={Wallet}
          variant="default"
        />
      </div>

      {/* Month by month, recurring vs one-time stacked — the view the finance sheet
          gave, without the scrolling. */}
      {trend.length > 0 && <MonthlyBreakdown trend={trend} />}

      {categories.length > 0 && (
        <Card className="p-5">
          <h2 className="mb-4 font-semibold text-foreground">By category</h2>
          <div className="space-y-3.5">
            {categories.map((c) => {
              const pct = t.total_spend > 0 ? (c.total / t.total_spend) * 100 : 0;
              return (
                <div key={c.category}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate text-foreground">{prettify(c.category)}</span>
                    <span className="shrink-0 tabular-nums text-foreground-muted">
                      <span className="font-medium text-foreground">{formatMoney(c.total, CCY)}</span>
                      <span className="ml-2 text-xs">{pct.toFixed(1)}%</span>
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.max(1, pct)}%` }}
                    />
                  </div>
                  {c.count !== undefined && (
                    <p className="mt-1 text-xs text-foreground-subtle">{c.count} entries</p>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

function MonthlyBreakdown({
  trend,
}: {
  trend: { month?: string; total: number; recurring?: number; one_time?: number }[];
}) {
  const max = Math.max(1, ...trend.map((p) => p.total));
  const peak = trend.reduce((a, b) => (b.total > a.total ? b : a), trend[0]);

  return (
    <Card className="p-5">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="font-semibold text-foreground">Month by month</h2>
        <div className="flex items-center gap-3 text-xs text-foreground-muted">
          <Legend className="bg-primary" label="Recurring" />
          <Legend className="bg-accent" label="One-time" />
        </div>
      </div>
      <p className="mb-4 text-xs text-foreground-subtle">
        Highest was {monthLabel(peak?.month)} at {formatMoney(peak?.total ?? 0, CCY)}
      </p>

      <div className="flex items-end gap-2 overflow-x-auto pb-2">
        {trend.map((p) => {
          const rec = p.recurring ?? 0;
          const one = p.one_time ?? Math.max(0, p.total - rec);
          return (
            <div key={p.month} className="flex min-w-[46px] flex-1 flex-col items-center gap-2">
              <span className="text-[10px] tabular-nums text-foreground-subtle">
                {formatCompact(Math.round(p.total))}
              </span>
              {/* Stacked so the recurring floor is readable at a glance — that's the
                  part you can't cut without cancelling something. */}
              <div
                className="flex h-36 w-7 flex-col justify-end overflow-hidden rounded-md bg-secondary/50"
                title={`${monthLabel(p.month)} — ${formatMoney(p.total, CCY)}`}
              >
                <div className="w-full bg-accent" style={{ height: `${(one / max) * 100}%` }} />
                <div className="w-full bg-primary" style={{ height: `${(rec / max) * 100}%` }} />
              </div>
              <span className="whitespace-nowrap text-[11px] font-medium text-foreground-muted">
                {monthLabel(p.month)}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("h-2 w-2 rounded-full", className)} />
      {label}
    </span>
  );
}

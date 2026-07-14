"use client";

import * as React from "react";
import {
  TrendingUp,
  TrendingDown,
  Scale,
  Wallet,
  PieChart,
  PiggyBank,
  HandCoins,
  ArrowDownLeft,
  SlidersHorizontal,
  ArrowLeftRight,
  Landmark,
  Coins,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { SkeletonStats } from "@/components/ui/skeleton";
import { StatusCard } from "@/components/shared/status-card";
import { PageHeader } from "@/components/shared/page-header";
import { QueryState } from "@/components/shared/query-state";
import { formatMoney, formatOrdinalDate } from "@/lib/format";
import { useReport } from "./use-report";

export default function TreasuryReportPage() {
  const { from, to, setFrom, setTo, query } = useReport();
  const r = query.data;

  return (
    <div className="space-y-6">
      <PageHeader title="Financial report" description="Profit & loss and cash-flow for a period" back />

      {/* Date-range bar */}
      <Card className="flex flex-wrap items-end gap-4 p-4">
        <div className="min-w-[180px] flex-1">
          <Label className="mb-2 block" optional>
            From
          </Label>
          <DatePicker value={from} onChange={setFrom} maxDate={to ?? undefined} placeholder="Start date" />
        </div>
        <div className="min-w-[180px] flex-1">
          <Label className="mb-2 block" optional>
            To
          </Label>
          <DatePicker value={to} onChange={setTo} minDate={from ?? undefined} placeholder="End date" />
        </div>
      </Card>

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        data={r}
        onRetry={() => query.refetch()}
        isEmpty={() => false}
        skeleton={<SkeletonStats count={6} />}
      >
        {(report) => (
          <div className="space-y-6">
            {/* P&L */}
            <Section title="Profit & loss" icon={Scale}>
              <StatusCard title="Income" value={formatMoney(report.profit_and_loss.income)} icon={TrendingUp} variant="success" />
              <StatusCard title="Expenses" value={formatMoney(report.profit_and_loss.expenses)} icon={TrendingDown} variant="warning" />
              <StatusCard title="Net profit" value={formatMoney(report.profit_and_loss.net_profit)} icon={Scale} variant="primary" />
              <StatusCard title="Payroll" value={formatMoney(report.profit_and_loss.payroll)} icon={Wallet} variant="default" />
              <StatusCard title="Equity distributed" value={formatMoney(report.profit_and_loss.equity_distributed)} icon={PieChart} variant="accent" />
              <StatusCard title="Retained" value={formatMoney(report.profit_and_loss.retained)} icon={PiggyBank} variant="default" />
            </Section>

            {/* Cash flow */}
            <Section title="Cash flow" icon={ArrowLeftRight}>
              <StatusCard title="Loans disbursed" value={formatMoney(report.cash_flow.loan_disbursed)} icon={HandCoins} variant="warning" />
              <StatusCard title="Loans repaid" value={formatMoney(report.cash_flow.loan_repaid)} icon={ArrowDownLeft} variant="success" />
              <StatusCard title="Adjustments net" value={formatMoney(report.cash_flow.adjustments_net)} icon={SlidersHorizontal} variant="default" />
              <StatusCard title="Net change" value={formatMoney(report.cash_flow.net_change)} icon={ArrowLeftRight} variant="primary" />
            </Section>

            {/* Treasury snapshot */}
            <Section title="Treasury snapshot" icon={Landmark}>
              <StatusCard title="Current balance" value={formatMoney(report.treasury.current_balance)} icon={Landmark} variant="primary" />
              <StatusCard title="Loans outstanding" value={formatMoney(report.treasury.loans_outstanding)} icon={Coins} variant="accent" />
            </Section>

            <p className="text-center text-xs text-foreground-subtle">
              Generated {formatOrdinalDate(report.generated_at)}
            </p>
          </div>
        )}
      </QueryState>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Scale;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-foreground-muted" />
        <h2 className="font-semibold text-foreground">{title}</h2>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </div>
  );
}

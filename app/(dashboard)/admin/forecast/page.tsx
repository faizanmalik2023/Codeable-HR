"use client";

import * as React from "react";
import {
  TrendingUp,
  Wallet,
  CalendarClock,
  AlertTriangle,
  Users,
  Repeat,
  PauseCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SkeletonStats } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { QueryState } from "@/components/shared/query-state";
import { StatusCard } from "@/components/shared/status-card";
import { formatMoney, formatCompact, monthLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  SCENARIO_HELP,
  SCENARIO_LABELS,
  type Forecast,
  type ForecastMonth,
  type ForecastScenario,
} from "@/lib/api/admin-forecast";
import { useForecast } from "./use-forecast";

export default function AdminForecastPage() {
  const { months, setMonths, scenario, setScenario, forecast, rows, pick, HORIZONS } =
    useForecast();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Forecast"
        description="What's left after the lights are kept on — inflow minus recurring cost and payroll"
        actions={
          <div className="flex gap-1">
            {HORIZONS.map((h) => (
              <Button
                key={h}
                size="sm"
                variant={h === months ? "default" : "outline"}
                onClick={() => setMonths(h)}
              >
                {h}mo
              </Button>
            ))}
          </div>
        }
      />

      <QueryState
        isLoading={forecast.isLoading}
        isError={forecast.isError}
        error={forecast.error}
        data={forecast.data}
        onRetry={() => forecast.refetch()}
        isEmpty={() => false}
        skeleton={<SkeletonStats count={4} />}
      >
        {(f) => {
          const runway = f.runway[scenario];
          const netTotal =
            scenario === "committed"
              ? f.totals.net_profit_committed
              : f.totals.net_profit_expected;
          const closing = f.closing_cash[scenario];

          return (
            <div className="space-y-6">
              <ScenarioToggle value={scenario} onChange={setScenario} />

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatusCard
                  title="Costs, every month"
                  value={formatMoney(f.baseline.monthly_outflow)}
                  subtitle={`${formatMoney(f.baseline.payroll)} payroll · ${formatMoney(
                    f.baseline.recurring_expenses
                  )} recurring`}
                  icon={Repeat}
                  variant="warning"
                />
                <StatusCard
                  title="Cash covers"
                  value={
                    f.baseline.months_of_cost_covered === null
                      ? "—"
                      : `${f.baseline.months_of_cost_covered} mo`
                  }
                  subtitle="With nothing coming in"
                  icon={Wallet}
                  variant={
                    (f.baseline.months_of_cost_covered ?? 99) < 3 ? "warning" : "primary"
                  }
                />
                <StatusCard
                  title={`Net over ${f.months} months`}
                  value={formatMoney(netTotal)}
                  subtitle={`${SCENARIO_LABELS[scenario]} · after all costs`}
                  icon={TrendingUp}
                  variant={netTotal >= 0 ? "success" : "warning"}
                />
                <StatusCard
                  title="Cash runs out"
                  value={runway === null ? "Not in window" : monthLabel(f.monthly[runway].month)}
                  subtitle={
                    runway === null
                      ? `Still ${formatMoney(closing)} at ${monthLabel(f.to)}`
                      : `${runway} month${runway === 1 ? "" : "s"} from now`
                  }
                  icon={CalendarClock}
                  variant={runway === null ? "success" : "warning"}
                />
              </div>

              {runway !== null && (
                <Card className="flex items-start gap-3 border-warning/30 bg-warning-muted/40 p-4">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
                  <div className="text-sm">
                    <p className="font-medium text-foreground">
                      On the {SCENARIO_LABELS[scenario].toLowerCase()} view, cash goes
                      negative in {monthLabel(f.monthly[runway].month)}
                    </p>
                    <p className="text-foreground-muted">
                      {formatMoney(f.baseline.monthly_outflow)} goes out every month
                      against {formatMoney(pick(f.monthly[0]).inflow)} coming in.
                      {scenario === "committed" &&
                        " Switch to Expected to include the pipeline."}
                    </p>
                  </div>
                </Card>
              )}

              {f.baseline.paused.count > 0 && <PausedCosts baseline={f.baseline} />}

              <NetProfitChart rows={rows} pick={pick} scenario={scenario} />
              <CashRunwayChart rows={rows} pick={pick} openingCash={f.opening_cash} />
              <ForecastTable forecast={f} scenario={scenario} />
            </div>
          );
        }}
      </QueryState>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Paused recurring costs — the burn is only as honest as this list     */
/* ------------------------------------------------------------------ */
function PausedCosts({ baseline }: { baseline: Forecast["baseline"] }) {
  const [open, setOpen] = React.useState(false);
  const { paused } = baseline;
  return (
    <Card className="border-warning/30 bg-warning-muted/30 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <PauseCircle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          <div className="text-sm">
            <p className="font-medium text-foreground">
              {paused.count} recurring cost{paused.count === 1 ? " is" : "s are"} paused,
              worth {formatMoney(paused.monthly_total)} a month
            </p>
            <p className="text-foreground-muted">
              They&apos;re left out of the projection. If any is still being paid, the
              forecast is {formatMoney(paused.monthly_total)}/month too optimistic.
            </p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={() => setOpen((v) => !v)}>
          {open ? "Hide" : "Review"}
        </Button>
      </div>
      {open && (
        <ul className="mt-4 grid gap-x-6 gap-y-1.5 border-t border-warning/20 pt-3 text-sm sm:grid-cols-2">
          {paused.items.map((t) => (
            <li key={t.id} className="flex items-baseline justify-between gap-3">
              <span className="text-foreground-muted">{t.name}</span>
              <span className="tabular-nums text-foreground">{formatMoney(t.amount)}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Scenario toggle                                                     */
/* ------------------------------------------------------------------ */
function ScenarioToggle({
  value,
  onChange,
}: {
  value: ForecastScenario;
  onChange: (v: ForecastScenario) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div
        role="radiogroup"
        aria-label="Forecast scenario"
        className="inline-flex rounded-xl border border-border bg-card p-1"
      >
        {(["committed", "expected"] as ForecastScenario[]).map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={value === s}
            onClick={() => onChange(s)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              value === s
                ? "bg-primary text-primary-foreground"
                : "text-foreground-muted hover:text-foreground"
            )}
          >
            {SCENARIO_LABELS[s]}
          </button>
        ))}
      </div>
      <p className="text-xs text-foreground-muted">{SCENARIO_HELP[value]}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Monthly net profit — diverging bars off a zero baseline             */
/* ------------------------------------------------------------------ */
// Sign is carried by POSITION (above or below the baseline) and by a direct value
// label on every bar, not by colour alone: green↔red sits in the 6–8 CVD band, which
// is only legal with that secondary encoding.
function NetProfitChart({
  rows,
  pick,
  scenario,
}: {
  rows: ForecastMonth[];
  pick: (r: ForecastMonth) => { inflow: number; net: number; cash: number };
  scenario: ForecastScenario;
}) {
  const maxAbs = Math.max(1, ...rows.map((r) => Math.abs(pick(r).net)));

  return (
    <Card className="p-5">
      <div className="mb-1 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-foreground-muted" />
        <h2 className="font-semibold text-foreground">Net profit per month</h2>
      </div>
      <p className="mb-5 text-xs text-foreground-muted">
        {SCENARIO_LABELS[scenario]} inflow, less recurring cost and payroll. Above the
        line is profit; below it is a loss.
      </p>

      <div className="flex items-stretch gap-3 overflow-x-auto pb-1">
        {rows.map((r) => {
          const { net } = pick(r);
          const pct = Math.max(2, Math.round((Math.abs(net) / maxAbs) * 100));
          const positive = net >= 0;
          return (
            <div key={r.month} className="flex min-w-16 flex-1 flex-col items-center">
              {/* Upper half — profit grows up from the baseline. */}
              <div className="flex h-24 w-full flex-col justify-end">
                {positive && (
                  <>
                    <span className="mb-1 text-center text-[10px] font-medium tabular-nums text-foreground">
                      {formatCompact(net)}
                    </span>
                    <div
                      className="mx-auto w-5 rounded-t-md bg-success"
                      style={{ height: `${pct}%` }}
                    />
                  </>
                )}
              </div>
              {/* The zero line the whole chart reads against. */}
              <div className="h-px w-full bg-border-hover" />
              {/* Lower half — a loss grows down. */}
              <div className="flex h-24 w-full flex-col justify-start">
                {!positive && (
                  <>
                    <div
                      className="mx-auto w-5 rounded-b-md bg-destructive"
                      style={{ height: `${pct}%` }}
                    />
                    <span className="mt-1 text-center text-[10px] font-medium tabular-nums text-foreground">
                      {formatCompact(net)}
                    </span>
                  </>
                )}
              </div>
              <span className="mt-2 text-[11px] font-medium text-foreground-muted">
                {monthLabel(r.month)}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Projected cash — a single series, so no legend                      */
/* ------------------------------------------------------------------ */
function CashRunwayChart({
  rows,
  pick,
  openingCash,
}: {
  rows: ForecastMonth[];
  pick: (r: ForecastMonth) => { inflow: number; net: number; cash: number };
  openingCash: number;
}) {
  const series = [openingCash, ...rows.map((r) => pick(r).cash)];
  const min = Math.min(0, ...series);
  const max = Math.max(0, ...series);
  const span = max - min || 1;

  const W = 100;
  const H = 40;
  const x = (i: number) => (i / Math.max(1, series.length - 1)) * W;
  const y = (v: number) => H - ((v - min) / span) * H;
  const points = series.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const zeroY = y(0);
  const dips = min < 0;

  return (
    <Card className="p-5">
      <div className="mb-1 flex items-center gap-2">
        <Wallet className="h-4 w-4 text-foreground-muted" />
        <h2 className="font-semibold text-foreground">Projected cash</h2>
      </div>
      <p className="mb-5 text-xs text-foreground-muted">
        Company cash carried forward. Money held for the partners is excluded — it
        isn&apos;t the company&apos;s to spend.
      </p>

      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="h-44 w-full overflow-visible"
          role="img"
          aria-label={`Projected cash from ${formatMoney(openingCash)} to ${formatMoney(
            series[series.length - 1]
          )}`}
        >
          {/* Zero line — only meaningful when the projection can cross it. */}
          {dips && (
            <line
              x1="0"
              x2={W}
              y1={zeroY}
              y2={zeroY}
              className="stroke-destructive/50"
              strokeWidth="0.4"
              strokeDasharray="2 2"
              vectorEffect="non-scaling-stroke"
            />
          )}
          <polyline
            points={points}
            fill="none"
            className="stroke-primary"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          {series.map((v, i) => (
            <circle
              key={rows[i - 1]?.month ?? "open"}
              cx={x(i)}
              cy={y(v)}
              r="1.1"
              className={v < 0 ? "fill-destructive" : "fill-primary"}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
      </div>

      <div className="mt-3 flex justify-between text-[11px] text-foreground-muted">
        <span>Now · {formatMoney(openingCash)}</span>
        <span
          className={cn(
            "font-medium",
            series[series.length - 1] < 0 ? "text-destructive" : "text-foreground"
          )}
        >
          {rows.length ? monthLabel(rows[rows.length - 1].month) : ""} ·{" "}
          {formatMoney(series[series.length - 1])}
        </span>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* The table view — also the accessible fallback for the charts        */
/* ------------------------------------------------------------------ */
function ForecastTable({
  forecast,
  scenario,
}: {
  forecast: Forecast;
  scenario: ForecastScenario;
}) {
  const committed = scenario === "committed";
  return (
    <Card className="p-0">
      <div className="border-b border-border px-5 py-4">
        <h2 className="font-semibold text-foreground">Month by month</h2>
        <p className="text-xs text-foreground-muted">
          Every figure behind the charts, on the {SCENARIO_LABELS[scenario].toLowerCase()}{" "}
          scenario.
        </p>
      </div>
      <div className="w-full overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border">
            <tr className="text-left text-xs text-foreground-muted">
              <th className="px-5 py-3 font-medium">Month</th>
              <th className="px-3 py-3 text-right font-medium">Coming in</th>
              <th className="px-3 py-3 text-right font-medium">Recurring</th>
              <th className="px-3 py-3 text-right font-medium">Payroll</th>
              <th className="px-3 py-3 text-right font-medium">Net profit</th>
              <th className="px-5 py-3 text-right font-medium">Cash after</th>
            </tr>
          </thead>
          <tbody>
            {forecast.monthly.map((r) => {
              const net = committed ? r.net_profit_committed : r.net_profit_expected;
              const cash = committed ? r.closing_cash_committed : r.closing_cash_expected;
              const inflow = committed ? r.inflow_committed : r.inflow_expected;
              return (
                <tr key={r.month} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 font-medium text-foreground">
                    {monthLabel(r.month)}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-foreground">
                    {formatMoney(inflow)}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-foreground-muted">
                    −{formatMoney(r.recurring_expenses)}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-foreground-muted">
                    −{formatMoney(r.payroll)}
                  </td>
                  <td
                    className={cn(
                      "px-3 py-3 text-right font-medium tabular-nums",
                      net >= 0 ? "text-success" : "text-destructive"
                    )}
                  >
                    {formatMoney(net)}
                  </td>
                  <td
                    className={cn(
                      "px-5 py-3 text-right tabular-nums",
                      cash < 0 ? "text-destructive" : "text-foreground"
                    )}
                  >
                    {formatMoney(cash)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="border-t border-border bg-secondary/30">
            <tr className="font-medium">
              <td className="px-5 py-3 text-foreground">Total</td>
              <td className="px-3 py-3 text-right tabular-nums text-foreground">
                {formatMoney(
                  committed ? forecast.totals.inflow_committed : forecast.totals.inflow_expected
                )}
              </td>
              <td className="px-3 py-3 text-right tabular-nums text-foreground-muted">
                −{formatMoney(forecast.totals.recurring_expenses)}
              </td>
              <td className="px-3 py-3 text-right tabular-nums text-foreground-muted">
                −{formatMoney(forecast.totals.payroll)}
              </td>
              <td
                className={cn(
                  "px-3 py-3 text-right tabular-nums",
                  (committed
                    ? forecast.totals.net_profit_committed
                    : forecast.totals.net_profit_expected) >= 0
                    ? "text-success"
                    : "text-destructive"
                )}
              >
                {formatMoney(
                  committed
                    ? forecast.totals.net_profit_committed
                    : forecast.totals.net_profit_expected
                )}
              </td>
              <td className="px-5 py-3 text-right tabular-nums text-foreground">
                {formatMoney(forecast.closing_cash[scenario])}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="flex items-center gap-2 border-t border-border px-5 py-3 text-xs text-foreground-muted">
        <Users className="h-3.5 w-3.5" />
        {forecast.baseline.headcount} on payroll · {forecast.baseline.recurring_count}{" "}
        recurring costs · rate {forecast.usd_to_pkr} PKR/USD
      </div>
    </Card>
  );
}

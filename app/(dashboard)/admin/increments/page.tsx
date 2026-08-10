"use client";

import * as React from "react";
import { TrendingUp, Users, Clock, Wallet, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { SkeletonStats } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { QueryState } from "@/components/shared/query-state";
import { StatusCard } from "@/components/shared/status-card";
import { formatMoney, formatOrdinalDate } from "@/lib/format";
import {
  INELIGIBLE_LABELS,
  type IncrementRow,
} from "@/lib/api/admin-increments";
import { useIncrements } from "./use-increments";

/** The last few cycles, newest first — March and September only. */
function cycleOptions(now = new Date()) {
  const out: string[] = [];
  let year = now.getUTCFullYear();
  let month = now.getUTCMonth() + 1 >= 9 ? 9 : now.getUTCMonth() + 1 >= 3 ? 3 : -1;
  if (month === -1) {
    year -= 1;
    month = 9;
  }
  for (let i = 0; i < 6; i += 1) {
    out.push(`${year}-${String(month).padStart(2, "0")}`);
    if (month === 9) month = 3;
    else {
      month = 9;
      year -= 1;
    }
  }
  return out.map((value) => ({
    value,
    label: `${value.endsWith("-03") ? "March" : "September"} ${value.slice(0, 4)}`,
  }));
}

export default function AdminIncrementsPage() {
  const {
    month,
    setMonth,
    cycle,
    eligible,
    notEligible,
    percents,
    setPercent,
    selected,
    toggle,
    toggleAll,
    outOfBand,
    invalidRows,
    projectedCost,
    apply,
  } = useIncrements();

  const options = React.useMemo(() => cycleOptions(), []);

  const newSalary = (row: IncrementRow) => {
    const basic = row.current_basic_salary ?? 0;
    const pct = percents[row.user_id] ?? 0;
    return Math.round(basic * (1 + pct / 100) * 100) / 100;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Increment cycle"
        description="March and September. The band is policy; the figure inside it is yours."
        actions={
          <div className="w-56">
            <Select value={month} onChange={setMonth} options={options} />
          </div>
        }
      />

      <QueryState
        isLoading={cycle.isLoading}
        isError={cycle.isError}
        error={cycle.error}
        data={cycle.data}
        onRetry={() => cycle.refetch()}
        isEmpty={() => false}
        skeleton={<SkeletonStats count={4} />}
      >
        {(c) => (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatusCard
                title="Eligible"
                value={String(c.counts.eligible)}
                subtitle={`of ${c.counts.total} on the payroll`}
                icon={Users}
                variant="primary"
              />
              <StatusCard
                title="Band"
                value={`${c.band.min}–${c.band.max}%`}
                subtitle="Half that for part-timers"
                icon={TrendingUp}
              />
              <StatusCard
                title="Effective"
                value={formatOrdinalDate(c.effective_date)}
                subtitle={`${c.cycle === "march" ? "March" : "September"} cycle`}
                icon={Clock}
              />
              <StatusCard
                title="Monthly cost of what's ticked"
                value={formatMoney(projectedCost)}
                subtitle={`${selected.size} selected`}
                icon={Wallet}
                variant="accent"
              />
            </div>

            {invalidRows.length > 0 && (
              <Card className="flex items-start gap-3 border-danger/30 bg-danger-muted/40 p-4">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
                <div className="text-sm">
                  <p className="font-medium text-foreground">
                    {invalidRows.length} selected row
                    {invalidRows.length === 1 ? " is" : "s are"} outside the allowed band
                  </p>
                  <p className="text-foreground-muted">
                    {invalidRows.map((r) => r.full_name).join(", ")}. Fix or untick them
                    before applying — the server rejects the whole batch otherwise.
                  </p>
                </div>
              </Card>
            )}

            <Card className="p-0">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Eligible</h3>
                  <p className="text-xs text-foreground-muted">
                    Everyone with at least four months of credited service who hasn&apos;t
                    already been raised this cycle.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={toggleAll}>
                    {selected.size === eligible.length ? "Untick all" : "Tick all"}
                  </Button>
                  <Button
                    size="sm"
                    disabled={
                      apply.isPending || selected.size === 0 || invalidRows.length > 0
                    }
                    onClick={() => apply.mutate()}
                  >
                    {apply.isPending
                      ? "Applying…"
                      : `Apply ${selected.size} increment${selected.size === 1 ? "" : "s"}`}
                  </Button>
                </div>
              </div>

              {eligible.length === 0 ? (
                <EmptyState
                  title="Nobody is due this cycle"
                  description="Either everyone has already been raised, or nobody has enough service yet."
                />
              ) : (
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border">
                      <tr className="text-left text-xs text-foreground-muted">
                        <th className="w-10 px-6 py-3" />
                        <th className="px-3 py-3 font-medium">Employee</th>
                        <th className="px-3 py-3 font-medium">Service</th>
                        <th className="px-3 py-3 font-medium">Band</th>
                        <th className="px-3 py-3 text-right font-medium">Current basic</th>
                        <th className="px-3 py-3 text-right font-medium">Increment</th>
                        <th className="px-6 py-3 text-right font-medium">New basic</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eligible.map((row) => {
                        const bad = outOfBand(row);
                        const ticked = selected.has(row.user_id);
                        return (
                          <tr
                            key={row.user_id}
                            className="border-b border-border last:border-0"
                          >
                            <td className="px-6 py-3">
                              <Checkbox
                                checked={ticked}
                                onChange={() => toggle(row.user_id)}
                              />
                            </td>
                            <td className="px-3 py-3">
                              <p className="font-medium text-foreground">{row.full_name}</p>
                              <p className="text-xs text-foreground-muted">
                                {row.employee_code ?? "—"}
                                {row.designation ? ` · ${row.designation}` : ""}
                              </p>
                            </td>
                            <td className="px-3 py-3">
                              <span className="text-foreground">
                                {row.tenure_months} mo
                              </span>
                              {row.part_time && (
                                <>
                                  {" "}
                                  <Badge variant="muted">
                                    half-time · {row.credited_months} credited
                                  </Badge>
                                </>
                              )}
                            </td>
                            <td className="px-3 py-3 text-foreground-muted">
                              {row.band.min}–{row.band.max}%
                            </td>
                            <td className="px-3 py-3 text-right text-foreground">
                              {formatMoney(row.current_basic_salary ?? 0)}
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex items-center justify-end gap-1">
                                <Input
                                  className={`w-20 text-right ${
                                    bad && ticked ? "border-danger" : ""
                                  }`}
                                  inputMode="decimal"
                                  value={String(percents[row.user_id] ?? "")}
                                  onChange={(e) =>
                                    setPercent(row.user_id, Number(e.target.value))
                                  }
                                  disabled={!ticked}
                                />
                                <span className="text-foreground-muted">%</span>
                              </div>
                            </td>
                            <td className="px-6 py-3 text-right font-medium text-foreground">
                              {formatMoney(newSalary(row))}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {notEligible.length > 0 && (
              <Card className="p-0">
                <div className="border-b border-border px-6 py-4">
                  <h3 className="text-sm font-semibold text-foreground">
                    Not eligible this cycle
                  </h3>
                </div>
                <ul className="divide-y divide-border">
                  {notEligible.map((row) => (
                    <li
                      key={row.user_id}
                      className="flex items-center justify-between gap-4 px-6 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {row.full_name}
                        </p>
                        <p className="text-xs text-foreground-muted">
                          {row.employee_code ?? "—"}
                          {row.part_time ? " · half-time" : ""}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm text-foreground-muted">
                          {row.reason ? INELIGIBLE_LABELS[row.reason] : "—"}
                        </p>
                        {row.reason === "tenure" && row.detail?.months_short != null && (
                          <p className="text-xs text-foreground-subtle">
                            {row.detail.months_short} more month
                            {row.detail.months_short === 1 ? "" : "s"} to go
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        )}
      </QueryState>
    </div>
  );
}

"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/ui/table";
import { formatMoney } from "@/lib/format";
import {
  BENEFICIARY_KIND_LABELS,
  BENEFICIARY_KIND_TONE,
  type DistributionAllocationLine,
  type EquityDistribution,
} from "@/lib/api/admin-equity";

const pct = (v: number | null | undefined) =>
  `${(v ?? 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}%`;

interface StatProps {
  label: string;
  value: string;
  emphasis?: boolean;
}

function Stat({ label, value, emphasis }: StatProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
        {label}
      </p>
      <p
        className={
          emphasis
            ? "mt-1 text-xl font-bold text-foreground"
            : "mt-1 text-lg font-semibold text-foreground"
        }
      >
        {value}
      </p>
    </div>
  );
}

/** Renders the (persisted or previewed) distribution roll-up + allocation lines. */
export function DistributionSummary({
  distribution,
  title = "Allocation summary",
}: {
  distribution: EquityDistribution;
  title?: string;
}) {
  const currency = distribution.currency;

  const columns: DataTableColumn<DistributionAllocationLine>[] = [
    {
      key: "beneficiary_name",
      header: "Beneficiary",
      render: (l) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">
            {l.beneficiary_name}
          </span>
          {l.kind && (
            <Badge variant={BENEFICIARY_KIND_TONE[l.kind] ?? "muted"}>
              {BENEFICIARY_KIND_LABELS[l.kind] ?? l.kind}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "share_percent",
      header: "Share",
      align: "right",
      render: (l) => <span className="text-foreground-muted">{pct(l.share_percent)}</span>,
    },
    {
      key: "payout_rate",
      header: "Payout",
      align: "right",
      render: (l) => <span className="text-foreground-muted">{pct(l.payout_rate)}</span>,
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      render: (l) => (
        <span className="font-medium text-foreground">
          {formatMoney(l.amount, currency)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Net profit" value={formatMoney(distribution.net_profit, currency)} />
        <Stat
          label="To distribute"
          value={formatMoney(distribution.total_to_distribute, currency)}
        />
        <Stat
          label="Allocated"
          value={formatMoney(distribution.allocated_total, currency)}
          emphasis
        />
        <Stat
          label="Retained"
          value={formatMoney(distribution.retained_total, currency)}
        />
      </div>

      <Card className="p-2">
        <p className="px-3 pt-2 text-sm font-medium text-foreground">{title}</p>
        <DataTable
          columns={columns}
          data={distribution.allocations ?? []}
          rowKey={(l) => l.beneficiary_id ?? l.beneficiary_name}
          empty="No allocation lines"
        />
      </Card>
    </div>
  );
}

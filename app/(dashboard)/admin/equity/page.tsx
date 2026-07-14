"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  PieChart,
  Users,
  TrendingUp,
  Landmark,
  Wallet,
  HandCoins,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonStats } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { QueryState } from "@/components/shared/query-state";
import { StatusCard } from "@/components/shared/status-card";
import {
  BENEFICIARY_KIND_LABELS,
  BENEFICIARY_KIND_TONE,
  type AllocationRow,
} from "@/lib/api/admin-equity";
import { useEquity } from "./use-equity";

const pct = (v: number | null | undefined) =>
  `${(v ?? 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}%`;

const MANAGE_LINKS: { label: string; href: string; icon: typeof Users }[] = [
  { label: "Beneficiaries", href: "/admin/equity/beneficiaries", icon: Users },
  { label: "Distributions", href: "/admin/equity/distributions", icon: HandCoins },
  { label: "Commitments", href: "/admin/equity/commitments", icon: Landmark },
  { label: "Funds", href: "/admin/equity/funds", icon: Wallet },
];

export default function EquityOverviewPage() {
  const router = useRouter();
  const { query, summary, beneficiaries } = useEquity();

  const columns: DataTableColumn<AllocationRow>[] = [
    {
      key: "name",
      header: "Beneficiary",
      render: (r) => (
        <span className="font-medium text-foreground">{r.name}</span>
      ),
    },
    {
      key: "kind",
      header: "Kind",
      render: (r) => (
        <Badge variant={BENEFICIARY_KIND_TONE[r.kind] ?? "muted"}>
          {BENEFICIARY_KIND_LABELS[r.kind] ?? r.kind}
        </Badge>
      ),
    },
    {
      key: "share_percent",
      header: "Share",
      align: "right",
      render: (r) => <span className="text-foreground">{pct(r.share_percent)}</span>,
    },
    {
      key: "payout_rate",
      header: "Payout rate",
      align: "right",
      render: (r) => (
        <span className="text-foreground-muted">{pct(r.payout_rate)}</span>
      ),
    },
    {
      key: "effective_paid_percent",
      header: "Effective paid",
      align: "right",
      render: (r) => (
        <span className="font-medium text-foreground">
          {pct(r.effective_paid_percent)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Equity"
        description="Cap table, beneficiaries, profit distributions and funds"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {MANAGE_LINKS.map((l) => (
              <Button
                key={l.href}
                variant="outline"
                size="sm"
                onClick={() => router.push(l.href)}
              >
                <l.icon className="h-4 w-4" /> {l.label}
              </Button>
            ))}
          </div>
        }
      />

      {/* Allocation summary */}
      {query.isLoading && !query.data ? (
        <SkeletonStats count={3} />
      ) : (
        summary && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatusCard
              title="Allocated share"
              value={pct(summary.total_share_percent)}
              subtitle="Total cap-table ownership assigned"
              icon={PieChart}
              variant="primary"
            />
            <StatusCard
              title="Effective payout"
              value={pct(summary.total_effective_paid_percent)}
              subtitle="Share weighted by payout rate"
              icon={TrendingUp}
              variant="success"
            />
            <StatusCard
              title="Active beneficiaries"
              value={String(beneficiaries.length)}
              subtitle="Currently receiving distributions"
              icon={Users}
              variant="accent"
            />
          </div>
        )
      )}

      {/* Cap table */}
      <Card className="p-2">
        <QueryState
          isLoading={query.isLoading}
          isError={query.isError}
          error={query.error}
          data={query.data?.beneficiaries}
          onRetry={() => query.refetch()}
          emptyIcon={PieChart}
          emptyTitle="No cap table yet"
          emptyDescription="Add beneficiaries to build your equity allocation."
          emptyAction={{
            label: "Manage Beneficiaries",
            onClick: () => router.push("/admin/equity/beneficiaries"),
          }}
        >
          {(rows) => (
            <DataTable
              columns={columns}
              data={rows}
              rowKey={(r) => r.id ?? r.name}
              isLoading={query.isFetching && !query.data}
              empty={
                <EmptyState
                  icon={PieChart}
                  title="No cap table yet"
                  description="Add beneficiaries to build your equity allocation."
                />
              }
            />
          )}
        </QueryState>
      </Card>
    </div>
  );
}

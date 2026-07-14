"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, HandCoins } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FilterTabs } from "@/components/ui/filter-tabs";
import { DataTable, type DataTableColumn } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonList } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { QueryState } from "@/components/shared/query-state";
import { formatMoney } from "@/lib/format";
import {
  DISTRIBUTION_FILTERS,
  DISTRIBUTION_STATUS_LABELS,
  DISTRIBUTION_STATUS_TONE,
  type DistributionStatus,
  type EquityDistribution,
} from "@/lib/api/admin-equity";
import { useDistributions } from "./use-distributions";

export default function DistributionsPage() {
  const router = useRouter();
  const { status, setStatus, page, setPage, query, counts, pagination } =
    useDistributions();

  const tabs = DISTRIBUTION_FILTERS.map((value) => ({
    value,
    label:
      value === "all"
        ? "All"
        : DISTRIBUTION_STATUS_LABELS[value as DistributionStatus],
    count: value === "all" ? undefined : counts[value],
  }));

  const columns: DataTableColumn<EquityDistribution>[] = [
    {
      key: "period",
      header: "Period",
      render: (d) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">
            {d.period_label || d.month || "Untitled run"}
          </p>
          {d.month && d.period_label && (
            <p className="truncate text-xs text-foreground-muted">{d.month}</p>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (d) => (
        <Badge variant={DISTRIBUTION_STATUS_TONE[d.status] ?? "muted"}>
          {DISTRIBUTION_STATUS_LABELS[d.status] ?? d.status}
        </Badge>
      ),
    },
    {
      key: "net_profit",
      header: "Net profit",
      align: "right",
      render: (d) => (
        <span className="text-foreground-muted">
          {formatMoney(d.net_profit, d.currency)}
        </span>
      ),
    },
    {
      key: "total_disbursed",
      header: "Distributed",
      align: "right",
      render: (d) => (
        <span className="font-medium text-foreground">
          {formatMoney(d.total_disbursed, d.currency)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Distributions"
        description="Profit-distribution runs"
        back
        actions={
          <Button onClick={() => router.push("/admin/equity/distributions/new")}>
            <Plus className="h-4 w-4" /> New Run
          </Button>
        }
      />

      <FilterTabs tabs={tabs} value={status} onChange={setStatus} />

      <Card className="p-2">
        <QueryState
          isLoading={query.isLoading}
          isError={query.isError}
          error={query.error}
          data={query.data?.items}
          onRetry={() => query.refetch()}
          skeleton={<SkeletonList items={6} />}
          emptyIcon={HandCoins}
          emptyTitle="No distributions yet"
          emptyDescription="Preview and confirm a profit-distribution run to get started."
          emptyAction={{
            label: "New Run",
            onClick: () => router.push("/admin/equity/distributions/new"),
          }}
        >
          {(rows) => (
            <DataTable
              columns={columns}
              data={rows}
              rowKey={(d) => d.id ?? d.period_label ?? d.month ?? "run"}
              onRowClick={(d) =>
                d.id &&
                router.push(`/admin/equity/distributions/${d.id}`)
              }
              isLoading={query.isFetching && !query.data}
              empty={
                <EmptyState
                  icon={HandCoins}
                  title="No distributions yet"
                  description="Preview and confirm a profit-distribution run to get started."
                />
              }
            />
          )}
        </QueryState>
      </Card>

      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between text-sm text-foreground-muted">
          <span>
            Page {pagination.current_page} of {pagination.total_pages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.total_pages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

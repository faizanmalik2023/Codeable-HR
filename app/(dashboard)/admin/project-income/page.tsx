"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Coins, Hash } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DataTable, type DataTableColumn } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusCard } from "@/components/shared/status-card";
import { PageHeader } from "@/components/shared/page-header";
import { QueryState } from "@/components/shared/query-state";
import { SkeletonList } from "@/components/ui/skeleton";
import { formatMoney, formatOrdinalDate } from "@/lib/format";
import type { ExpenseCurrency } from "@/lib/enums";
import type { ProjectIncome } from "@/lib/api/admin-income";
import { useProjectIncome } from "./use-project-income";

export default function ProjectIncomePage() {
  const router = useRouter();
  const { search, setSearch, page, setPage, query, summary, items, pagination } =
    useProjectIncome();

  // Summary is per-project totals; the headline count sums each project's record count.
  const recordCount =
    summary.data?.by_project?.reduce((n, p) => n + (p.count ?? 0), 0) ?? 0;

  const columns: DataTableColumn<ProjectIncome>[] = [
    {
      key: "name",
      header: "Name",
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{r.name}</p>
          {r.source && (
            <p className="truncate text-xs text-foreground-muted">{r.source}</p>
          )}
        </div>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      render: (r) => (
        <span
          className={
            r.is_reversed
              ? "text-foreground-muted line-through"
              : "font-medium text-foreground"
          }
        >
          {formatMoney(r.amount, (r.currency as ExpenseCurrency) ?? "PKR")}
        </span>
      ),
    },
    {
      key: "project",
      header: "Project",
      render: (r) => r.project?.name ?? "—",
    },
    {
      key: "date",
      header: "Date",
      render: (r) => (
        <span className="text-foreground-muted">{formatOrdinalDate(r.date)}</span>
      ),
    },
    {
      key: "status",
      header: "",
      align: "right",
      render: (r) =>
        r.is_reversed ? <Badge variant="destructive">Reversed</Badge> : null,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Project Income"
        description="Income recorded against projects"
        actions={
          <Button onClick={() => router.push("/admin/project-income/new")}>
            <Plus className="h-4 w-4" /> Add Income
          </Button>
        }
      />

      {/* Summary header */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatusCard
          title="Total (PKR)"
          value={formatMoney(summary.data?.total_income ?? 0)}
          icon={Coins}
          variant="primary"
        />
        <StatusCard
          title="Records"
          value={String(recordCount)}
          icon={Hash}
          variant="accent"
        />
      </div>

      {/* Search */}
      <Input
        icon={<Search className="h-4 w-4" />}
        placeholder="Search by name or source…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <Card className="p-2">
        <QueryState
          isLoading={query.isLoading}
          isError={query.isError}
          error={query.error}
          data={query.data?.items}
          onRetry={() => query.refetch()}
          skeleton={<SkeletonList items={6} />}
          emptyIcon={Coins}
          emptyTitle="No income recorded"
          emptyDescription="Add your first project income entry."
          emptyAction={{
            label: "Add Income",
            onClick: () => router.push("/admin/project-income/new"),
          }}
        >
          {(rows) => (
            <DataTable
              columns={columns}
              data={rows}
              rowKey={(r) => r.id}
              onRowClick={(r) =>
                router.push(`/admin/project-income/new?id=${r.id}`)
              }
              isLoading={query.isFetching && !query.data}
              empty={
                <EmptyState
                  icon={Coins}
                  title="No matches"
                  description="No income entries match your search."
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

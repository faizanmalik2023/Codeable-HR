"use client";

import * as React from "react";
import { Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { DataTable, type DataTableColumn } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonList } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { QueryState } from "@/components/shared/query-state";
import { formatMoney, formatOrdinalDate } from "@/lib/format";
import type { Fund } from "@/lib/api/admin-equity";
import { useFunds } from "./use-funds";

export default function FundsPage() {
  const { query } = useFunds();

  const columns: DataTableColumn<Fund>[] = [
    {
      key: "beneficiary",
      header: "Beneficiary",
      render: (f) => (
        <span className="font-medium text-foreground">{f.beneficiary}</span>
      ),
    },
    {
      key: "balance",
      header: "Balance",
      align: "right",
      render: (f) => (
        <span className="font-medium text-foreground">
          {formatMoney(f.balance, f.currency)}
        </span>
      ),
    },
    {
      key: "currency",
      header: "Currency",
      render: (f) => <span className="text-foreground-muted">{f.currency}</span>,
    },
    {
      key: "last_update",
      header: "Last update",
      align: "right",
      render: (f) => (
        <span className="text-foreground-muted">
          {f.last_update ? formatOrdinalDate(f.last_update) : "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Funds"
        description="Pooled fund balances held per beneficiary"
        back
      />

      <Card className="p-2">
        <QueryState
          isLoading={query.isLoading}
          isError={query.isError}
          error={query.error}
          data={query.data?.funds}
          onRetry={() => query.refetch()}
          skeleton={<SkeletonList items={5} />}
          emptyIcon={Wallet}
          emptyTitle="No pool funds"
          emptyDescription="No pool funds have been recorded yet."
        >
          {(rows) => (
            <DataTable
              columns={columns}
              data={rows}
              rowKey={(f) => f.beneficiary}
              isLoading={query.isFetching && !query.data}
              empty={
                <EmptyState
                  icon={Wallet}
                  title="No pool funds"
                  description="No pool funds have been recorded yet."
                />
              }
            />
          )}
        </QueryState>
      </Card>
    </div>
  );
}

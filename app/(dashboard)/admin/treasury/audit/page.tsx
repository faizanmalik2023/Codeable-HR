"use client";

import * as React from "react";
import { RefreshCw, ScrollText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { formatOrdinalDate } from "@/lib/format";
import { type AuditEntry } from "@/lib/api/admin-treasury";
import { useAudit } from "./use-audit";

export default function AuditPage() {
  const { page, setPage, query, items, pagination } = useAudit();

  const columns: DataTableColumn<AuditEntry>[] = [
    {
      key: "action",
      header: "Action",
      render: (e) => <Badge variant="secondary">{e.action}</Badge>,
    },
    {
      key: "entity",
      header: "Entity",
      render: (e) => (
        <div className="min-w-0">
          <p className="font-medium text-foreground">{e.entity_type}</p>
          <p className="truncate text-xs text-foreground-muted">{e.entity_id}</p>
        </div>
      ),
    },
    {
      key: "actor",
      header: "Actor",
      render: (e) => <span className="text-foreground">{e.actor}</span>,
    },
    {
      key: "created_at",
      header: "When",
      align: "right",
      render: (e) => (
        <span className="text-foreground-muted">{formatOrdinalDate(e.created_at)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit trail"
        description="Immutable record of finance actions"
        back
        actions={
          <Button variant="outline" onClick={() => query.refetch()} isLoading={query.isFetching}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        }
      />

      <Card className="p-2">
        <DataTable
          columns={columns}
          data={items}
          rowKey={(e) => e.id ?? `${e.entity_id}-${e.created_at}`}
          isLoading={query.isLoading}
          empty={
            <EmptyState
              icon={ScrollText}
              title="No audit entries"
              description="Finance actions will be logged here."
            />
          }
        />
      </Card>

      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between text-sm text-foreground-muted">
          <span>
            Page {pagination.current_page} of {pagination.total_pages}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
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

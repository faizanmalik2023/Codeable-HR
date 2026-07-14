"use client";

import * as React from "react";
import { Plus, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmModal } from "@/components/ui/modal";
import { DataTable, type DataTableColumn } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonList } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { QueryState } from "@/components/shared/query-state";
import {
  BENEFICIARY_KIND_LABELS,
  BENEFICIARY_KIND_TONE,
  type Beneficiary,
  type BeneficiaryBody,
} from "@/lib/api/admin-equity";
import { useBeneficiaries } from "./use-beneficiaries";
import { BeneficiarySheet } from "./_components/beneficiary-sheet";

const pct = (v: number | null | undefined) =>
  `${(v ?? 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}%`;

export default function BeneficiariesPage() {
  const {
    query,
    items,
    pagination,
    page,
    setPage,
    employeeOptions,
    create,
    update,
    remove,
  } = useBeneficiaries();

  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Beneficiary | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  const openAdd = () => {
    setEditing(null);
    setSheetOpen(true);
  };
  const openEdit = (b: Beneficiary) => {
    setEditing(b);
    setSheetOpen(true);
  };
  const closeSheet = () => setSheetOpen(false);

  const handleSubmit = (body: BeneficiaryBody) => {
    if (editing) {
      update.mutate(
        { id: editing.id, body },
        { onSuccess: () => setSheetOpen(false) }
      );
    } else {
      create.mutate(body, { onSuccess: () => setSheetOpen(false) });
    }
  };

  const columns: DataTableColumn<Beneficiary>[] = [
    {
      key: "name",
      header: "Name",
      render: (b) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">{b.name}</span>
          {!b.is_active && <Badge variant="muted">Inactive</Badge>}
        </div>
      ),
    },
    {
      key: "kind",
      header: "Kind",
      render: (b) => (
        <Badge variant={BENEFICIARY_KIND_TONE[b.kind] ?? "muted"}>
          {BENEFICIARY_KIND_LABELS[b.kind] ?? b.kind}
        </Badge>
      ),
    },
    {
      key: "share_percent",
      header: "Share",
      align: "right",
      render: (b) => <span className="text-foreground">{pct(b.share_percent)}</span>,
    },
    {
      key: "payout_rate",
      header: "Payout",
      align: "right",
      render: (b) => (
        <span className="text-foreground-muted">{pct(b.payout_rate)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Beneficiaries"
        description="Cap-table entries and payout rates"
        back
        actions={
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" /> Add Beneficiary
          </Button>
        }
      />

      <Card className="p-2">
        <QueryState
          isLoading={query.isLoading}
          isError={query.isError}
          error={query.error}
          data={query.data?.items}
          onRetry={() => query.refetch()}
          skeleton={<SkeletonList items={6} />}
          emptyIcon={Users}
          emptyTitle="No beneficiaries yet"
          emptyDescription="Add your first beneficiary to build the cap table."
          emptyAction={{ label: "Add Beneficiary", onClick: openAdd }}
        >
          {(rows) => (
            <DataTable
              columns={columns}
              data={rows}
              rowKey={(b) => b.id}
              onRowClick={openEdit}
              isLoading={query.isFetching && !query.data}
              empty={
                <EmptyState
                  icon={Users}
                  title="No beneficiaries yet"
                  description="Add your first beneficiary to build the cap table."
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

      <BeneficiarySheet
        open={sheetOpen}
        onClose={closeSheet}
        editing={editing}
        employeeOptions={employeeOptions}
        onSubmit={handleSubmit}
        onDelete={editing ? () => setConfirmDelete(true) : undefined}
        isPending={create.isPending || update.isPending}
        isDeleting={remove.isPending}
      />

      <ConfirmModal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          if (editing)
            remove.mutate(editing.id, {
              onSuccess: () => {
                setConfirmDelete(false);
                setSheetOpen(false);
              },
              onError: () => setConfirmDelete(false),
            });
        }}
        title="Remove beneficiary?"
        description="This beneficiary will be removed from the cap table. This cannot be undone."
        confirmLabel="Remove"
        variant="destructive"
        isLoading={remove.isPending}
      />
    </div>
  );
}

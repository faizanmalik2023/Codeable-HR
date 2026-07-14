"use client";

import * as React from "react";
import { Plus, Landmark } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmModal } from "@/components/ui/modal";
import { DataTable, type DataTableColumn } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonList } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { QueryState } from "@/components/shared/query-state";
import { formatMoney } from "@/lib/format";
import {
  commitmentBeneficiaryName,
  type Commitment,
  type CommitmentBody,
} from "@/lib/api/admin-equity";
import { useCommitments } from "./use-commitments";
import { CommitmentSheet } from "./_components/commitment-sheet";

export default function CommitmentsPage() {
  const {
    query,
    pagination,
    page,
    setPage,
    beneficiaryOptions,
    create,
    update,
    remove,
  } = useCommitments();

  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Commitment | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  const openAdd = () => {
    setEditing(null);
    setSheetOpen(true);
  };
  const openEdit = (c: Commitment) => {
    setEditing(c);
    setSheetOpen(true);
  };

  const handleSubmit = (body: CommitmentBody) => {
    if (editing) {
      update.mutate(
        { id: editing.id, body },
        { onSuccess: () => setSheetOpen(false) }
      );
    } else {
      create.mutate(body, { onSuccess: () => setSheetOpen(false) });
    }
  };

  const columns: DataTableColumn<Commitment>[] = [
    {
      key: "name",
      header: "Name",
      render: (c) => (
        <span className="font-medium text-foreground">{c.name}</span>
      ),
    },
    {
      key: "beneficiary",
      header: "Beneficiary",
      render: (c) => (
        <span className="text-foreground-muted">
          {commitmentBeneficiaryName(c)}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      render: (c) => (
        <span className="font-medium text-foreground">
          {formatMoney(c.amount, c.currency)}
        </span>
      ),
    },
    {
      key: "currency",
      header: "Currency",
      render: (c) => <span className="text-foreground-muted">{c.currency}</span>,
    },
    {
      key: "is_active",
      header: "Active",
      render: (c) =>
        c.is_active ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Badge variant="muted">Inactive</Badge>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Commitments"
        description="Recurring amounts owed to beneficiaries"
        back
        actions={
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" /> Add Commitment
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
          emptyIcon={Landmark}
          emptyTitle="No commitments yet"
          emptyDescription="Add a commitment to track recurring payouts."
          emptyAction={{ label: "Add Commitment", onClick: openAdd }}
        >
          {(rows) => (
            <DataTable
              columns={columns}
              data={rows}
              rowKey={(c) => c.id}
              onRowClick={openEdit}
              isLoading={query.isFetching && !query.data}
              empty={
                <EmptyState
                  icon={Landmark}
                  title="No commitments yet"
                  description="Add a commitment to track recurring payouts."
                />
              }
            />
          )}
        </QueryState>
      </Card>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-foreground-muted">
          <span>
            Page {pagination.currentPage} of {pagination.totalPages}
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
              disabled={page >= pagination.totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <CommitmentSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        editing={editing}
        beneficiaryOptions={beneficiaryOptions}
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
        title="Remove commitment?"
        description="This commitment will be removed. This cannot be undone."
        confirmLabel="Remove"
        variant="destructive"
        isLoading={remove.isPending}
      />
    </div>
  );
}

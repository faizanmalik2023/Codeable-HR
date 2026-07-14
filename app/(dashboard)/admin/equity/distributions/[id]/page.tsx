"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, Ban, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmModal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { QueryState } from "@/components/shared/query-state";
import { formatOrdinalDate } from "@/lib/format";
import {
  DISTRIBUTION_STATUS_LABELS,
  DISTRIBUTION_STATUS_TONE,
  type EquityDistribution,
} from "@/lib/api/admin-equity";
import { useDistribution } from "./use-distribution";
import { DistributionSummary } from "../_components/distribution-summary";

type PendingAction = "settle" | "void" | "delete" | null;

export default function DistributionDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { query, settle, voidRun, remove } = useDistribution(id);
  const [action, setAction] = React.useState<PendingAction>(null);

  const d = query.data;
  const isConfirmed = d?.status === "confirmed";

  return (
    <div className="space-y-6 pb-28">
      <PageHeader title="Distribution" description="Run details and allocation" back />

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        data={query.data}
        onRetry={() => query.refetch()}
        skeleton={
          <div className="space-y-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-64" />
          </div>
        }
      >
        {(dist: EquityDistribution) => (
          <>
            <Card className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {dist.period_label || dist.month || "Untitled run"}
                  </h2>
                  <p className="mt-1 text-sm text-foreground-muted">
                    {dist.month ? `Month ${dist.month}` : "No month set"}
                    {dist.created_at
                      ? ` · Created ${formatOrdinalDate(dist.created_at)}`
                      : ""}
                  </p>
                  {dist.note && (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">
                      {dist.note}
                    </p>
                  )}
                </div>
                <Badge variant={DISTRIBUTION_STATUS_TONE[dist.status] ?? "muted"}>
                  {DISTRIBUTION_STATUS_LABELS[dist.status] ?? dist.status}
                </Badge>
              </div>
            </Card>

            <DistributionSummary distribution={dist} />
          </>
        )}
      </QueryState>

      {/* Status-aware action bar */}
      {d && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/90 backdrop-blur-sm md:pl-[240px]">
          <div className="mx-auto flex max-w-4xl items-center justify-end gap-3 p-4">
            {isConfirmed && (
              <>
                <Button
                  variant="success"
                  onClick={() => setAction("settle")}
                  isLoading={settle.isPending}
                >
                  <CheckCircle2 className="h-4 w-4" /> Settle
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setAction("void")}
                  isLoading={voidRun.isPending}
                  className="text-destructive hover:text-destructive"
                >
                  <Ban className="h-4 w-4" /> Void
                </Button>
              </>
            )}
            {!isConfirmed && (
              <Button
                variant="destructive"
                onClick={() => setAction("delete")}
                isLoading={remove.isPending}
              >
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Settle confirm */}
      <ConfirmModal
        open={action === "settle"}
        onClose={() => setAction(null)}
        onConfirm={() =>
          settle.mutate(undefined, { onSettled: () => setAction(null) })
        }
        title="Settle this distribution?"
        description="This marks the run as settled and disburses the allocated amounts to beneficiary funds."
        confirmLabel="Settle"
        isLoading={settle.isPending}
      />

      {/* Void confirm — irreversible, reverses treasury */}
      <ConfirmModal
        open={action === "void"}
        onClose={() => setAction(null)}
        onConfirm={() =>
          voidRun.mutate(undefined, { onSettled: () => setAction(null) })
        }
        title="Void this distribution?"
        description="This is irreversible and reverses the treasury disbursement for this run. Beneficiary fund balances will be adjusted back."
        confirmLabel="Void"
        variant="destructive"
        isLoading={voidRun.isPending}
      />

      {/* Delete confirm */}
      <ConfirmModal
        open={action === "delete"}
        onClose={() => setAction(null)}
        onConfirm={() =>
          remove.mutate(undefined, { onSettled: () => setAction(null) })
        }
        title="Delete this distribution?"
        description="This run will be permanently removed. This cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        isLoading={remove.isPending}
      />
    </div>
  );
}

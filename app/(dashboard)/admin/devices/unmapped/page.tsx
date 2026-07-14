"use client";

import * as React from "react";
import { CheckCircle2, RefreshCw, KeyRound, Link2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SkeletonList } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { QueryState } from "@/components/shared/query-state";
import { timeAgo } from "@/lib/format";
import { useUnmappedPunches } from "./use-unmapped-punches";
import { AddMappingSheet } from "../_components/add-mapping-sheet";
import type { UnmappedPunch } from "@/lib/api/admin-devices";

export default function UnmappedPunchesPage() {
  const { query, punches, devices, addMapping, refresh } = useUnmappedPunches();
  const [active, setActive] = React.useState<UnmappedPunch | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Unmapped Punches"
        description="Device PINs not yet linked to an employee"
        back
        actions={
          <Button variant="outline" size="icon" onClick={refresh} aria-label="Refresh">
            <RefreshCw className={query.isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          </Button>
        }
      />

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        data={punches}
        onRetry={() => query.refetch()}
        skeleton={<SkeletonList items={5} />}
        emptyIcon={CheckCircle2}
        emptyTitle="All caught up"
        emptyDescription="Every device PIN is mapped to an employee."
      >
        {(list) => (
          <div className="space-y-2">
            {list.map((p, i) => (
              <Card key={`${p.device_serial}-${p.pin}-${i}`} className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning-muted">
                  <KeyRound className="h-5 w-5 text-warning" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">
                    PIN <span className="font-mono">{p.pin}</span>
                  </p>
                  <p className="truncate text-sm text-foreground-muted">
                    {p.device_serial} · {timeAgo(p.punched_at)}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setActive(p)}>
                  <Link2 className="h-4 w-4" /> Map PIN
                </Button>
              </Card>
            ))}
          </div>
        )}
      </QueryState>

      <AddMappingSheet
        open={!!active}
        onClose={() => setActive(null)}
        devices={devices}
        initialPin={active?.pin}
        onSubmit={(deviceId, body) =>
          addMapping.mutate(
            { deviceId, ...body },
            { onSuccess: () => setActive(null) }
          )
        }
        isPending={addMapping.isPending}
      />
    </div>
  );
}

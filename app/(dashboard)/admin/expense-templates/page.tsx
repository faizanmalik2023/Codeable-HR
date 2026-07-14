"use client";

import * as React from "react";
import { Repeat, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmModal } from "@/components/ui/modal";
import { QueryState } from "@/components/shared/query-state";
import { PageHeader } from "@/components/shared/page-header";
import { formatMoney } from "@/lib/format";
import { prettify, type ExpenseTemplate } from "@/lib/api/admin-expenses";
import { useExpenseTemplates } from "./use-expense-templates";

export default function ExpenseTemplatesPage() {
  const { templates, query, toggle, remove } = useExpenseTemplates();
  const [toStop, setToStop] = React.useState<ExpenseTemplate | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recurring Expenses"
        description="Templates that post expenses automatically"
        back
      />

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        data={query.data}
        onRetry={() => query.refetch()}
        emptyIcon={Repeat}
        emptyTitle="No recurring expenses"
        emptyDescription="Recurring expenses you create will appear here."
      >
        {() => (
          <div className="space-y-3">
            {templates.map((t) => (
              <Card key={t.id} className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-muted text-primary">
                  <Repeat className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-foreground">{t.name}</p>
                    {t.amount_type && (
                      <Badge variant="secondary">{prettify(t.amount_type)}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-foreground-muted">
                    {formatMoney(t.default_amount, t.currency)}
                    {t.cadence || t.frequency
                      ? ` · ${t.cadence ?? prettify(t.frequency)}`
                      : ""}
                  </p>
                </div>
                <Switch
                  checked={t.is_active}
                  onChange={(v) => toggle.mutate({ id: t.id, is_active: v })}
                  aria-label={t.is_active ? "Pause recurring" : "Resume recurring"}
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setToStop(t)}
                  aria-label="Stop recurring"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </Card>
            ))}
          </div>
        )}
      </QueryState>

      <ConfirmModal
        open={!!toStop}
        onClose={() => setToStop(null)}
        onConfirm={() => {
          if (toStop) remove.mutate(toStop.id, { onSettled: () => setToStop(null) });
        }}
        title={`Stop "${toStop?.name}" recurring?`}
        description="No new occurrences will be created. Past entries are kept in the ledger."
        confirmLabel="Stop recurring"
        variant="destructive"
        isLoading={remove.isPending}
      />
    </div>
  );
}

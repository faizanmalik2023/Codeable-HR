"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, CalendarClock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Sheet, SheetFooter } from "@/components/ui/sheet";
import { ConfirmModal } from "@/components/ui/modal";
import { PageHeader } from "@/components/shared/page-header";
import { QueryState } from "@/components/shared/query-state";
import { formatOrdinalDate } from "@/lib/format";
import { type FinancePeriod } from "@/lib/api/admin-treasury";
import { usePeriods } from "./use-periods";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const MONTH_OPTIONS = MONTH_NAMES.map((label, i) => ({
  value: String(i + 1).padStart(2, "0"),
  label,
}));

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => {
  const y = CURRENT_YEAR - 4 + i;
  return { value: String(y), label: String(y) };
});

function monthLabel(month: string): string {
  const [y, m] = month.split("-");
  const idx = Number(m) - 1;
  return `${MONTH_NAMES[idx] ?? m} ${y ?? ""}`.trim();
}

const schema = z.object({
  year: z.string().min(1, "Select a year"),
  month: z.string().min(1, "Select a month"),
  note: z.string().max(500, "Keep it under 500 characters").optional(),
});
type FormValues = z.infer<typeof schema>;

export default function PeriodsPage() {
  const { page, setPage, query, items, pagination, close, reopen } = usePeriods();
  const [closing, setClosing] = React.useState(false);
  const [toReopen, setToReopen] = React.useState<FinancePeriod | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Periods"
        description="Closed accounting months"
        back
        actions={
          <Button onClick={() => setClosing(true)}>
            <Lock className="h-4 w-4" /> Close month
          </Button>
        }
      />

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        data={items}
        onRetry={() => query.refetch()}
        emptyIcon={CalendarClock}
        emptyTitle="No closed periods"
        emptyDescription="Close a month to lock its finances against changes."
        emptyAction={{ label: "Close month", onClick: () => setClosing(true) }}
      >
        {(list) => (
          <div className="space-y-3">
            {list.map((p) => (
              <Card
                key={p.id ?? p.month}
                className="flex cursor-pointer items-center gap-4 p-4 transition-colors hover:border-border-hover hover:bg-card-hover"
                onClick={() => setToReopen(p)}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground-muted">
                  <Lock className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{monthLabel(p.month)}</p>
                  <p className="truncate text-xs text-foreground-muted">
                    {p.closed_at ? `Closed ${formatOrdinalDate(p.closed_at)}` : "Closed"}
                    {p.closed_by ? ` · ${p.closed_by}` : ""}
                    {p.note ? ` · ${p.note}` : ""}
                  </p>
                </div>
                <span className="text-xs font-medium text-foreground-subtle">Tap to reopen</span>
              </Card>
            ))}
          </div>
        )}
      </QueryState>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-foreground-muted">
          <span>
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
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

      <CloseMonthSheet
        open={closing}
        onClose={() => setClosing(false)}
        isPending={close.isPending}
        onSubmit={(body) => close.mutate(body, { onSuccess: () => setClosing(false) })}
      />

      <ConfirmModal
        open={!!toReopen}
        onClose={() => setToReopen(null)}
        onConfirm={() => {
          if (toReopen) reopen.mutate(toReopen.month, { onSettled: () => setToReopen(null) });
        }}
        title={toReopen ? `Reopen ${monthLabel(toReopen.month)}?` : "Reopen month?"}
        description="Reopening unlocks this month so its finances can change again."
        confirmLabel="Reopen"
        variant="destructive"
        isLoading={reopen.isPending}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Close month sheet                                                   */
/* ------------------------------------------------------------------ */
function CloseMonthSheet({
  open,
  onClose,
  isPending,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  isPending: boolean;
  onSubmit: (body: { month: string; note?: string }) => void;
}) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      year: String(CURRENT_YEAR),
      month: String(new Date().getMonth() + 1).padStart(2, "0"),
      note: "",
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        year: String(CURRENT_YEAR),
        month: String(new Date().getMonth() + 1).padStart(2, "0"),
        note: "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = handleSubmit((v) => {
    onSubmit({ month: `${v.year}-${v.month}`, note: v.note?.trim() || undefined });
  });

  return (
    <Sheet open={open} onClose={onClose} title="Close month" description="Lock a month's finances against changes." size="md">
      <form onSubmit={submit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Controller
            control={control}
            name="month"
            render={({ field }) => (
              <Select label="Month" options={MONTH_OPTIONS} value={field.value} onChange={field.onChange} error={errors.month?.message} />
            )}
          />
          <Controller
            control={control}
            name="year"
            render={({ field }) => (
              <Select label="Year" options={YEAR_OPTIONS} value={field.value} onChange={field.onChange} error={errors.year?.message} />
            )}
          />
        </div>

        <div>
          <Label className="mb-2 block" optional>
            Note
          </Label>
          <Textarea rows={3} placeholder="Reason or context for closing" error={errors.note?.message} {...register("note")} />
        </div>

        <SheetFooter className="-mx-6 -mb-5 mt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isPending}>
            <Lock className="h-4 w-4" /> Close month
          </Button>
        </SheetFooter>
      </form>
    </Sheet>
  );
}

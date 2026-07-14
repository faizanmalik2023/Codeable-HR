"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, ArrowDownLeft, ArrowUpRight, SlidersHorizontal } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { FilterTabs } from "@/components/ui/filter-tabs";
import { Sheet, SheetFooter } from "@/components/ui/sheet";
import { ConfirmModal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { QueryState } from "@/components/shared/query-state";
import { type ExpenseCurrency } from "@/lib/enums";
import { formatMoney, formatOrdinalDate, toWireDate } from "@/lib/format";
import {
  ADJUSTMENT_DIRECTION_FILTERS,
  ADJUSTMENT_DIRECTION_LABELS,
  ADJUSTMENT_TYPE_LABELS,
  type Adjustment,
  type AdjustmentDirection,
  type AdjustmentType,
} from "@/lib/api/admin-treasury";
import { useAdjustments } from "./use-adjustments";

const CURRENCY_OPTIONS: { value: ExpenseCurrency; label: string }[] = [
  { value: "PKR", label: "Pakistani Rupee (₨)" },
  { value: "USD", label: "US Dollar ($)" },
];

const TYPE_OPTIONS = (Object.keys(ADJUSTMENT_TYPE_LABELS) as AdjustmentType[]).map((value) => ({
  value,
  label: ADJUSTMENT_TYPE_LABELS[value],
}));

const DIRECTION_OPTIONS: { value: AdjustmentDirection; label: string }[] = [
  { value: "out", label: "Outflow" },
  { value: "in", label: "Inflow" },
];

const schema = z.object({
  type: z.enum(["tax", "provident_fund", "capital", "other"]),
  direction: z.enum(["in", "out"]),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((v) => Number(v.replace(/,/g, "")) > 0, "Amount must be greater than 0"),
  currency: z.enum(["PKR", "USD"]),
  date: z.string().optional(),
  description: z.string().max(500, "Keep it under 500 characters").optional(),
});
type FormValues = z.infer<typeof schema>;

export default function AdjustmentsPage() {
  const { direction, setDirection, page, setPage, query, items, pagination, create, remove } =
    useAdjustments();
  const [creating, setCreating] = React.useState(false);
  const [toDelete, setToDelete] = React.useState<Adjustment | null>(null);

  const tabs = ADJUSTMENT_DIRECTION_FILTERS.map((value) => ({
    value,
    label: value === "all" ? "All" : ADJUSTMENT_DIRECTION_LABELS[value],
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Adjustments"
        description="Manual treasury entries"
        back
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> New adjustment
          </Button>
        }
      />

      <FilterTabs tabs={tabs} value={direction} onChange={setDirection} />

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        data={items}
        onRetry={() => query.refetch()}
        emptyIcon={SlidersHorizontal}
        emptyTitle="No adjustments"
        emptyDescription="Manual inflows and outflows will appear here."
        emptyAction={{ label: "New adjustment", onClick: () => setCreating(true) }}
      >
        {(list) => (
          <div className="space-y-3">
            {list.map((a) => (
              <AdjustmentCard key={a.id} adjustment={a} onDelete={() => setToDelete(a)} />
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

      <NewAdjustmentSheet
        open={creating}
        onClose={() => setCreating(false)}
        isPending={create.isPending}
        onSubmit={(body) => create.mutate(body, { onSuccess: () => setCreating(false) })}
      />

      <ConfirmModal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) remove.mutate(toDelete.id, { onSettled: () => setToDelete(null) });
        }}
        title="Delete adjustment?"
        description="This entry will be permanently removed and the current balance recalculated."
        confirmLabel="Delete"
        variant="destructive"
        isLoading={remove.isPending}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Adjustment card                                                     */
/* ------------------------------------------------------------------ */
function AdjustmentCard({
  adjustment: a,
  onDelete,
}: {
  adjustment: Adjustment;
  onDelete: () => void;
}) {
  const inflow = a.direction === "in";
  return (
    <Card
      className="flex cursor-pointer items-center gap-4 p-4 transition-colors hover:border-border-hover hover:bg-card-hover"
      onClick={onDelete}
    >
      <div
        className={
          inflow
            ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-success-muted text-success"
            : "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-warning-muted text-warning"
        }
      >
        {inflow ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium text-foreground">{ADJUSTMENT_TYPE_LABELS[a.type] ?? a.type}</p>
          <Badge variant={inflow ? "success" : "warning"}>
            {ADJUSTMENT_DIRECTION_LABELS[a.direction]}
          </Badge>
        </div>
        <p className="truncate text-xs text-foreground-muted">
          {a.date ? formatOrdinalDate(a.date) : "—"}
          {a.description ? ` · ${a.description}` : ""}
        </p>
      </div>
      <span className={inflow ? "font-semibold text-success" : "font-semibold text-warning"}>
        {inflow ? "+" : "-"}
        {formatMoney(a.amount, a.currency)}
      </span>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* New adjustment sheet                                                */
/* ------------------------------------------------------------------ */
function NewAdjustmentSheet({
  open,
  onClose,
  isPending,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  isPending: boolean;
  onSubmit: (body: {
    type: AdjustmentType;
    direction: AdjustmentDirection;
    amount: number;
    currency?: ExpenseCurrency;
    date?: string;
    description?: string;
  }) => void;
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
      type: "other",
      direction: "out",
      amount: "",
      currency: "PKR",
      date: "",
      description: "",
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        type: "other",
        direction: "out",
        amount: "",
        currency: "PKR",
        date: "",
        description: "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = handleSubmit((v) => {
    onSubmit({
      type: v.type,
      direction: v.direction,
      amount: Number(v.amount.replace(/,/g, "")),
      currency: v.currency,
      date: v.date || toWireDate(new Date()),
      description: v.description?.trim() || undefined,
    });
  });

  return (
    <Sheet open={open} onClose={onClose} title="New adjustment" description="Record a manual inflow or outflow." size="md">
      <form onSubmit={submit} className="space-y-5">
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <Select label="Type" options={TYPE_OPTIONS} value={field.value} onChange={field.onChange} error={errors.type?.message} />
          )}
        />

        <Controller
          control={control}
          name="direction"
          render={({ field }) => (
            <Select label="Direction" options={DIRECTION_OPTIONS} value={field.value} onChange={field.onChange} error={errors.direction?.message} />
          )}
        />

        <div>
          <Label htmlFor="amount" className="mb-2 block" required>
            Amount
          </Label>
          <Input id="amount" inputMode="decimal" placeholder="0" error={errors.amount?.message} {...register("amount")} />
        </div>

        <Controller
          control={control}
          name="currency"
          render={({ field }) => (
            <Select label="Currency" options={CURRENCY_OPTIONS} value={field.value} onChange={field.onChange} error={errors.currency?.message} />
          )}
        />

        <div>
          <Label className="mb-2 block" optional>
            Date
          </Label>
          <Controller
            control={control}
            name="date"
            render={({ field }) => (
              <DatePicker
                value={field.value ? new Date(field.value) : null}
                onChange={(d) => field.onChange(d ? toWireDate(d) : "")}
                placeholder="Defaults to today"
                maxDate={new Date()}
              />
            )}
          />
        </div>

        <div>
          <Label className="mb-2 block" optional>
            Description
          </Label>
          <Textarea rows={3} placeholder="What is this adjustment for?" error={errors.description?.message} {...register("description")} />
        </div>

        <SheetFooter className="-mx-6 -mb-5 mt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isPending}>
            Add adjustment
          </Button>
        </SheetFooter>
      </form>
    </Sheet>
  );
}

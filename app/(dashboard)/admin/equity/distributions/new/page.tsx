"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, CheckCircle2, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/page-header";
import { parseAmount, toWireMonth } from "@/lib/format";
import {
  EQUITY_CURRENCY_OPTIONS,
  type DistributionBody,
  type EquityDistribution,
} from "@/lib/api/admin-equity";
import type { ExpenseCurrency } from "@/lib/enums";
import { useNewDistribution } from "./use-new-distribution";
import { DistributionSummary } from "../_components/distribution-summary";

const schema = z.object({
  period_label: z.string().trim().min(1, "Period label is required").max(120),
  month: z.string().optional(),
  net_profit: z.string().optional(),
  revenue: z.string().optional(),
  expenses_total: z.string().optional(),
  currency: z.enum(["PKR", "USD"]),
  note: z.string().trim().max(500).optional(),
});
type FormValues = z.infer<typeof schema>;

/** Recent-month options (`YYYY-MM`) — avoids native month picker per house style. */
function recentMonths(): { value: string; label: string }[] {
  const opts: { value: string; label: string }[] = [{ value: "", label: "No month" }];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    opts.push({
      value: toWireMonth(d),
      label: d.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    });
  }
  return opts;
}

const num = (s?: string): number | undefined => {
  if (!s || s.trim() === "") return undefined;
  const n = parseAmount(s);
  return Number.isFinite(n) ? n : undefined;
};

export default function NewDistributionPage() {
  const { preview, create } = useNewDistribution();
  const monthOptions = React.useMemo(() => recentMonths(), []);

  // The two-step gate: Confirm stays disabled until a successful preview exists,
  // and ANY subsequent form edit clears it so Confirm re-locks.
  const [previewData, setPreviewData] = React.useState<EquityDistribution | null>(
    null
  );

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      period_label: "",
      month: "",
      net_profit: "",
      revenue: "",
      expenses_total: "",
      currency: "PKR",
      note: "",
    },
  });

  // Invalidate any existing preview the moment the inputs change.
  React.useEffect(() => {
    const sub = watch(() => setPreviewData(null));
    return () => sub.unsubscribe();
  }, [watch]);

  const buildBody = (v: FormValues): DistributionBody => ({
    period_label: v.period_label.trim(),
    month: v.month || undefined,
    net_profit: num(v.net_profit),
    revenue: num(v.revenue),
    expenses_total: num(v.expenses_total),
    currency: v.currency,
    note: v.note?.trim() || undefined,
  });

  const onPreview = handleSubmit((v) =>
    preview.mutate(buildBody(v), {
      onSuccess: (data) => setPreviewData(data),
    })
  );

  // Confirm is only reachable after a successful preview (button also disabled).
  const onConfirm = handleSubmit((v) => {
    if (!previewData) return;
    create.mutate(buildBody(v));
  });

  const pending = preview.isPending || create.isPending;
  const canConfirm = !!previewData && !pending;

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-28">
      <PageHeader title="New Distribution" description="Preview, then confirm" back />

      <Card className="space-y-5 p-6">
        <div>
          <Label className="mb-2 block" required>
            Period label
          </Label>
          <Input
            placeholder="e.g. Q2 2026 Profit Share"
            error={errors.period_label?.message}
            {...register("period_label")}
          />
        </div>

        <Controller
          control={control}
          name="month"
          render={({ field }) => (
            <Select
              label="Month"
              placeholder="Select a month (optional)"
              options={monthOptions}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <Label className="mb-2 block" optional>
              Net profit
            </Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0"
              {...register("net_profit")}
            />
          </div>
          <div>
            <Label className="mb-2 block" optional>
              Revenue
            </Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0"
              {...register("revenue")}
            />
          </div>
          <div>
            <Label className="mb-2 block" optional>
              Expenses
            </Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0"
              {...register("expenses_total")}
            />
          </div>
        </div>

        <Controller
          control={control}
          name="currency"
          render={({ field }) => (
            <Select
              label="Currency"
              options={EQUITY_CURRENCY_OPTIONS as { value: string; label: string }[]}
              value={field.value}
              onChange={(v) => field.onChange(v as ExpenseCurrency)}
              className="sm:max-w-xs"
            />
          )}
        />

        <div>
          <Label className="mb-2 block" optional>
            Note
          </Label>
          <Textarea rows={3} placeholder="Optional context for this run" {...register("note")} />
        </div>
      </Card>

      {/* Preview result — non-persisted */}
      {previewData ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary-muted px-4 py-3 text-sm text-foreground">
            <Info className="h-4 w-4 shrink-0 text-primary" />
            <span>
              This is a non-persisted preview. Review the allocation, then confirm
              to record the run.
            </span>
          </div>
          <DistributionSummary
            distribution={previewData}
            title="Previewed allocation"
          />
        </div>
      ) : (
        <Card className="flex items-center gap-3 p-5 text-sm text-foreground-muted">
          <Eye className="h-5 w-5 shrink-0" />
          Run a preview to see the allocation before confirming.
        </Card>
      )}

      {/* Sticky two-step action bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/90 backdrop-blur-sm md:pl-[240px]">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 p-4">
          <Button
            variant="outline"
            onClick={onPreview}
            isLoading={preview.isPending}
            disabled={pending}
          >
            <Eye className="h-4 w-4" /> Preview
          </Button>
          <Button onClick={onConfirm} isLoading={create.isPending} disabled={!canConfirm}>
            <CheckCircle2 className="h-4 w-4" /> Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}

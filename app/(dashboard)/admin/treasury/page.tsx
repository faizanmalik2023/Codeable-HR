"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Pencil,
  Landmark,
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  HandCoins,
  Scale,
  FileText,
  SlidersHorizontal,
  CalendarClock,
  ScrollText,
  PieChart,
  BarChart3,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Sheet, SheetFooter } from "@/components/ui/sheet";
import { SkeletonStats } from "@/components/ui/skeleton";
import { StatusCard } from "@/components/shared/status-card";
import { PageHeader } from "@/components/shared/page-header";
import { QueryState } from "@/components/shared/query-state";
import { CURRENCY_SYMBOL, type ExpenseCurrency } from "@/lib/enums";
import { formatMoney, formatCompact, formatOrdinalDate, toWireDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useTreasury } from "./use-treasury";
import type { CashFlowPoint } from "@/lib/api/admin-treasury";

const CURRENCY_OPTIONS: { value: ExpenseCurrency; label: string }[] = [
  { value: "PKR", label: "Pakistani Rupee (₨)" },
  { value: "USD", label: "US Dollar ($)" },
];

const schema = z.object({
  opening_balance: z
    .string()
    .min(1, "Opening balance is required")
    .refine((v) => Number(v.replace(/,/g, "")) >= 0, "Enter a valid amount"),
  currency: z.enum(["PKR", "USD"]),
  opening_date: z.string().optional(),
  note: z.string().max(500, "Keep it under 500 characters").optional(),
});
type FormValues = z.infer<typeof schema>;

export default function TreasuryPage() {
  const router = useRouter();
  const { overview, setOpening, points } = useTreasury();
  const [editing, setEditing] = React.useState(false);

  const data = overview.data;
  const currency = data?.currency ?? "PKR";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Treasury"
        description="Company cash position, finance tools and equity"
        actions={
          <Button variant="outline" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4" /> Opening balance
          </Button>
        }
      />

      <QueryState
        isLoading={overview.isLoading}
        isError={overview.isError}
        error={overview.error}
        data={data}
        onRetry={() => overview.refetch()}
        isEmpty={() => false}
        skeleton={<SkeletonStats count={4} />}
      >
        {(o) => (
          <div className="space-y-6">
            {/* Current balance */}
            <Card className="relative overflow-hidden border-primary/20 bg-primary-muted/40 p-6">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10" />
              <div className="relative flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="flex items-center gap-2 text-sm font-medium text-foreground-muted">
                    <Landmark className="h-4 w-4" /> Current balance
                  </p>
                  <p className="text-4xl font-bold tracking-tight text-foreground">
                    {formatMoney(o.current_balance, currency)}
                  </p>
                  <p className="text-xs text-foreground-subtle">
                    Opening {formatMoney(o.opening_balance, currency)}
                    {o.opening_date ? ` · as of ${formatOrdinalDate(o.opening_date)}` : ""}
                    {o.updated_at ? ` · updated ${formatOrdinalDate(o.updated_at)}` : ""}
                  </p>
                  {o.note && (
                    <p className="max-w-lg pt-1 text-sm text-foreground-muted">{o.note}</p>
                  )}
                </div>
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <Wallet className="h-7 w-7" />
                </div>
              </div>
            </Card>

            {/* Breakdown grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatusCard title="Total income" value={formatMoney(o.total_income, currency)} icon={TrendingUp} variant="success" />
              <StatusCard title="Total expenses" value={formatMoney(o.total_expenses, currency)} icon={TrendingDown} variant="warning" />
              <StatusCard title="Net profit to date" value={formatMoney(o.net_profit_to_date, currency)} icon={Scale} variant="primary" />
              <StatusCard title="Total disbursed" value={formatMoney(o.total_disbursed, currency)} icon={Receipt} variant="default" />
              <StatusCard title="Total payroll" value={formatMoney(o.total_payroll, currency)} icon={Wallet} variant="default" />
              <StatusCard title="Loans outstanding" value={formatMoney(o.loans_outstanding, currency)} icon={HandCoins} variant="accent" />
              <StatusCard title="Adjustments net" value={formatMoney(o.adjustments_net, currency)} icon={SlidersHorizontal} variant="default" />
            </div>

            {/* Cash-flow chart */}
            <CashFlowChart points={points} currency={currency} isLoading={overview.isLoading} />

            {/* Finance tools */}
            <Card className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-foreground-muted" />
                <h2 className="font-semibold text-foreground">Finance tools</h2>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <ToolButton icon={FileText} label="Financial report" description="P&L and cash-flow" onClick={() => router.push("/admin/treasury/report")} />
                <ToolButton icon={SlidersHorizontal} label="Adjustments" description="Manual entries" onClick={() => router.push("/admin/treasury/adjustments")} />
                <ToolButton icon={CalendarClock} label="Periods" description="Close / reopen months" onClick={() => router.push("/admin/treasury/periods")} />
                <ToolButton icon={ScrollText} label="Audit trail" description="Immutable log" onClick={() => router.push("/admin/treasury/audit")} />
                <ToolButton icon={PieChart} label="Equity" description="Distributions" onClick={() => router.push("/admin/equity")} />
              </div>
            </Card>
          </div>
        )}
      </QueryState>

      <SetOpeningBalanceSheet
        open={editing}
        onClose={() => setEditing(false)}
        defaults={{
          opening_balance: data?.opening_balance,
          opening_date: data?.opening_date,
          currency,
          note: data?.note,
        }}
        isPending={setOpening.isPending}
        onSubmit={(body) => setOpening.mutate(body, { onSuccess: () => setEditing(false) })}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tool button                                                         */
/* ------------------------------------------------------------------ */
function ToolButton({
  icon: Icon,
  label,
  description,
  onClick,
}: {
  icon: typeof FileText;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-border-hover hover:bg-card-hover"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground-muted">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="font-medium text-foreground">{label}</p>
        <p className="truncate text-xs text-foreground-muted">{description}</p>
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Cash-flow chart — simple div bars                                   */
/* ------------------------------------------------------------------ */
function CashFlowChart({
  points,
  currency,
  isLoading,
}: {
  points: CashFlowPoint[];
  currency: ExpenseCurrency;
  isLoading: boolean;
}) {
  const max = React.useMemo(
    () => Math.max(1, ...points.flatMap((p) => [p.income, p.expenses])),
    [points]
  );

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-foreground-muted" />
        <h2 className="font-semibold text-foreground">Cash flow</h2>
        <div className="ml-auto flex items-center gap-4 text-xs text-foreground-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-success" /> Income
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-warning" /> Expenses
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="h-48 animate-pulse rounded-xl bg-secondary/50" />
      ) : points.length === 0 ? (
        <p className="py-10 text-center text-sm text-foreground-muted">
          No cash-flow data yet.
        </p>
      ) : (
        <div className="flex items-end gap-3 overflow-x-auto pb-2">
          {points.map((p) => (
            <div key={p.month} className="flex min-w-[48px] flex-1 flex-col items-center gap-2">
              <div className="flex h-40 w-full items-end justify-center gap-1">
                <Bar value={p.income} max={max} tone="income" currency={currency} />
                <Bar value={p.expenses} max={max} tone="expenses" currency={currency} />
              </div>
              <span className="text-[11px] font-medium text-foreground-muted">
                {formatMonth(p.month)}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function Bar({
  value,
  max,
  tone,
  currency,
}: {
  value: number;
  max: number;
  tone: "income" | "expenses";
  currency: ExpenseCurrency;
}) {
  const pct = Math.max(2, Math.round((Math.abs(value) / max) * 100));
  return (
    <div
      className={cn(
        "w-3.5 rounded-t-md transition-all",
        tone === "income" ? "bg-success" : "bg-warning"
      )}
      style={{ height: `${pct}%` }}
      title={`${CURRENCY_SYMBOL[currency]}${formatCompact(value)}`}
    />
  );
}

function formatMonth(month: string): string {
  // Expects "YYYY-MM"; falls back to raw value.
  const [y, m] = month.split("-");
  const idx = Number(m) - 1;
  const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  if (idx >= 0 && idx < 12) return `${names[idx]} ${y?.slice(2) ?? ""}`.trim();
  return month;
}

/* ------------------------------------------------------------------ */
/* Set opening balance sheet                                           */
/* ------------------------------------------------------------------ */
function SetOpeningBalanceSheet({
  open,
  onClose,
  defaults,
  isPending,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  defaults: {
    opening_balance?: number | null;
    opening_date?: string | null;
    currency?: ExpenseCurrency;
    note?: string | null;
  };
  isPending: boolean;
  onSubmit: (body: {
    opening_balance: number;
    opening_date?: string;
    currency?: ExpenseCurrency;
    note?: string;
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
      opening_balance: "",
      currency: "PKR",
      opening_date: "",
      note: "",
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        opening_balance:
          typeof defaults.opening_balance === "number"
            ? String(defaults.opening_balance)
            : "",
        currency: defaults.currency ?? "PKR",
        opening_date: defaults.opening_date ?? "",
        note: defaults.note ?? "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = handleSubmit((v) => {
    onSubmit({
      opening_balance: Number(v.opening_balance.replace(/,/g, "")),
      currency: v.currency,
      opening_date: v.opening_date || undefined,
      note: v.note?.trim() || undefined,
    });
  });

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Set opening balance"
      description="The starting cash position the current balance builds on."
      size="md"
    >
      <form onSubmit={submit} className="space-y-5">
        <div>
          <Label htmlFor="opening_balance" className="mb-2 block" required>
            Opening balance
          </Label>
          <Input
            id="opening_balance"
            inputMode="decimal"
            placeholder="0"
            error={errors.opening_balance?.message}
            {...register("opening_balance")}
          />
        </div>

        <Controller
          control={control}
          name="currency"
          render={({ field }) => (
            <Select
              label="Currency"
              options={CURRENCY_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              error={errors.currency?.message}
            />
          )}
        />

        <div>
          <Label className="mb-2 block" optional>
            As-of date
          </Label>
          <Controller
            control={control}
            name="opening_date"
            render={({ field }) => (
              <DatePicker
                value={field.value ? new Date(field.value) : null}
                onChange={(d) => field.onChange(d ? toWireDate(d) : "")}
                placeholder="Select date"
              />
            )}
          />
        </div>

        <div>
          <Label className="mb-2 block" optional>
            Note
          </Label>
          <Textarea
            rows={3}
            placeholder="Context for this opening balance"
            error={errors.note?.message}
            {...register("note")}
          />
        </div>

        <SheetFooter className="-mx-6 -mb-5 mt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isPending}>
            Save
          </Button>
        </SheetFooter>
      </form>
    </Sheet>
  );
}

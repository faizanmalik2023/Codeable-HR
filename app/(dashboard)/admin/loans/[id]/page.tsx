"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Banknote,
  Wallet,
  CheckCircle2,
  Repeat,
  CalendarClock,
  Pencil,
  Trash2,
  Plus,
  Receipt,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Sheet, SheetFooter } from "@/components/ui/sheet";
import { ConfirmModal } from "@/components/ui/modal";
import { DataTable, type DataTableColumn } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusCard } from "@/components/shared/status-card";
import { PageHeader } from "@/components/shared/page-header";
import { QueryState } from "@/components/shared/query-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatMoney,
  formatOrdinalDate,
  parseAmount,
  toWireDate,
  toWireMonth,
} from "@/lib/format";
import {
  LOAN_STATUS_LABELS,
  LOAN_STATUS_TONE,
  estInstallments,
  type Loan,
  type LoanRepayment,
  type LoanStatus,
} from "@/lib/api/admin-loans";
import { useLoanDetail } from "./use-loan-detail";

/** `{value:"YYYY-MM", label:"Month YYYY"}` window — 12 back through 2 ahead. */
function monthOptions(): { value: string; label: string }[] {
  const opts: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 2; i >= -12; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    opts.push({
      value: toWireMonth(d),
      label: d.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    });
  }
  return opts;
}

const monthLabel = (value?: string | null) => {
  if (!value) return "—";
  const [y, m] = value.split("-").map(Number);
  if (!y || !m) return value;
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
};

const isDynamic = (l: Loan) => !l.monthly_deduction || l.monthly_deduction <= 0;

export default function LoanDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { query, update, recordPayment, remove } = useLoanDetail(id);

  const [sheet, setSheet] = React.useState<"pay" | "edit" | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  const ledgerColumns: DataTableColumn<LoanRepayment>[] = [
    {
      key: "date",
      header: "Date",
      render: (r) => (
        <span className="font-medium text-foreground">
          {formatOrdinalDate(r.date)}
        </span>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (r) => (
        <Badge variant={r.type === "manual" ? "secondary" : "muted"}>
          {r.type === "manual" ? "Manual" : "Auto"}
        </Badge>
      ),
    },
    {
      key: "month",
      header: "Month",
      render: (r) => (
        <span className="text-foreground-muted">{monthLabel(r.month)}</span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      render: (r) => (
        <span className="font-medium text-foreground">
          {formatMoney(r.amount)}
        </span>
      ),
    },
    {
      key: "note",
      header: "Note",
      className: "max-w-xs",
      render: (r) => (
        <span className="line-clamp-1 text-foreground-muted">
          {r.note || "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Loan" back />

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        data={query.data}
        onRetry={() => query.refetch()}
        skeleton={
          <div className="space-y-4">
            <Skeleton className="h-28" />
            <Skeleton className="h-40" />
            <Skeleton className="h-64" />
          </div>
        }
      >
        {(loan) => {
          const installments = estInstallments(
            loan.balance_remaining,
            loan.monthly_deduction
          );
          const repayments = loan.repayments ?? [];

          return (
            <div className="space-y-6">
              {/* Header card */}
              <Card className="p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar
                      src={loan.employee?.avatar ?? undefined}
                      name={loan.employee?.full_name}
                      size="xl"
                      className="h-16 w-16 text-lg"
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-bold text-foreground">
                          {loan.employee?.full_name ?? "—"}
                        </h2>
                        <Badge variant={LOAN_STATUS_TONE[loan.status] ?? "muted"}>
                          {LOAN_STATUS_LABELS[loan.status] ?? loan.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground-muted">
                        {loan.name || "Employee loan"}
                      </p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-foreground-subtle">
                        {loan.employee?.employee_code && (
                          <span className="text-xs">
                            {loan.employee.employee_code}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <CalendarClock className="h-3.5 w-3.5" />
                          Started {monthLabel(loan.start_month)}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {loan.status === "active" && (
                      <Button size="sm" onClick={() => setSheet("pay")}>
                        <Plus className="h-4 w-4" /> Record Payment
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSheet("edit")}
                    >
                      <Pencil className="h-4 w-4" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setConfirmDelete(true)}
                    >
                      <Trash2 className="h-4 w-4" /> Delete
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Summary */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <StatusCard
                  title="Principal"
                  value={formatMoney(loan.principal)}
                  icon={Banknote}
                  variant="primary"
                />
                <StatusCard
                  title="Balance"
                  value={formatMoney(loan.balance_remaining)}
                  icon={Wallet}
                  variant="warning"
                />
                <StatusCard
                  title="Repaid"
                  value={formatMoney(loan.amount_repaid)}
                  icon={CheckCircle2}
                  variant="success"
                />
                <StatusCard
                  title="Monthly deduction"
                  value={isDynamic(loan) ? "Dynamic" : formatMoney(loan.monthly_deduction)}
                  subtitle={isDynamic(loan) ? "Repaid ad-hoc" : undefined}
                  icon={Repeat}
                  variant="accent"
                />
                <StatusCard
                  title="Est. installments"
                  value={installments === null ? "—" : `${installments} left`}
                  subtitle={installments === null ? "Dynamic loan" : undefined}
                  icon={CalendarClock}
                />
              </div>

              {/* Metadata / note */}
              {loan.note && (
                <Card className="p-5">
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-foreground-muted">
                    Note
                  </p>
                  <p className="whitespace-pre-wrap text-sm text-foreground">
                    {loan.note}
                  </p>
                </Card>
              )}

              {/* Repayment ledger */}
              <div>
                <h3 className="mb-3 font-semibold text-foreground">
                  Repayment ledger
                </h3>
                <Card className="p-2">
                  <DataTable
                    columns={ledgerColumns}
                    data={repayments}
                    rowKey={(r) =>
                      `${r.date}-${r.type}-${r.amount}-${r.month ?? ""}-${r.note ?? ""}`
                    }
                    empty={
                      <EmptyState
                        icon={Receipt}
                        title="No repayments yet"
                        description={
                          loan.status === "active"
                            ? "Record a payment or wait for the next payroll deduction."
                            : "This loan has no recorded repayments."
                        }
                      />
                    }
                  />
                </Card>
              </div>

              {/* Record payment sheet */}
              <RecordPaymentSheet
                open={sheet === "pay"}
                onClose={() => setSheet(null)}
                isPending={recordPayment.isPending}
                months={monthOptions()}
                onSubmit={(body) =>
                  recordPayment.mutate(body, {
                    onSuccess: () => setSheet(null),
                  })
                }
              />

              {/* Edit sheet */}
              <EditLoanSheet
                open={sheet === "edit"}
                onClose={() => setSheet(null)}
                loan={loan}
                isPending={update.isPending}
                onSubmit={(body) =>
                  update.mutate(body, { onSuccess: () => setSheet(null) })
                }
              />

              {/* Delete confirm */}
              <ConfirmModal
                open={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                onConfirm={() =>
                  remove.mutate(undefined, {
                    onSettled: () => setConfirmDelete(false),
                  })
                }
                title="Delete loan?"
                description="Delete loan and its entire repayment ledger?"
                confirmLabel="Delete"
                variant="destructive"
                isLoading={remove.isPending}
              />
            </div>
          );
        }}
      </QueryState>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Record payment sheet                                                */
/* ------------------------------------------------------------------ */

const paySchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((v) => parseAmount(v) > 0, "Amount must be greater than 0"),
  month: z.string().optional(),
  date: z.string().optional(),
  note: z.string().optional(),
});
type PayValues = z.infer<typeof paySchema>;

function RecordPaymentSheet({
  open,
  onClose,
  isPending,
  months,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  isPending: boolean;
  months: { value: string; label: string }[];
  onSubmit: (body: import("@/lib/api/admin-loans").RecordPaymentBody) => void;
}) {
  const thisMonth = React.useMemo(() => toWireMonth(new Date()), []);
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PayValues>({
    resolver: zodResolver(paySchema),
    defaultValues: { amount: "", month: thisMonth, date: "", note: "" },
  });

  React.useEffect(() => {
    if (open) reset({ amount: "", month: thisMonth, date: "", note: "" });
  }, [open, reset, thisMonth]);

  const submit = handleSubmit((v) =>
    onSubmit({
      amount: parseAmount(v.amount),
      type: "manual",
      month: v.month || undefined,
      date: v.date || undefined,
      note: v.note?.trim() || undefined,
    })
  );

  return (
    <Sheet open={open} onClose={onClose} title="Record Payment" size="md">
      <div className="space-y-4">
        <div>
          <Label className="mb-2 block" required>
            Amount
          </Label>
          <Input
            inputMode="numeric"
            placeholder="e.g. 10000"
            error={errors.amount?.message}
            {...register("amount")}
          />
        </div>

        <div>
          <Label className="mb-2 block" optional>
            Month
          </Label>
          <Controller
            control={control}
            name="month"
            render={({ field }) => (
              <Select
                options={months}
                value={field.value}
                onChange={field.onChange}
                placeholder="Select a month"
              />
            )}
          />
        </div>

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
            placeholder="Any details about this payment"
            {...register("note")}
          />
        </div>
      </div>

      <SheetFooter>
        <Button variant="outline" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button onClick={submit} isLoading={isPending}>
          <Plus className="h-4 w-4" /> Record Payment
        </Button>
      </SheetFooter>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/* Edit loan sheet                                                     */
/* ------------------------------------------------------------------ */

const editSchema = z.object({
  name: z.string().optional(),
  principal: z
    .string()
    .min(1, "Principal is required")
    .refine((v) => parseAmount(v) > 0, "Principal must be greater than 0"),
  monthly_deduction: z.string().optional(),
  status: z.string().min(1, "Status is required"),
  note: z.string().optional(),
});
type EditValues = z.infer<typeof editSchema>;

const STATUS_OPTIONS = (Object.keys(LOAN_STATUS_LABELS) as LoanStatus[]).map(
  (value) => ({ value, label: LOAN_STATUS_LABELS[value] })
);

function EditLoanSheet({
  open,
  onClose,
  loan,
  isPending,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  loan: Loan;
  isPending: boolean;
  onSubmit: (body: import("@/lib/api/admin-loans").UpdateLoanBody) => void;
}) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditValues>({
    resolver: zodResolver(editSchema),
  });

  React.useEffect(() => {
    if (open) {
      reset({
        name: loan.name ?? "",
        principal: String(loan.principal ?? ""),
        monthly_deduction:
          loan.monthly_deduction && loan.monthly_deduction > 0
            ? String(loan.monthly_deduction)
            : "",
        status: loan.status,
        note: loan.note ?? "",
      });
    }
  }, [open, loan, reset]);

  const submit = handleSubmit((v) => {
    const monthly = v.monthly_deduction ? parseAmount(v.monthly_deduction) : 0;
    onSubmit({
      name: v.name?.trim() || undefined,
      principal: parseAmount(v.principal),
      monthly_deduction: monthly > 0 ? monthly : 0,
      status: v.status as LoanStatus,
      note: v.note?.trim() || undefined,
    });
  });

  return (
    <Sheet open={open} onClose={onClose} title="Edit Loan" size="md">
      <div className="space-y-4">
        <div>
          <Label className="mb-2 block" optional>
            Label
          </Label>
          <Input placeholder="e.g. Advance for relocation" {...register("name")} />
        </div>

        <div>
          <Label className="mb-2 block" required>
            Principal
          </Label>
          <Input
            inputMode="numeric"
            error={errors.principal?.message}
            {...register("principal")}
          />
        </div>

        <div>
          <Label className="mb-2 block" optional>
            Monthly deduction
          </Label>
          <Input
            inputMode="numeric"
            placeholder="Leave empty for a dynamic loan"
            {...register("monthly_deduction")}
          />
        </div>

        <div>
          <Label className="mb-2 block" required>
            Status
          </Label>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select
                options={STATUS_OPTIONS}
                value={field.value}
                onChange={field.onChange}
                error={errors.status?.message}
              />
            )}
          />
        </div>

        <div>
          <Label className="mb-2 block" optional>
            Note
          </Label>
          <Textarea rows={3} {...register("note")} />
        </div>
      </div>

      <SheetFooter>
        <Button variant="outline" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button onClick={submit} isLoading={isPending}>
          Save Changes
        </Button>
      </SheetFooter>
    </Sheet>
  );
}

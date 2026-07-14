"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useForm, useFieldArray, type UseFormRegister, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil, Send, Download, Plus, Trash2, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetFooter } from "@/components/ui/sheet";
import { ConfirmModal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SalarySlipStatusEnum } from "@/lib/enums";
import { formatMoney } from "@/lib/format";
import { usePayslip } from "./use-payslip";
import type { PayrollSlipDetail } from "@/lib/api/payroll";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function monthLabel(month: number | string, year: number): string {
  const idx = typeof month === "number" ? month - 1 : Number(month) - 1;
  return `${MONTH_NAMES[idx] ?? String(month)} ${year}`;
}

export default function PayslipDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { query, amend, release, download } = usePayslip(id);

  const [amendOpen, setAmendOpen] = React.useState(false);
  const [confirmRelease, setConfirmRelease] = React.useState(false);

  if (query.isLoading && !query.data) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (query.isError && !query.data) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <PageHeader title="Payslip" back />
        <ErrorState message="We couldn't load this payslip." onRetry={() => query.refetch()} />
      </div>
    );
  }

  const slip = query.data!;
  const isPending = slip.status === "pending";

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-24">
      <PageHeader title="Payslip" back />

      {/* Employee header */}
      <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-3">
          <Avatar src={slip.employee?.avatar ?? undefined} name={slip.employee?.full_name} size="lg" />
          <div>
            <p className="font-semibold text-foreground">{slip.employee?.full_name ?? "—"}</p>
            <p className="text-sm text-foreground-muted">
              {slip.employee?.employee_code ? `${slip.employee.employee_code} · ` : ""}
              {monthLabel(slip.month, slip.year)}
            </p>
          </div>
        </div>
        <Badge variant={SalarySlipStatusEnum.tone(slip.status)}>
          {SalarySlipStatusEnum.label(slip.status)}
        </Badge>
      </Card>

      {/* Breakdown */}
      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Wallet className="h-4 w-4 text-foreground-muted" />
          <h2 className="font-semibold text-foreground">Breakdown</h2>
        </div>

        <div className="divide-y divide-border">
          {typeof slip.basic_salary === "number" && (
            <LineRow label="Basic Salary" amount={slip.basic_salary} />
          )}

          {(slip.earnings ?? []).map((e, i) => (
            <LineRow key={`e-${i}`} label={e.name} amount={e.amount} sign="+" tone="success" />
          ))}

          {(slip.deductions ?? []).map((d, i) => (
            <LineRow key={`d-${i}`} label={d.name} amount={d.amount} sign="-" tone="destructive" />
          ))}

          <div className="flex items-center justify-between pt-4">
            <span className="text-base font-semibold text-foreground">Net Pay</span>
            <span className="text-xl font-bold text-primary">{formatMoney(slip.net_amount)}</span>
          </div>
        </div>
      </Card>

      {/* Actions */}
      {isPending ? (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/90 backdrop-blur-sm md:pl-[240px]">
          <div className="mx-auto flex max-w-2xl items-center justify-end gap-3 p-4">
            <Button variant="outline" onClick={() => setAmendOpen(true)}>
              <Pencil className="h-4 w-4" /> Amend
            </Button>
            <Button onClick={() => setConfirmRelease(true)} isLoading={release.isPending}>
              <Send className="h-4 w-4" /> Release
            </Button>
          </div>
        </div>
      ) : (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/90 backdrop-blur-sm md:pl-[240px]">
          <div className="mx-auto flex max-w-2xl items-center justify-end gap-3 p-4">
            <Button onClick={() => download.mutate()} isLoading={download.isPending}>
              {download.isPending ? null : <Download className="h-4 w-4" />} Download
            </Button>
          </div>
        </div>
      )}

      {/* Amend sheet */}
      <AmendSheet
        open={amendOpen}
        onClose={() => setAmendOpen(false)}
        slip={slip}
        isSaving={amend.isPending}
        onSave={(body) =>
          amend.mutate(body, { onSuccess: () => setAmendOpen(false) })
        }
      />

      {/* Release confirm */}
      <ConfirmModal
        open={confirmRelease}
        onClose={() => setConfirmRelease(false)}
        onConfirm={() =>
          release.mutate(undefined, { onSettled: () => setConfirmRelease(false) })
        }
        title="Release this payslip?"
        description={`This payslip will be sent to ${slip.employee?.full_name ?? "the employee"}. This cannot be undone.`}
        confirmLabel="Release"
        isLoading={release.isPending}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Line row                                                            */
/* ------------------------------------------------------------------ */
function LineRow({
  label,
  amount,
  sign,
  tone,
}: {
  label: string;
  amount: number;
  sign?: "+" | "-";
  tone?: "success" | "destructive";
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-foreground-muted">{label}</span>
      <span
        className={
          tone === "success"
            ? "font-medium text-success"
            : tone === "destructive"
              ? "font-medium text-destructive"
              : "font-medium text-foreground"
        }
      >
        {sign ?? ""}
        {formatMoney(amount)}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Amend sheet                                                         */
/* ------------------------------------------------------------------ */
const lineItemSchema = z.object({
  name: z.string().min(1, "Required"),
  amount: z.number({ error: "Enter an amount" }).min(0, "Must be ≥ 0"),
});

const amendSchema = z.object({
  basic_salary: z.number({ error: "Enter an amount" }).min(0, "Must be ≥ 0"),
  earnings: z.array(lineItemSchema),
  deductions: z.array(lineItemSchema),
});

type AmendForm = z.infer<typeof amendSchema>;

function AmendSheet({
  open,
  onClose,
  slip,
  isSaving,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  slip: PayrollSlipDetail;
  isSaving: boolean;
  onSave: (body: {
    basic_salary: number;
    earnings: { name: string; amount: number }[];
    deductions: { name: string; amount: number }[];
  }) => void;
}) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AmendForm>({
    resolver: zodResolver(amendSchema),
    defaultValues: {
      basic_salary: slip.basic_salary ?? 0,
      earnings: slip.earnings ?? [],
      deductions: slip.deductions ?? [],
    },
  });

  // Reset to the current slip each time the sheet opens.
  React.useEffect(() => {
    if (open) {
      reset({
        basic_salary: slip.basic_salary ?? 0,
        earnings: slip.earnings ?? [],
        deductions: slip.deductions ?? [],
      });
    }
  }, [open, slip, reset]);

  const earnings = useFieldArray({ control, name: "earnings" });
  const deductions = useFieldArray({ control, name: "deductions" });

  const submit = handleSubmit((v) => onSave(v));

  return (
    <Sheet open={open} onClose={onClose} title="Amend Payslip" size="md">
      <div className="space-y-6">
        {/* Basic salary */}
        <div>
          <Label className="mb-2 block">Basic Salary</Label>
          <Input
            type="number"
            inputMode="decimal"
            step="0.01"
            {...register("basic_salary", { valueAsNumber: true })}
            error={errors.basic_salary?.message}
          />
        </div>

        {/* Earnings */}
        <LineItemSection
          title="Earnings"
          rows={earnings.fields}
          register={register}
          name="earnings"
          errors={errors.earnings}
          onAdd={() => earnings.append({ name: "", amount: 0 })}
          onRemove={(i) => earnings.remove(i)}
        />

        {/* Deductions */}
        <LineItemSection
          title="Deductions"
          rows={deductions.fields}
          register={register}
          name="deductions"
          errors={errors.deductions}
          onAdd={() => deductions.append({ name: "", amount: 0 })}
          onRemove={(i) => deductions.remove(i)}
        />
      </div>

      <SheetFooter>
        <Button variant="outline" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button onClick={submit} isLoading={isSaving}>
          Save Changes
        </Button>
      </SheetFooter>
    </Sheet>
  );
}

function LineItemSection({
  title,
  rows,
  register,
  name,
  errors,
  onAdd,
  onRemove,
}: {
  title: string;
  rows: { id: string }[];
  register: UseFormRegister<AmendForm>;
  name: "earnings" | "deductions";
  errors?: FieldErrors<AmendForm>[ "earnings" | "deductions" ];
  onAdd: () => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <Label>{title}</Label>
        <Button variant="ghost" size="sm" onClick={onAdd} type="button">
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-[var(--radius)] border border-dashed border-border px-3 py-4 text-center text-sm text-foreground-muted">
          No {title.toLowerCase()} yet.
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((row, i) => (
            <div key={row.id} className="flex items-start gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Label"
                  {...register(`${name}.${i}.name`)}
                  error={errors?.[i]?.name?.message}
                />
              </div>
              <div className="w-32">
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  placeholder="0"
                  {...register(`${name}.${i}.amount`, { valueAsNumber: true })}
                  error={errors?.[i]?.amount?.message}
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                type="button"
                onClick={() => onRemove(i)}
                aria-label={`Remove ${title.toLowerCase()} row`}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

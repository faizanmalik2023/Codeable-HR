"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TrendingUp, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Avatar } from "@/components/ui/avatar";
import { RadioGroup } from "@/components/ui/radio-group";
import { DatePicker } from "@/components/ui/date-picker";
import { Sheet, SheetFooter } from "@/components/ui/sheet";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney, parseAmount, formatOrdinalDate, toWireDate } from "@/lib/format";
import { usePromote, sumComponents } from "./use-promote";

const schema = z.object({
  designation_id: z.string().optional(),
  increment_type: z.enum(["amount", "percentage"]),
  increment_value: z
    .string()
    .refine((v) => parseAmount(v) > 0, "Enter a value greater than 0"),
  effective_date: z.string().min(1, "Please select an effective date"),
});
type FormValues = z.infer<typeof schema>;

const INCREMENT_OPTIONS = [
  { value: "amount", label: "Amount" },
  { value: "percentage", label: "Percentage" },
];

export default function PromotePage() {
  const router = useRouter();
  const { employee, designationOptions, promote } = usePromote();
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      designation_id: "",
      increment_type: "amount",
      increment_value: "",
      effective_date: "",
    },
  });

  const emp = employee.data;
  const currentSalary = React.useMemo(
    () => sumComponents(emp?.salary?.components),
    [emp]
  );

  const incrementType = watch("increment_type");
  const incrementValue = watch("increment_value");
  const designationId = watch("designation_id");
  const effectiveDate = watch("effective_date");

  const rawValue = parseAmount(incrementValue ?? "");
  const incrementAmount =
    incrementType === "percentage"
      ? (currentSalary * rawValue) / 100
      : rawValue;
  const newSalary = currentSalary + incrementAmount;

  const newDesignation = designationOptions.find(
    (d) => d.value === designationId
  );

  const onValid = () => setConfirmOpen(true);

  const doPromote = () => {
    promote.mutate({
      new_salary: newSalary,
      designation_id: designationId || undefined,
      effective_date: effectiveDate,
    });
  };

  if (employee.isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-24">
      <PageHeader title="Promote Employee" back />

      {/* Selected employee */}
      <Card className="flex items-center gap-4 p-5">
        <Avatar name={emp?.full_name} src={emp?.avatar ?? undefined} size="lg" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-semibold text-foreground">
            {emp?.full_name ?? "—"}
          </h2>
          <p className="truncate text-sm text-foreground-muted">
            {emp?.designation?.name ?? "—"}
            {emp?.department?.name ? ` · ${emp.department.name}` : ""}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-foreground-muted">Current salary</p>
          <p className="font-semibold text-foreground">
            {formatMoney(currentSalary)}
          </p>
        </div>
      </Card>

      <Card className="space-y-5 p-6">
        {/* New position */}
        <Controller
          control={control}
          name="designation_id"
          render={({ field }) => (
            <Select
              label="New position (optional)"
              placeholder="Keep current position"
              options={designationOptions}
              value={field.value}
              onChange={field.onChange}
              error={errors.designation_id?.message}
            />
          )}
        />

        {/* Increment type */}
        <div>
          <Label className="mb-2 block">Increment type</Label>
          <Controller
            control={control}
            name="increment_type"
            render={({ field }) => (
              <RadioGroup
                name="increment_type"
                options={INCREMENT_OPTIONS}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </div>

        {/* Increment value */}
        <div>
          <Label className="mb-2 block" required>
            {incrementType === "percentage" ? "Increment (%)" : "Increment amount"}
          </Label>
          <Input
            inputMode="decimal"
            placeholder={incrementType === "percentage" ? "e.g. 10" : "e.g. 25000"}
            {...register("increment_value")}
            error={errors.increment_value?.message}
          />
        </div>

        {/* Computed new salary (read-only) + breakdown */}
        <div className="rounded-xl border border-border bg-secondary/40 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground-muted">Current</span>
            <span className="text-foreground">{formatMoney(currentSalary)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-foreground-muted">
              Increment
              {incrementType === "percentage" && rawValue > 0
                ? ` (${rawValue}%)`
                : ""}
            </span>
            <span className="text-success">+{formatMoney(incrementAmount)}</span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <span className="font-medium text-foreground">New salary</span>
            <span className="text-lg font-bold text-foreground">
              {formatMoney(newSalary)}
            </span>
          </div>
        </div>

        {/* Effective date */}
        <div>
          <Label className="mb-2 block" required>
            Effective date
          </Label>
          <Controller
            control={control}
            name="effective_date"
            render={({ field }) => (
              <DatePicker
                value={field.value ? new Date(field.value) : null}
                onChange={(d) => field.onChange(d ? toWireDate(d) : "")}
                placeholder="Select a date"
                error={errors.effective_date?.message}
              />
            )}
          />
        </div>
      </Card>

      {/* Sticky footer */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/90 backdrop-blur-sm md:pl-[240px]">
        <div className="mx-auto flex max-w-2xl items-center justify-end gap-3 p-4">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/promotions")}
            disabled={promote.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit(onValid)} disabled={promote.isPending}>
            <TrendingUp className="h-4 w-4" /> Promote
          </Button>
        </div>
      </div>

      {/* Promotion confirmation sheet */}
      <Sheet
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirm promotion"
        description="Review the changes before applying."
        size="md"
      >
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <Avatar name={emp?.full_name} src={emp?.avatar ?? undefined} size="md" />
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">
                {emp?.full_name}
              </p>
              <p className="truncate text-sm text-foreground-muted">
                {emp?.employee_code}
              </p>
            </div>
          </div>

          <SummaryRow
            label="Position"
            value={
              <span className="flex items-center gap-2">
                <span className="text-foreground-muted">
                  {emp?.designation?.name ?? "—"}
                </span>
                {newDesignation && (
                  <>
                    <ArrowRight className="h-3.5 w-3.5 text-foreground-subtle" />
                    <span className="font-medium text-foreground">
                      {newDesignation.label}
                    </span>
                  </>
                )}
              </span>
            }
          />
          <SummaryRow
            label="Salary"
            value={
              <span className="flex items-center gap-2">
                <span className="text-foreground-muted">
                  {formatMoney(currentSalary)}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-foreground-subtle" />
                <span className="font-semibold text-foreground">
                  {formatMoney(newSalary)}
                </span>
              </span>
            }
          />
          <SummaryRow
            label="Increment"
            value={
              <span className="text-success">+{formatMoney(incrementAmount)}</span>
            }
          />
          <SummaryRow
            label="Effective"
            value={
              <span className="text-foreground">
                {formatOrdinalDate(effectiveDate)}
              </span>
            }
          />
        </div>

        <SheetFooter>
          <Button
            variant="outline"
            onClick={() => setConfirmOpen(false)}
            disabled={promote.isPending}
          >
            Back
          </Button>
          <Button onClick={doPromote} isLoading={promote.isPending}>
            <TrendingUp className="h-4 w-4" /> Confirm
          </Button>
        </SheetFooter>
      </Sheet>
    </div>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
        {label}
      </span>
      <span className="text-right">{value}</span>
    </div>
  );
}

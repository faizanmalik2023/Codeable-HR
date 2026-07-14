"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup } from "@/components/ui/radio-group";
import { DatePicker } from "@/components/ui/date-picker";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/empty-state";
import {
  LEAVE_DURATION_LABELS,
  HALF_DAY_LABELS,
  type LeaveDuration,
} from "@/lib/enums";
import { toWireDate } from "@/lib/format";
import { useApplyLeave } from "./use-apply-leave";
import type { LeaveTypeModel } from "@/types";

const schema = z
  .object({
    leave_type_id: z.string().min(1, "Please select a leave type"),
    duration: z.enum(["full_day", "half_day", "multiple_days"]),
    half_day: z.enum(["am", "pm"]).nullable().optional(),
    start_date: z.date().nullable(),
    end_date: z.date().nullable().optional(),
    reason: z.string().trim().min(1, "Please provide a reason"),
  })
  .superRefine((val, ctx) => {
    if (!val.start_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["start_date"],
        message: "Please select a start date",
      });
    }
    if (val.duration === "half_day" && !val.half_day) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["half_day"],
        message: "Please select a half-day period",
      });
    }
    if (val.duration === "multiple_days") {
      if (!val.end_date) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["end_date"],
          message: "Please select an end date",
        });
      } else if (val.start_date && val.end_date < val.start_date) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["end_date"],
          message: "End date must be after the start date",
        });
      }
    }
  });

type FormValues = z.infer<typeof schema>;

const DURATION_OPTIONS = (["full_day", "half_day", "multiple_days"] as LeaveDuration[]).map(
  (value) => ({ value, label: LEAVE_DURATION_LABELS[value] })
);

const HALF_DAY_OPTIONS = (["am", "pm"] as const).map((value) => ({
  value,
  label: HALF_DAY_LABELS[value],
}));

function daysInclusive(a: Date, b: Date): number {
  const diff = Math.abs(b.getTime() - a.getTime());
  return Math.floor(diff / 86_400_000) + 1;
}

function typeDescription(t: LeaveTypeModel): string | undefined {
  if (typeof t.remaining === "number" && typeof t.quota === "number") {
    return `${t.remaining} of ${t.quota} days remaining`;
  }
  if (typeof t.remaining === "number") return `${t.remaining} days remaining`;
  if (t.eligible === false && t.ineligible_reason) return t.ineligible_reason;
  return t.paid === false ? "Unpaid leave" : undefined;
}

export default function ApplyLeavePage() {
  const { types, apply } = useApplyLeave();

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      leave_type_id: "",
      duration: "full_day",
      half_day: null,
      start_date: null,
      end_date: null,
      reason: "",
    },
  });

  const duration = watch("duration");
  const leaveTypeId = watch("leave_type_id");
  const startDate = watch("start_date");
  const endDate = watch("end_date");

  const typeOptions = React.useMemo(
    () =>
      (types.data ?? []).map((t) => ({
        value: t.leave_type_id,
        label: t.name,
        description: typeDescription(t),
      })),
    [types.data]
  );

  const selectedType = React.useMemo(
    () => (types.data ?? []).find((t) => t.leave_type_id === leaveTypeId),
    [types.data, leaveTypeId]
  );

  const totalDays = React.useMemo(() => {
    if (duration === "half_day") return 0.5;
    if (duration === "multiple_days") {
      return startDate && endDate ? daysInclusive(startDate, endDate) : 0;
    }
    return startDate ? 1 : 0;
  }, [duration, startDate, endDate]);

  const remaining = selectedType?.remaining;
  const showUnpaidWarning =
    typeof remaining === "number" && totalDays > 0 && remaining < totalDays;

  const onSubmit = handleSubmit((v) => {
    const from = toWireDate(v.start_date as Date);
    const to =
      v.duration === "multiple_days" && v.end_date ? toWireDate(v.end_date) : from;
    apply.mutate({
      leave_type_id: v.leave_type_id,
      date_from: from,
      date_to: to,
      reason: v.reason.trim(),
      duration: v.duration,
      half_day: v.duration === "half_day" ? v.half_day ?? null : null,
    });
  });

  if (types.isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 rounded-[var(--radius-lg)]" />
      </div>
    );
  }

  if (types.isError) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <PageHeader title="Apply Leave" back />
        <ErrorState message={types.error?.message} onRetry={() => types.refetch()} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-24">
      <PageHeader title="Apply Leave" description="Request time off" back />

      <Card className="space-y-6 p-6">
        {/* Leave type */}
        <Controller
          control={control}
          name="leave_type_id"
          render={({ field }) => (
            <Select
              label="Leave type"
              placeholder="Select a leave type"
              options={typeOptions}
              value={field.value}
              onChange={field.onChange}
              error={errors.leave_type_id?.message}
            />
          )}
        />

        {/* Duration */}
        <div>
          <Label className="mb-2 block">Duration</Label>
          <Controller
            control={control}
            name="duration"
            render={({ field }) => (
              <RadioGroup
                name="duration"
                options={DURATION_OPTIONS}
                value={field.value}
                onChange={(v) => {
                  field.onChange(v);
                  if (v !== "half_day") setValue("half_day", null);
                  if (v !== "multiple_days") setValue("end_date", null);
                }}
              />
            )}
          />
        </div>

        {/* Half-day period */}
        {duration === "half_day" && (
          <div>
            <Label className="mb-2 block">Half-day period</Label>
            <Controller
              control={control}
              name="half_day"
              render={({ field }) => (
                <RadioGroup
                  name="half_day"
                  options={HALF_DAY_OPTIONS}
                  value={field.value ?? undefined}
                  onChange={field.onChange}
                />
              )}
            />
            {errors.half_day && (
              <p className="mt-1.5 text-xs text-destructive">{errors.half_day.message}</p>
            )}
          </div>
        )}

        {/* Dates */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label className="mb-2 block">
              {duration === "multiple_days" ? "Start date" : "Date"}
            </Label>
            <Controller
              control={control}
              name="start_date"
              render={({ field }) => (
                <DatePicker
                  value={field.value}
                  onChange={(d) => {
                    field.onChange(d);
                    if (endDate && d && endDate < d) setValue("end_date", null);
                  }}
                  placeholder="Select date"
                  error={errors.start_date?.message}
                />
              )}
            />
          </div>

          {duration === "multiple_days" && (
            <div>
              <Label className="mb-2 block">End date</Label>
              <Controller
                control={control}
                name="end_date"
                render={({ field }) => (
                  <DatePicker
                    value={field.value ?? null}
                    onChange={field.onChange}
                    placeholder="Select date"
                    minDate={startDate ?? undefined}
                    error={errors.end_date?.message}
                  />
                )}
              />
            </div>
          )}
        </div>

        {/* Reason */}
        <div>
          <Label className="mb-2 block">Reason</Label>
          <Textarea
            rows={4}
            placeholder="Briefly describe the reason for your leave"
            error={errors.reason?.message}
            {...register("reason")}
          />
        </div>

        {/* Summary */}
        {leaveTypeId && totalDays > 0 && (
          <div className="rounded-[var(--radius-lg)] border border-border bg-secondary/30 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground-muted">Total requested</span>
              <span className="font-semibold text-foreground">
                {totalDays} {totalDays === 1 ? "day" : "days"}
              </span>
            </div>
            {typeof remaining === "number" && (
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-foreground-muted">Remaining balance</span>
                <span className="text-sm font-medium text-foreground">
                  {remaining} {remaining === 1 ? "day" : "days"}
                </span>
              </div>
            )}
            {showUnpaidWarning && (
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-warning-muted p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                <p className="text-xs text-warning">
                  This request exceeds your remaining balance. The extra{" "}
                  {Math.max(totalDays - (remaining ?? 0), 0)}{" "}
                  {Math.max(totalDays - (remaining ?? 0), 0) === 1 ? "day" : "days"} may be
                  treated as unpaid leave.
                </p>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Sticky footer */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/90 backdrop-blur-sm md:pl-[240px]">
        <div className="mx-auto flex max-w-2xl items-center justify-end gap-3 p-4">
          <Button onClick={onSubmit} isLoading={apply.isPending} disabled={apply.isPending}>
            <Send className="h-4 w-4" /> Submit Request
          </Button>
        </div>
      </div>
    </div>
  );
}

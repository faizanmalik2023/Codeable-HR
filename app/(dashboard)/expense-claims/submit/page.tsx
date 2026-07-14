"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils";
import { formatMoney, parseAmount, toWireDate } from "@/lib/format";
import { EXPENSE_CATEGORY_LABELS } from "@/lib/enums";
import { useEnums, toOptions } from "@/lib/api/enums";
import { AttachmentField } from "../../insurance-claims/_components/attachment-field";
import { AmountInput } from "../../insurance-claims/_components/amount-input";
import { useSubmitExpenseClaim } from "./use-submit-expense-claim";

const schema = z.object({
  amount: z.string().refine((v) => parseAmount(v) > 0, "Please enter an amount"),
  category: z.string().min(1, "Please select a category"),
  expense_date: z.string().min(1, "Please select a date"),
  description: z
    .string()
    .min(1, "Please add a note")
    .max(500, "Keep it under 500 characters"),
});
type FormValues = z.infer<typeof schema>;

const today = new Date();
const oneYearAgo = new Date(today);
oneYearAgo.setDate(today.getDate() - 365);

export default function SubmitExpenseClaimPage() {
  const router = useRouter();
  const { submit } = useSubmitExpenseClaim();
  const enums = useEnums();
  const [file, setFile] = React.useState<File | null>(null);

  const categoryOptions = React.useMemo(
    () => toOptions(enums.data?.expense_category, EXPENSE_CATEGORY_LABELS),
    [enums.data]
  );
  const fallbackCategories = React.useMemo(
    () => Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => ({ value, label })),
    []
  );
  const options = categoryOptions.length > 0 ? categoryOptions : fallbackCategories;

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { amount: "", category: "", expense_date: "", description: "" },
  });

  const amountValue = watch("amount");
  const descLen = watch("description")?.length ?? 0;
  const runningTotal = parseAmount(amountValue ?? "");

  const onSubmit = handleSubmit((v) =>
    submit.mutate({
      category: v.category,
      amount: parseAmount(v.amount),
      description: v.description,
      expense_date: v.expense_date,
      file,
    })
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-24">
      <PageHeader title="New Expense Claim" back />

      <Card className="space-y-5 p-6">
        {/* Amount */}
        <div>
          <Label className="mb-2 block">Amount (PKR)</Label>
          <Controller
            control={control}
            name="amount"
            render={({ field }) => (
              <AmountInput value={field.value} onChange={field.onChange} error={errors.amount?.message} />
            )}
          />
        </div>

        {/* Category */}
        <Controller
          control={control}
          name="category"
          render={({ field }) => (
            <Select
              label="Category"
              placeholder="Select a category"
              options={options}
              value={field.value}
              onChange={field.onChange}
              error={errors.category?.message}
            />
          )}
        />

        {/* Date */}
        <div>
          <Label className="mb-2 block">Date of expense</Label>
          <Controller
            control={control}
            name="expense_date"
            render={({ field }) => (
              <DatePicker
                value={field.value ? new Date(field.value) : null}
                onChange={(d) => field.onChange(d ? toWireDate(d) : "")}
                minDate={oneYearAgo}
                maxDate={today}
                placeholder="Select a date"
                error={errors.expense_date?.message}
              />
            )}
          />
        </div>

        {/* Receipt */}
        <div>
          <Label className="mb-2 block" optional>
            Receipt
          </Label>
          <AttachmentField value={file} onChange={setFile} disabled={submit.isPending} />
        </div>

        {/* Description */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label>Description</Label>
            <span className={cn("text-xs", descLen > 500 ? "text-destructive" : "text-foreground-subtle")}>
              {descLen}/500
            </span>
          </div>
          <Textarea rows={4} placeholder="What was this expense for?" {...register("description")} />
          {errors.description && <p className="mt-1.5 text-xs text-destructive">{errors.description.message}</p>}
        </div>
      </Card>

      {/* Sticky footer with running total */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/90 backdrop-blur-sm md:pl-[240px]">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="text-xs text-foreground-muted">Total</p>
            <p className="text-lg font-bold text-foreground">{formatMoney(runningTotal)}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => router.push("/expense-claims")} disabled={submit.isPending}>
              Cancel
            </Button>
            <Button onClick={onSubmit} isLoading={submit.isPending}>
              <Send className="h-4 w-4" /> Submit Expense
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

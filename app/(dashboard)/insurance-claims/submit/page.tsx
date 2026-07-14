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
import { parseAmount, toWireDate } from "@/lib/format";
import { CLAIM_REASON_LABELS } from "@/lib/enums";
import { useEnums, toOptions } from "@/lib/api/enums";
import { AttachmentField } from "../_components/attachment-field";
import { AmountInput } from "../_components/amount-input";
import { useSubmitInsuranceClaim } from "./use-submit-insurance-claim";

const schema = z.object({
  reason: z.string().min(1, "Please select a reason"),
  expense_date: z.string().min(1, "Please select a date"),
  amount: z.string().refine((v) => parseAmount(v) > 0, "Please enter an amount"),
  note: z.string().min(1, "Please add a note").max(500, "Keep it under 500 characters"),
});
type FormValues = z.infer<typeof schema>;

const today = new Date();
const oneYearAgo = new Date(today);
oneYearAgo.setDate(today.getDate() - 365);

export default function SubmitInsuranceClaimPage() {
  const router = useRouter();
  const { submit } = useSubmitInsuranceClaim();
  const enums = useEnums();
  const [file, setFile] = React.useState<File | null>(null);

  const reasonOptions = React.useMemo(
    () => toOptions(enums.data?.claim_reason, CLAIM_REASON_LABELS),
    [enums.data]
  );
  const fallbackReasons = React.useMemo(
    () => Object.entries(CLAIM_REASON_LABELS).map(([value, label]) => ({ value, label })),
    []
  );
  const options = reasonOptions.length > 0 ? reasonOptions : fallbackReasons;

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { reason: "", expense_date: "", amount: "", note: "" },
  });

  const noteLen = watch("note")?.length ?? 0;

  const onSubmit = handleSubmit((v) =>
    submit.mutate({
      reason: v.reason,
      amount: parseAmount(v.amount),
      note: v.note,
      expense_date: v.expense_date,
      file,
    })
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-24">
      <PageHeader title="New Insurance Claim" back />

      <Card className="space-y-5 p-6">
        {/* Reason */}
        <Controller
          control={control}
          name="reason"
          render={({ field }) => (
            <Select
              label="Reason"
              placeholder="Select a reason"
              options={options}
              value={field.value}
              onChange={field.onChange}
              error={errors.reason?.message}
            />
          )}
        />

        {/* Date of expense */}
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

        {/* Attachment */}
        <div>
          <Label className="mb-2 block" optional>
            Attachment
          </Label>
          <AttachmentField value={file} onChange={setFile} disabled={submit.isPending} />
        </div>

        {/* Note */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label>Note</Label>
            <span className={cn("text-xs", noteLen > 500 ? "text-destructive" : "text-foreground-subtle")}>
              {noteLen}/500
            </span>
          </div>
          <Textarea rows={4} placeholder="Describe your claim…" {...register("note")} />
          {errors.note && <p className="mt-1.5 text-xs text-destructive">{errors.note.message}</p>}
        </div>
      </Card>

      {/* Sticky footer */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/90 backdrop-blur-sm md:pl-[240px]">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 p-4">
          <Button variant="outline" onClick={() => router.push("/insurance-claims")} disabled={submit.isPending}>
            Cancel
          </Button>
          <Button onClick={onSubmit} isLoading={submit.isPending}>
            <Send className="h-4 w-4" /> Submit Claim
          </Button>
        </div>
      </div>
    </div>
  );
}

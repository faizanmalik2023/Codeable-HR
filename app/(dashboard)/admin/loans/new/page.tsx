"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Banknote } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/page-header";
import { parseAmount, toWireMonth } from "@/lib/format";
import { BorrowerSelect } from "./borrower-select";
import { useCreateLoan } from "./use-create-loan";

const schema = z.object({
  user_id: z.string().min(1, "Please select an employee"),
  principal: z
    .string()
    .min(1, "Principal is required")
    .refine((v) => parseAmount(v) > 0, "Principal must be greater than 0"),
  monthly_deduction: z.string().optional(),
  start_month: z.string().optional(),
  name: z.string().optional(),
  note: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

/** `{value:"YYYY-MM", label:"Month YYYY"}` window — 12 months back through 2 ahead. */
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

export default function NewLoanPage() {
  const { borrowerOptions, employees, create } = useCreateLoan();
  const months = React.useMemo(() => monthOptions(), []);
  const thisMonth = React.useMemo(() => toWireMonth(new Date()), []);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      user_id: "",
      principal: "",
      monthly_deduction: "",
      start_month: thisMonth,
      name: "",
      note: "",
    },
  });

  const onSubmit = handleSubmit((v) => {
    const monthly = v.monthly_deduction ? parseAmount(v.monthly_deduction) : 0;
    create.mutate({
      user_id: v.user_id,
      principal: parseAmount(v.principal),
      monthly_deduction: monthly > 0 ? monthly : undefined,
      start_month: v.start_month || thisMonth,
      name: v.name?.trim() || undefined,
      note: v.note?.trim() || undefined,
    });
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-24">
      <PageHeader title="Create Loan" back />

      <Card className="space-y-5 p-6">
        {/* Borrower */}
        <div>
          <Label className="mb-2 block" required>
            Borrower
          </Label>
          <Controller
            control={control}
            name="user_id"
            render={({ field }) => (
              <BorrowerSelect
                value={field.value}
                onChange={field.onChange}
                options={borrowerOptions}
                loading={employees.isLoading}
                error={errors.user_id?.message}
              />
            )}
          />
        </div>

        {/* Principal */}
        <div>
          <Label className="mb-2 block" required>
            Principal
          </Label>
          <Input
            inputMode="numeric"
            placeholder="e.g. 100000"
            error={errors.principal?.message}
            {...register("principal")}
          />
        </div>

        {/* Monthly deduction */}
        <div>
          <Label className="mb-2 block" optional>
            Monthly deduction
          </Label>
          <Input
            inputMode="numeric"
            placeholder="Leave empty for a dynamic loan"
            {...register("monthly_deduction")}
          />
          <p className="mt-1.5 text-xs text-foreground-subtle">
            Empty = dynamic (repaid ad-hoc). A value sets a fixed monthly
            payroll auto-deduction.
          </p>
        </div>

        {/* Start month */}
        <div>
          <Label className="mb-2 block" optional>
            Start month
          </Label>
          <Controller
            control={control}
            name="start_month"
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

        {/* Label */}
        <div>
          <Label className="mb-2 block" optional>
            Label
          </Label>
          <Input
            placeholder="e.g. Advance for relocation"
            {...register("name")}
          />
        </div>

        {/* Note */}
        <div>
          <Label className="mb-2 block" optional>
            Note
          </Label>
          <Textarea
            rows={3}
            placeholder="Any details about this loan"
            {...register("note")}
          />
        </div>
      </Card>

      {/* Sticky footer */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/90 backdrop-blur-sm md:pl-[240px]">
        <div className="mx-auto flex max-w-2xl items-center justify-end gap-3 p-4">
          <Button onClick={onSubmit} isLoading={create.isPending}>
            <Banknote className="h-4 w-4" /> Create Loan
          </Button>
        </div>
      </div>
    </div>
  );
}

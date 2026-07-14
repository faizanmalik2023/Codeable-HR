"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Trash2 } from "lucide-react";
import { Sheet, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { parseAmount, toWireMonth } from "@/lib/format";
import {
  EQUITY_CURRENCY_OPTIONS,
  type Commitment,
  type CommitmentBody,
} from "@/lib/api/admin-equity";
import type { ExpenseCurrency } from "@/lib/enums";

const schema = z.object({
  beneficiary_id: z.string().min(1, "Select a beneficiary"),
  name: z.string().trim().min(1, "Name is required").max(120),
  amount: z
    .number({ error: "Enter an amount" })
    .positive("Amount must be greater than 0"),
  currency: z.enum(["PKR", "USD"]),
  start_month: z.string().optional(),
  end_month: z.string().optional(),
  is_active: z.boolean(),
  note: z.string().trim().max(500).optional(),
});
type FormValues = z.infer<typeof schema>;

/** Month options (`YYYY-MM`) — avoids native month picker per house style. */
function monthOptions(): { value: string; label: string }[] {
  const opts: { value: string; label: string }[] = [{ value: "", label: "None" }];
  const now = new Date();
  for (let i = -3; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    opts.push({
      value: toWireMonth(d),
      label: d.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    });
  }
  return opts;
}

interface CommitmentSheetProps {
  open: boolean;
  onClose: () => void;
  editing?: Commitment | null;
  beneficiaryOptions: { value: string; label: string; description?: string }[];
  onSubmit: (body: CommitmentBody) => void;
  onDelete?: () => void;
  isPending?: boolean;
  isDeleting?: boolean;
}

const EMPTY: FormValues = {
  beneficiary_id: "",
  name: "",
  amount: NaN,
  currency: "PKR",
  start_month: "",
  end_month: "",
  is_active: true,
  note: "",
};

/** Create / edit sheet for a beneficiary commitment. */
export function CommitmentSheet({
  open,
  onClose,
  editing,
  beneficiaryOptions,
  onSubmit,
  onDelete,
  isPending,
  isDeleting,
}: CommitmentSheetProps) {
  const months = React.useMemo(() => monthOptions(), []);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY,
  });

  React.useEffect(() => {
    if (!open) return;
    reset(
      editing
        ? {
            beneficiary_id: editing.beneficiary_id,
            name: editing.name,
            amount: editing.amount,
            currency: editing.currency,
            start_month: editing.start_month ?? "",
            end_month: editing.end_month ?? "",
            is_active: editing.is_active,
            note: editing.note ?? "",
          }
        : EMPTY
    );
  }, [open, editing, reset]);

  const submit = handleSubmit((v) =>
    onSubmit({
      beneficiary_id: v.beneficiary_id,
      name: v.name.trim(),
      amount: v.amount,
      currency: v.currency,
      start_month: v.start_month || undefined,
      end_month: v.end_month || undefined,
      is_active: v.is_active,
      note: v.note?.trim() || undefined,
    })
  );

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={editing ? "Edit Commitment" : "Add Commitment"}
      description={
        editing ? "Update this commitment" : "Add a recurring commitment"
      }
      size="md"
    >
      <form onSubmit={submit} className="space-y-5">
        <Controller
          control={control}
          name="beneficiary_id"
          render={({ field }) => (
            <Select
              label="Beneficiary"
              placeholder="Select a beneficiary"
              options={beneficiaryOptions}
              value={field.value}
              onChange={field.onChange}
              error={errors.beneficiary_id?.message}
            />
          )}
        />

        <div>
          <Label className="mb-2 block" required>
            Name
          </Label>
          <Input
            placeholder="e.g. Monthly stipend"
            error={errors.name?.message}
            {...register("name")}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="mb-2 block" required>
              Amount
            </Label>
            <Controller
              control={control}
              name="amount"
              render={({ field }) => (
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  placeholder="0"
                  error={errors.amount?.message}
                  value={Number.isFinite(field.value) ? field.value : ""}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === "" ? NaN : parseAmount(e.target.value)
                    )
                  }
                />
              )}
            />
          </div>
          <Controller
            control={control}
            name="currency"
            render={({ field }) => (
              <Select
                label="Currency"
                options={
                  EQUITY_CURRENCY_OPTIONS as { value: string; label: string }[]
                }
                value={field.value}
                onChange={(v) => field.onChange(v as ExpenseCurrency)}
              />
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Controller
            control={control}
            name="start_month"
            render={({ field }) => (
              <Select
                label="Start month"
                placeholder="Optional"
                options={months}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <Controller
            control={control}
            name="end_month"
            render={({ field }) => (
              <Select
                label="End month"
                placeholder="Optional"
                options={months}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
          <div>
            <p className="text-sm font-medium text-foreground">Active</p>
            <p className="text-xs text-foreground-muted">
              Currently owed to the beneficiary
            </p>
          </div>
          <Controller
            control={control}
            name="is_active"
            render={({ field }) => (
              <Switch
                checked={field.value}
                onChange={field.onChange}
                aria-label="Active"
              />
            )}
          />
        </div>

        <div>
          <Label className="mb-2 block" optional>
            Note
          </Label>
          <Textarea rows={3} placeholder="Optional context" {...register("note")} />
        </div>

        <SheetFooter className="-mx-6 -mb-5 mt-2">
          {editing && onDelete && (
            <Button
              type="button"
              variant="outline"
              onClick={onDelete}
              disabled={isPending || isDeleting}
              className="mr-auto text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending || isDeleting}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isPending}>
            {editing ? "Save Changes" : "Add Commitment"}
          </Button>
        </SheetFooter>
      </form>
    </Sheet>
  );
}

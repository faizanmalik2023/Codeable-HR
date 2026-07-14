"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, Undo2, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import { ConfirmModal } from "@/components/ui/modal";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { parseAmount, toWireDate } from "@/lib/format";
import { CURRENCY_SYMBOL } from "@/lib/enums";
import { useIncomeForm } from "./use-income-form";

const CURRENCY_OPTIONS = [
  { value: "PKR", label: `PKR (${CURRENCY_SYMBOL.PKR})` },
  { value: "USD", label: `USD (${CURRENCY_SYMBOL.USD})` },
];

const schema = z.object({
  name: z.string().min(1, "Please enter a name"),
  amount: z.string().refine((v) => parseAmount(v) > 0, "Please enter an amount"),
  project_id: z.string().optional(),
  source: z.string().optional(),
  currency: z.string().min(1, "Please select a currency"),
  date: z.string().optional(),
  description: z.string().max(500, "Keep it under 500 characters").optional(),
});
type FormValues = z.infer<typeof schema>;

const today = new Date();

export default function IncomeFormPage() {
  const {
    isEditing,
    editing,
    projectOptions,
    create,
    update,
    reverse,
    remove,
  } = useIncomeForm();

  const [confirmReverse, setConfirmReverse] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      amount: "",
      project_id: "",
      source: "",
      currency: "PKR",
      date: "",
      description: "",
    },
  });

  // Prefill in edit mode.
  React.useEffect(() => {
    if (editing.data) {
      reset({
        name: editing.data.name ?? "",
        amount: editing.data.amount != null ? String(editing.data.amount) : "",
        project_id: editing.data.project_id ?? "",
        source: editing.data.source ?? "",
        currency: (editing.data.currency as string) ?? "PKR",
        date: editing.data.date ?? "",
        description: editing.data.description ?? "",
      });
    }
  }, [editing.data, reset]);

  const descLen = watch("description")?.length ?? 0;
  const isReversed = editing.data?.is_reversed ?? false;
  const pending = create.isPending || update.isPending;

  const onSubmit = handleSubmit((v) => {
    const body = {
      name: v.name,
      amount: parseAmount(v.amount),
      project_id: v.project_id || undefined,
      source: v.source || undefined,
      currency: v.currency,
      date: v.date || undefined,
      description: v.description || undefined,
    };
    if (isEditing) update.mutate(body);
    else create.mutate(body);
  });

  if (isEditing && editing.isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-24">
      <PageHeader
        title={isEditing ? "Edit Income" : "Add Income"}
        back
        actions={
          isReversed ? <Badge variant="destructive">Reversed</Badge> : undefined
        }
      />

      <Card className="space-y-5 p-6">
        {/* Name */}
        <div>
          <Label className="mb-2 block" required>
            Name
          </Label>
          <Input placeholder="e.g. Milestone 2 payment" {...register("name")} error={errors.name?.message} />
        </div>

        {/* Amount + currency */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Label className="mb-2 block" required>
              Amount
            </Label>
            <Input
              inputMode="decimal"
              placeholder="0"
              {...register("amount")}
              error={errors.amount?.message}
            />
          </div>
          <div>
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
          </div>
        </div>

        {/* Project */}
        <Controller
          control={control}
          name="project_id"
          render={({ field }) => (
            <Select
              label="Project (optional)"
              placeholder="Select a project"
              options={projectOptions}
              value={field.value}
              onChange={field.onChange}
              error={errors.project_id?.message}
            />
          )}
        />

        {/* Source */}
        <div>
          <Label className="mb-2 block" optional>
            Source
          </Label>
          <Input placeholder="e.g. Upwork, Direct client" {...register("source")} />
        </div>

        {/* Date */}
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
                maxDate={today}
                placeholder="Select a date"
                error={errors.date?.message}
              />
            )}
          />
        </div>

        {/* Description */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label optional>Description</Label>
            <span
              className={cn(
                "text-xs",
                descLen > 500 ? "text-destructive" : "text-foreground-subtle"
              )}
            >
              {descLen}/500
            </span>
          </div>
          <Textarea rows={3} placeholder="Add any notes…" {...register("description")} />
          {errors.description && (
            <p className="mt-1.5 text-xs text-destructive">
              {errors.description.message}
            </p>
          )}
        </div>

        {/* Destructive actions (edit mode) */}
        {isEditing && (
          <div className="flex flex-wrap gap-3 border-t border-border pt-5">
            {!isReversed && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmReverse(true)}
                disabled={reverse.isPending}
              >
                <Undo2 className="h-4 w-4" /> Reverse
              </Button>
            )}
            <Button
              type="button"
              variant="destructive"
              onClick={() => setConfirmDelete(true)}
              disabled={remove.isPending}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </div>
        )}
      </Card>

      {/* Sticky footer */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/90 backdrop-blur-sm md:pl-[240px]">
        <div className="mx-auto flex max-w-2xl items-center justify-end gap-3 p-4">
          <Button onClick={onSubmit} isLoading={pending}>
            <Save className="h-4 w-4" /> {isEditing ? "Save changes" : "Add Income"}
          </Button>
        </div>
      </div>

      <ConfirmModal
        open={confirmReverse}
        onClose={() => setConfirmReverse(false)}
        onConfirm={() =>
          reverse.mutate(undefined, { onSettled: () => setConfirmReverse(false) })
        }
        title="Reverse this income?"
        description="This soft-deletes the entry and marks it reversed. It stays on record but no longer counts toward totals."
        confirmLabel="Reverse"
        variant="destructive"
        isLoading={reverse.isPending}
      />

      <ConfirmModal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() =>
          remove.mutate(undefined, { onSettled: () => setConfirmDelete(false) })
        }
        title="Delete this income?"
        description="This permanently removes the entry. This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        isLoading={remove.isPending}
      />
    </div>
  );
}

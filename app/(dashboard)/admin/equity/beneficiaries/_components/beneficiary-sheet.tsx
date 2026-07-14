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
import {
  BENEFICIARY_KIND_OPTIONS,
  type Beneficiary,
  type BeneficiaryBody,
  type BeneficiaryKind,
} from "@/lib/api/admin-equity";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  kind: z.enum(["person", "esop", "charity", "other"]),
  user_id: z.string().optional(),
  share_percent: z
    .number({ error: "Enter a share %" })
    .min(0, "Must be at least 0")
    .max(100, "Cannot exceed 100"),
  payout_rate: z
    .number({ error: "Enter a payout rate %" })
    .min(0, "Must be at least 0")
    .max(100, "Cannot exceed 100"),
  is_active: z.boolean(),
  note: z.string().trim().max(500).optional(),
});
type FormValues = z.infer<typeof schema>;

interface BeneficiarySheetProps {
  open: boolean;
  onClose: () => void;
  editing?: Beneficiary | null;
  employeeOptions: { value: string; label: string; description?: string }[];
  onSubmit: (body: BeneficiaryBody) => void;
  onDelete?: () => void;
  isPending?: boolean;
  isDeleting?: boolean;
}

const EMPTY: FormValues = {
  name: "",
  kind: "person",
  user_id: "",
  share_percent: 0,
  payout_rate: 100,
  is_active: true,
  note: "",
};

/** Create / edit sheet for an equity beneficiary. */
export function BeneficiarySheet({
  open,
  onClose,
  editing,
  employeeOptions,
  onSubmit,
  onDelete,
  isPending,
  isDeleting,
}: BeneficiarySheetProps) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
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
            name: editing.name,
            kind: editing.kind,
            user_id: editing.user_id ?? "",
            share_percent: editing.share_percent,
            payout_rate: editing.payout_rate,
            is_active: editing.is_active,
            note: editing.note ?? "",
          }
        : EMPTY
    );
  }, [open, editing, reset]);

  const kind = watch("kind") as BeneficiaryKind;

  const submit = handleSubmit((v) =>
    onSubmit({
      name: v.name.trim(),
      kind: v.kind,
      share_percent: v.share_percent,
      payout_rate: v.payout_rate,
      user_id: v.kind === "person" ? v.user_id || null : null,
      is_active: v.is_active,
      note: v.note?.trim() || undefined,
    })
  );

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={editing ? "Edit Beneficiary" : "Add Beneficiary"}
      description={
        editing
          ? "Update this cap-table entry"
          : "Add a new entry to the cap table"
      }
      size="md"
    >
      <form onSubmit={submit} className="space-y-5">
        <div>
          <Label className="mb-2 block" required>
            Name
          </Label>
          <Input
            placeholder="e.g. Jane Founder"
            error={errors.name?.message}
            {...register("name")}
          />
        </div>

        <Controller
          control={control}
          name="kind"
          render={({ field }) => (
            <Select
              label="Kind"
              placeholder="Select a kind"
              options={BENEFICIARY_KIND_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              error={errors.kind?.message}
            />
          )}
        />

        {kind === "person" && (
          <Controller
            control={control}
            name="user_id"
            render={({ field }) => (
              <Select
                label="Linked employee"
                placeholder="Select an employee (optional)"
                options={employeeOptions}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="mb-2 block" required>
              Share %
            </Label>
            <Controller
              control={control}
              name="share_percent"
              render={({ field }) => (
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  max={100}
                  placeholder="0"
                  error={errors.share_percent?.message}
                  value={Number.isFinite(field.value) ? field.value : ""}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === "" ? NaN : Number(e.target.value)
                    )
                  }
                />
              )}
            />
          </div>
          <div>
            <Label className="mb-2 block" required>
              Payout rate %
            </Label>
            <Controller
              control={control}
              name="payout_rate"
              render={({ field }) => (
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  max={100}
                  placeholder="100"
                  error={errors.payout_rate?.message}
                  value={Number.isFinite(field.value) ? field.value : ""}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === "" ? NaN : Number(e.target.value)
                    )
                  }
                />
              )}
            />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
          <div>
            <p className="text-sm font-medium text-foreground">Active</p>
            <p className="text-xs text-foreground-muted">
              Include in allocations and distributions
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
          <Textarea
            rows={3}
            placeholder="Optional context for this beneficiary"
            {...register("note")}
          />
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
            {editing ? "Save Changes" : "Add Beneficiary"}
          </Button>
        </SheetFooter>
      </form>
    </Sheet>
  );
}

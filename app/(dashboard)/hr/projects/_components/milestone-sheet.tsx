"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sheet, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { toWireDate } from "@/lib/format";
import type { MilestoneBody, ProjectMilestone } from "@/lib/api/projects-mgmt";
import { ProjectMilestoneStatusEnum } from "./project-meta";

const schema = z.object({
  title: z.string().min(1, "Title is required").max(120),
  description: z.string().max(500).optional(),
  status: z.string().min(1),
  due_date: z.date().nullable().optional(),
});
type FormValues = z.infer<typeof schema>;

const parseDate = (v?: string | null): Date | null => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

interface MilestoneSheetProps {
  open: boolean;
  onClose: () => void;
  milestone?: ProjectMilestone | null;
  onSubmit: (body: MilestoneBody) => void;
  isPending?: boolean;
}

export function MilestoneSheet({
  open,
  onClose,
  milestone,
  onSubmit,
  isPending,
}: MilestoneSheetProps) {
  const isEditing = !!milestone;
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", description: "", status: "pending", due_date: null },
  });

  React.useEffect(() => {
    if (!open) return;
    reset({
      title: milestone?.title ?? "",
      description: milestone?.description ?? "",
      status: milestone?.status ?? "pending",
      due_date: parseDate(milestone?.due_date),
    });
  }, [open, milestone, reset]);

  const submit = handleSubmit((v) =>
    onSubmit({
      title: v.title.trim(),
      description: v.description?.trim() || undefined,
      status: v.status as MilestoneBody["status"],
      due_date: v.due_date ? toWireDate(v.due_date) : null,
    })
  );

  return (
    <Sheet open={open} onClose={onClose} title={isEditing ? "Edit Milestone" : "Add Milestone"} size="md">
      <form onSubmit={submit} className="space-y-5">
        <div>
          <Label className="mb-2 block" required>
            Title
          </Label>
          <Input placeholder="Milestone title" error={errors.title?.message} {...register("title")} />
        </div>
        <div>
          <Label className="mb-2 block" optional>
            Description
          </Label>
          <Textarea rows={3} placeholder="Details…" {...register("description")} />
        </div>
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <Select
              label="Status"
              options={ProjectMilestoneStatusEnum.options()}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <div>
          <Label className="mb-2 block" optional>
            Due date
          </Label>
          <Controller
            control={control}
            name="due_date"
            render={({ field }) => (
              <DatePicker value={field.value} onChange={field.onChange} placeholder="Due date" />
            )}
          />
        </div>
        <SheetFooter className="-mx-6 -mb-5 mt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isPending}>
            {isEditing ? "Save" : "Add Milestone"}
          </Button>
        </SheetFooter>
      </form>
    </Sheet>
  );
}

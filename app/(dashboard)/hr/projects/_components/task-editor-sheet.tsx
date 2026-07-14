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
import type {
  ProjectMember,
  ProjectMilestone,
  ProjectTask,
  ProjectTaskStatus,
  TaskBody,
} from "@/lib/api/projects-mgmt";
import { ProjectTaskStatusEnum } from "./project-meta";
import { memberName } from "./member-sheet";

const schema = z.object({
  title: z.string().min(1, "Title is required").max(160),
  description: z.string().max(1000).optional(),
  status: z.string().min(1),
  assignee_id: z.string().optional(),
  milestone_id: z.string().optional(),
  due_date: z.date().nullable().optional(),
});
type FormValues = z.infer<typeof schema>;

const parseDate = (v?: string | null): Date | null => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

interface TaskEditorSheetProps {
  open: boolean;
  onClose: () => void;
  task?: ProjectTask | null;
  /** Preselect a column when creating from a specific kanban lane. */
  defaultStatus?: ProjectTaskStatus;
  members: ProjectMember[];
  milestones: ProjectMilestone[];
  onSubmit: (body: TaskBody) => void;
  isPending?: boolean;
}

export function TaskEditorSheet({
  open,
  onClose,
  task,
  defaultStatus = "todo",
  members,
  milestones,
  onSubmit,
  isPending,
}: TaskEditorSheetProps) {
  const isEditing = !!task;

  const assigneeOptions = React.useMemo(
    () => [
      { value: "", label: "Unassigned" },
      ...members.map((m) => ({ value: m.userId, label: memberName(m) })),
    ],
    [members]
  );

  const milestoneOptions = React.useMemo(
    () => [
      { value: "", label: "No milestone" },
      ...milestones.map((m) => ({ value: m.id, label: m.title })),
    ],
    [milestones]
  );

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      status: defaultStatus,
      assignee_id: "",
      milestone_id: "",
      due_date: null,
    },
  });

  React.useEffect(() => {
    if (!open) return;
    reset({
      title: task?.title ?? "",
      description: task?.description ?? "",
      status: task?.status ?? defaultStatus,
      assignee_id: task?.assignee?.id ?? "",
      milestone_id: task?.milestone_id ?? "",
      due_date: parseDate(task?.due_date),
    });
  }, [open, task, defaultStatus, reset]);

  const submit = handleSubmit((v) =>
    onSubmit({
      title: v.title.trim(),
      description: v.description?.trim() || undefined,
      status: v.status as ProjectTaskStatus,
      assignee_id: v.assignee_id || null,
      milestone_id: v.milestone_id || null,
      due_date: v.due_date ? toWireDate(v.due_date) : null,
    })
  );

  return (
    <Sheet open={open} onClose={onClose} title={isEditing ? "Edit Task" : "New Task"} size="md">
      <form onSubmit={submit} className="space-y-5">
        <div>
          <Label className="mb-2 block" required>
            Title
          </Label>
          <Input placeholder="Task title" error={errors.title?.message} {...register("title")} />
        </div>
        <div>
          <Label className="mb-2 block" optional>
            Description
          </Label>
          <Textarea rows={3} placeholder="Details…" {...register("description")} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select
                label="Status"
                options={ProjectTaskStatusEnum.options()}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <Controller
            control={control}
            name="assignee_id"
            render={({ field }) => (
              <Select label="Assignee" options={assigneeOptions} value={field.value} onChange={field.onChange} />
            )}
          />
        </div>
        {milestones.length > 0 && (
          <Controller
            control={control}
            name="milestone_id"
            render={({ field }) => (
              <Select label="Milestone" options={milestoneOptions} value={field.value} onChange={field.onChange} />
            )}
          />
        )}
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
            {isEditing ? "Save" : "Create Task"}
          </Button>
        </SheetFooter>
      </form>
    </Sheet>
  );
}

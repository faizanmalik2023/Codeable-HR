"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check } from "lucide-react";
import { Sheet, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import { toWireDate } from "@/lib/format";
import type { ProjectBody, ProjectSummary } from "@/lib/api/projects-mgmt";
import {
  DEFAULT_PROJECT_COLOR,
  PROJECT_COLORS,
  ProjectPriorityEnum,
  ProjectStatusEnum,
} from "./project-meta";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(120, "Keep it under 120 characters"),
  code: z.string().max(20).optional(),
  client_name: z.string().max(120).optional(),
  description: z.string().max(500, "Keep it under 500 characters").optional(),
  status: z.string().min(1),
  priority: z.string().min(1),
  color: z.string().optional(),
  start_date: z.date().nullable().optional(),
  due_date: z.date().nullable().optional(),
});
type FormValues = z.infer<typeof schema>;

const parseDate = (v?: string | null): Date | null => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

interface ProjectFormSheetProps {
  open: boolean;
  onClose: () => void;
  /** Present → edit mode (code becomes read-only). */
  project?: ProjectSummary | null;
  onSubmit: (body: ProjectBody) => void;
  isPending?: boolean;
}

export function ProjectFormSheet({
  open,
  onClose,
  project,
  onSubmit,
  isPending,
}: ProjectFormSheetProps) {
  const isEditing = !!project;

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      code: "",
      client_name: "",
      description: "",
      status: "planning",
      priority: "medium",
      color: DEFAULT_PROJECT_COLOR,
      start_date: null,
      due_date: null,
    },
  });

  // Reset whenever the sheet opens (prefill in edit mode).
  React.useEffect(() => {
    if (!open) return;
    reset({
      name: project?.name ?? "",
      code: project?.code ?? "",
      client_name: project?.client_name ?? "",
      description: project?.description ?? "",
      status: project?.status ?? "planning",
      priority: project?.priority ?? "medium",
      color: project?.color ?? DEFAULT_PROJECT_COLOR,
      start_date: parseDate(project?.start_date),
      due_date: parseDate(project?.due_date),
    });
  }, [open, project, reset]);

  const descLen = watch("description")?.length ?? 0;

  const submit = handleSubmit((v) => {
    const body: ProjectBody = {
      name: v.name.trim(),
      client_name: v.client_name?.trim() || undefined,
      description: v.description?.trim() || undefined,
      status: v.status as ProjectBody["status"],
      priority: v.priority as ProjectBody["priority"],
      color: v.color || undefined,
      start_date: v.start_date ? toWireDate(v.start_date) : undefined,
      due_date: v.due_date ? toWireDate(v.due_date) : undefined,
    };
    if (!isEditing) body.code = v.code?.trim() || undefined;
    onSubmit(body);
  });

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit Project" : "New Project"}
      description={isEditing ? project?.code : "Create a project to track team, tasks and milestones."}
      size="lg"
    >
      <form onSubmit={submit} className="space-y-5">
        <div>
          <Label className="mb-2 block" required>
            Name
          </Label>
          <Input placeholder="Project name" error={errors.name?.message} {...register("name")} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label className="mb-2 block" optional>
              Code
            </Label>
            {isEditing ? (
              <Input value={project?.code ?? ""} readOnly disabled />
            ) : (
              <Input placeholder="e.g. APOLLO" {...register("code")} />
            )}
          </div>
          <div>
            <Label className="mb-2 block" optional>
              Client
            </Label>
            <Input placeholder="Client name" {...register("client_name")} />
          </div>
        </div>

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
          <Textarea
            rows={3}
            placeholder="What is this project about?"
            error={errors.description?.message}
            {...register("description")}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select
                label="Status"
                options={ProjectStatusEnum.options()}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <Controller
            control={control}
            name="priority"
            render={({ field }) => (
              <Select
                label="Priority"
                options={ProjectPriorityEnum.options()}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </div>

        <div>
          <Label className="mb-2 block">Color</Label>
          <Controller
            control={control}
            name="color"
            render={({ field }) => (
              <div className="flex flex-wrap gap-2.5">
                {PROJECT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => field.onChange(c)}
                    aria-label={`Color ${c}`}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-card transition-transform hover:scale-110",
                      field.value === c ? "ring-foreground" : "ring-transparent"
                    )}
                    style={{ backgroundColor: c }}
                  >
                    {field.value === c && <Check className="h-4 w-4 text-white" />}
                  </button>
                ))}
              </div>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label className="mb-2 block" optional>
              Start date
            </Label>
            <Controller
              control={control}
              name="start_date"
              render={({ field }) => (
                <DatePicker value={field.value} onChange={field.onChange} placeholder="Start date" />
              )}
            />
          </div>
          <div>
            <Label className="mb-2 block" optional>
              Deadline
            </Label>
            <Controller
              control={control}
              name="due_date"
              render={({ field }) => (
                <DatePicker value={field.value} onChange={field.onChange} placeholder="Deadline" />
              )}
            />
          </div>
        </div>

        <SheetFooter className="-mx-6 -mb-5 mt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isPending}>
            {isEditing ? "Save Changes" : "Create Project"}
          </Button>
        </SheetFooter>
      </form>
    </Sheet>
  );
}

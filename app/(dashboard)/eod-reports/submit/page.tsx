"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toWireDate } from "@/lib/format";
import { useSubmitEod } from "./use-submit-eod";

const schema = z.object({
  date: z.string().min(1, "Please select a date"),
  project_id: z.string().min(1, "Please select a project"),
  summary: z
    .string()
    .min(10, "Summary must be at least 10 characters")
    .max(1000, "Keep it under 1000 characters"),
  blockers: z.string().max(1000).optional(),
  tomorrow_plan: z.string().max(1000).optional(),
});
type FormValues = z.infer<typeof schema>;

const DEFAULT_HOURS = 8;

function recentDates(): { value: string; label: string }[] {
  const days: { value: string; label: string }[] = [];
  const today = new Date();
  for (let i = 0; i < 8; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push({
      value: toWireDate(d),
      label:
        i === 0 ? "Today" : i === 1 ? "Yesterday" : d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" }),
    });
  }
  return days;
}

export default function SubmitEodPage() {
  const { isEditing, editing, projectOptions, saveDraft, submit } = useSubmitEod();
  const dateChips = React.useMemo(() => recentDates(), []);

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { date: dateChips[0].value, project_id: "", summary: "", blockers: "", tomorrow_plan: "" },
  });

  // Prefill in edit mode.
  React.useEffect(() => {
    if (editing.data) {
      reset({
        date: editing.data.date,
        project_id: editing.data.project_id ?? "",
        summary: editing.data.summary ?? "",
        blockers: editing.data.blockers ?? "",
        tomorrow_plan: editing.data.tomorrow_plan ?? "",
      });
    }
  }, [editing.data, reset]);

  const toBody = (v: FormValues) => ({ ...v, hours: editing.data?.hours ?? DEFAULT_HOURS });
  const onSaveDraft = handleSubmit((v) => saveDraft.mutate(toBody(v)));
  const onSubmit = handleSubmit((v) => submit.mutate(toBody(v)));
  const summaryLen = watch("summary")?.length ?? 0;
  const pending = saveDraft.isPending || submit.isPending;

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
      <PageHeader title={isEditing ? "Edit EOD Report" : "Submit EOD"} back />

      <Card className="space-y-5 p-6">
        {/* Report date */}
        <div>
          <Label className="mb-2 block">Report date</Label>
          <Controller
            control={control}
            name="date"
            render={({ field }) => (
              <div className="flex flex-wrap gap-2">
                {dateChips.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => field.onChange(c.value)}
                    className={cn(
                      "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                      field.value === c.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-foreground-muted hover:border-border-hover hover:text-foreground"
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            )}
          />
        </div>

        {/* Project */}
        <Controller
          control={control}
          name="project_id"
          render={({ field }) => (
            <Select
              label="Project"
              placeholder="Select a project"
              options={projectOptions}
              value={field.value}
              onChange={field.onChange}
              error={errors.project_id?.message}
            />
          )}
        />

        {/* Summary */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label>Summary</Label>
            <span className={cn("text-xs", summaryLen > 1000 ? "text-destructive" : "text-foreground-subtle")}>
              {summaryLen}/1000
            </span>
          </div>
          <Textarea rows={6} placeholder="What did you work on today?" {...register("summary")} />
          {errors.summary && <p className="mt-1.5 text-xs text-destructive">{errors.summary.message}</p>}
        </div>

        {/* Blockers */}
        <div>
          <Label className="mb-2 block">
            Blockers <span className="text-foreground-subtle">(optional)</span>
          </Label>
          <Textarea rows={3} placeholder="Anything blocking you?" {...register("blockers")} />
        </div>

        {/* Tomorrow plan */}
        <div>
          <Label className="mb-2 block">
            Tomorrow&apos;s plan <span className="text-foreground-subtle">(optional)</span>
          </Label>
          <Textarea rows={3} placeholder="What's next?" {...register("tomorrow_plan")} />
        </div>
      </Card>

      {/* Sticky footer */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/90 backdrop-blur-sm md:pl-[240px]">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 p-4">
          <Button variant="outline" onClick={onSaveDraft} isLoading={saveDraft.isPending} disabled={pending}>
            <Save className="h-4 w-4" /> Save Draft
          </Button>
          <Button onClick={onSubmit} isLoading={submit.isPending} disabled={pending}>
            <Send className="h-4 w-4" /> Submit
          </Button>
        </div>
      </div>
    </div>
  );
}

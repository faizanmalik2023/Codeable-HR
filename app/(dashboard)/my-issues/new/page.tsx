"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send, Shield, ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader } from "@/components/shared/page-header";
import { useEnums, toOptions } from "@/lib/api/enums";
import {
  ISSUE_CATEGORY_LABELS,
  SENSITIVE_ISSUE_CATEGORIES,
  type IssueCategory,
} from "@/lib/enums";
import { cn } from "@/lib/utils";
import type { TicketCreateBody } from "@/lib/api/tickets";
import { useRaiseIssue } from "./use-raise-issue";

const schema = z.object({
  category: z.string().min(1, "Please select a category"),
  title: z.string().min(1, "Please enter a subject"),
  description: z
    .string()
    .min(1, "Please describe your issue")
    .max(1000, "Keep it under 1000 characters"),
  is_anonymous: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

const isSensitive = (category: string) =>
  SENSITIVE_ISSUE_CATEGORIES.includes(category as IssueCategory);

export default function RaiseIssuePage() {
  const { create } = useRaiseIssue();
  const enums = useEnums();

  const categoryOptions = React.useMemo(
    () => toOptions(enums.data?.ticket_category, ISSUE_CATEGORY_LABELS),
    [enums.data]
  );

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { category: "", title: "", description: "", is_anonymous: false },
  });

  const category = watch("category");
  const description = watch("description") ?? "";
  const sensitive = isSensitive(category);

  // Pre-enable anonymity for sensitive categories.
  const prevSensitive = React.useRef(false);
  React.useEffect(() => {
    if (sensitive && !prevSensitive.current) {
      setValue("is_anonymous", true);
    }
    prevSensitive.current = sensitive;
  }, [sensitive, setValue]);

  const onSubmit = handleSubmit((v) => {
    const body: TicketCreateBody = {
      title: v.title,
      description: v.description,
      category: v.category,
      is_anonymous: v.is_anonymous,
      ...(isSensitive(v.category) ? { priority: "high" as const } : {}),
    };
    create.mutate(body);
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-24">
      <PageHeader title="Raise an Issue" back />

      {/* Safe-space notice */}
      <div className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-primary/15 bg-primary-muted/30 p-4">
        <div className="rounded-lg bg-primary-muted p-2">
          <Shield className="h-4 w-4 text-primary" />
        </div>
        <p className="text-sm text-foreground-muted">
          This is a safe space. What you share here is confidential. Only you and HR
          will have access.
        </p>
      </div>

      <Card className="space-y-5 p-6">
        {/* Category */}
        <Controller
          control={control}
          name="category"
          render={({ field }) => (
            <Select
              label="Category"
              placeholder="Select a category"
              options={categoryOptions}
              value={field.value}
              onChange={field.onChange}
              error={errors.category?.message}
            />
          )}
        />

        {sensitive && <SensitiveComplaintNotice />}

        {/* Subject */}
        <div>
          <Label className="mb-2 block">Subject</Label>
          <Input placeholder="A brief summary" error={errors.title?.message} {...register("title")} />
        </div>

        {/* Description */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label>Description</Label>
            <span
              className={cn(
                "text-xs",
                description.length > 1000 ? "text-destructive" : "text-foreground-subtle"
              )}
            >
              {description.length}/1000
            </span>
          </div>
          <Textarea
            rows={6}
            placeholder="Describe your issue in detail"
            error={errors.description?.message}
            {...register("description")}
          />
        </div>

        {/* Anonymity */}
        <Controller
          control={control}
          name="is_anonymous"
          render={({ field }) => (
            <Checkbox
              checked={field.value}
              onChange={field.onChange}
              label="Submit Anonymously"
              description="Your name won't be shared with HR for this issue."
            />
          )}
        />
      </Card>

      {/* Sticky footer */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/90 backdrop-blur-sm md:pl-[240px]">
        <div className="mx-auto flex max-w-2xl items-center justify-end gap-3 p-4">
          <Button onClick={onSubmit} isLoading={create.isPending} disabled={create.isPending}>
            <Send className="h-4 w-4" /> Submit
          </Button>
        </div>
      </div>
    </div>
  );
}

function SensitiveComplaintNotice() {
  return (
    <div className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-warning/20 bg-warning-muted/40 p-4">
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
      <div>
        <p className="text-sm font-medium text-foreground">Sensitive complaint</p>
        <p className="text-sm text-foreground-muted">
          This will be flagged as high priority and routed with extra care. We&apos;ve
          enabled anonymous submission for you — you can turn it off below if you prefer.
        </p>
      </div>
    </div>
  );
}

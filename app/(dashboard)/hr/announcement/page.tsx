"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/shared/page-header";
import { useEnums, toOptions } from "@/lib/api/enums";
import { ROLE_LABELS } from "@/lib/enums";
import { cn } from "@/lib/utils";
import type { AnnouncementBody } from "@/lib/api/announcements";
import { useAnnouncement } from "./use-announcement";

const TITLE_MAX = 120;
const BODY_MAX = 500;

const schema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(TITLE_MAX, `Keep it under ${TITLE_MAX} characters`),
    body: z.string().trim().min(1, "Message is required").max(BODY_MAX, `Keep it under ${BODY_MAX} characters`),
    target: z.enum(["all", "department", "role"]),
    department_id: z.string().optional(),
    role: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.target === "department" && !v.department_id) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Select a department", path: ["department_id"] });
    }
    if (v.target === "role" && !v.role) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Select a role", path: ["role"] });
    }
  });
type FormValues = z.infer<typeof schema>;

const TARGET_OPTIONS = [
  { value: "all", label: "Everyone" },
  { value: "department", label: "Department" },
  { value: "role", label: "Role" },
];

export default function AnnouncementPage() {
  const router = useRouter();
  const { departmentOptions, departmentsLoading, send } = useAnnouncement();
  const enums = useEnums();

  const roleOptions = React.useMemo(() => {
    const opts = toOptions(enums.data?.roles, ROLE_LABELS);
    return opts.length > 0 ? opts : toOptions(Object.keys(ROLE_LABELS), ROLE_LABELS);
  }, [enums.data]);

  const {
    control,
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", body: "", target: "all", department_id: "", role: "" },
  });

  const target = watch("target");
  const titleLen = watch("title")?.length ?? 0;
  const bodyLen = watch("body")?.length ?? 0;

  const onSubmit = handleSubmit((v) => {
    const payload: AnnouncementBody = {
      title: v.title.trim(),
      body: v.body.trim(),
      target: v.target,
      ...(v.target === "department" ? { department_id: v.department_id } : {}),
      ...(v.target === "role" ? { role: v.role } : {}),
    };
    send.mutate(payload, {
      onSuccess: (res) => {
        const n = res?.recipient_count;
        toast.success(
          typeof n === "number" ? `Announcement sent to ${n} recipients` : "Announcement sent"
        );
        reset();
        router.back();
      },
    });
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-24">
      <PageHeader title="New Announcement" description="Broadcast a message to your team" back />

      <Card className="space-y-5 p-6">
        {/* Title */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label required>Title</Label>
            <span className={cn("text-xs", titleLen > TITLE_MAX ? "text-destructive" : "text-foreground-subtle")}>
              {titleLen}/{TITLE_MAX}
            </span>
          </div>
          <Input placeholder="e.g. Office closed on Friday" error={errors.title?.message} {...register("title")} />
        </div>

        {/* Message */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label required>Message</Label>
            <span className={cn("text-xs", bodyLen > BODY_MAX ? "text-destructive" : "text-foreground-subtle")}>
              {bodyLen}/{BODY_MAX}
            </span>
          </div>
          <Textarea rows={6} placeholder="What would you like to announce?" error={errors.body?.message} {...register("body")} />
        </div>

        {/* Audience */}
        <Controller
          control={control}
          name="target"
          render={({ field }) => (
            <Select
              label="Audience"
              placeholder="Select an audience"
              options={TARGET_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              error={errors.target?.message}
            />
          )}
        />

        {/* Department — conditional */}
        {target === "department" && (
          <Controller
            control={control}
            name="department_id"
            render={({ field }) => (
              <Select
                label="Department"
                placeholder={departmentsLoading ? "Loading…" : "Select a department"}
                options={departmentOptions}
                value={field.value ?? ""}
                onChange={field.onChange}
                error={errors.department_id?.message}
              />
            )}
          />
        )}

        {/* Role — conditional */}
        {target === "role" && (
          <Controller
            control={control}
            name="role"
            render={({ field }) => (
              <Select
                label="Role"
                placeholder="Select a role"
                options={roleOptions}
                value={field.value ?? ""}
                onChange={field.onChange}
                error={errors.role?.message}
              />
            )}
          />
        )}
      </Card>

      {/* Sticky footer */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/90 backdrop-blur-sm md:pl-[240px]">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 p-4">
          <Button variant="outline" onClick={() => router.back()} disabled={send.isPending}>
            Cancel
          </Button>
          <Button onClick={onSubmit} isLoading={send.isPending}>
            <Send className="h-4 w-4" /> Send Announcement
          </Button>
        </div>
      </div>
    </div>
  );
}

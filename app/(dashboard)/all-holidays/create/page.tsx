"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils";
import { toWireDate } from "@/lib/format";
import { HOLIDAY_TYPE_LABELS, type HolidayType } from "@/lib/enums";
import { AttachmentField } from "../../insurance-claims/_components/attachment-field";
import { useCreateHoliday } from "./use-create-holiday";

const TYPE_OPTIONS = (Object.keys(HOLIDAY_TYPE_LABELS) as HolidayType[]).map(
  (value) => ({ value, label: HOLIDAY_TYPE_LABELS[value] })
);

const schema = z.object({
  name: z.string().min(1, "Please enter a name").max(120, "Keep it under 120 characters"),
  date: z.string().min(1, "Please select a date"),
  type: z.string().min(1, "Please select a type"),
  days: z
    .string()
    .refine((v) => Number(v) >= 1, "Duration must be at least 1 day"),
  description: z.string().max(500, "Keep it under 500 characters").optional(),
});
type FormValues = z.infer<typeof schema>;

export default function CreateHolidayPage() {
  const router = useRouter();
  const { submit } = useCreateHoliday();
  const [file, setFile] = React.useState<File | null>(null);

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", date: "", type: "", days: "1", description: "" },
  });

  const descLen = watch("description")?.length ?? 0;

  const onSubmit = handleSubmit((v) =>
    submit.mutate({
      name: v.name,
      date: v.date,
      type: v.type,
      days: Number(v.days),
      description: v.description || undefined,
      file,
    })
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-24">
      <PageHeader title="Add Holiday" back />

      <Card className="space-y-5 p-6">
        {/* Name */}
        <div>
          <Label className="mb-2 block" required>
            Name
          </Label>
          <Input
            placeholder="e.g. Eid ul-Fitr"
            {...register("name")}
            error={errors.name?.message}
          />
        </div>

        {/* Date + Duration */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label className="mb-2 block" required>
              Date
            </Label>
            <Controller
              control={control}
              name="date"
              render={({ field }) => (
                <DatePicker
                  value={field.value ? new Date(field.value) : null}
                  onChange={(d) => field.onChange(d ? toWireDate(d) : "")}
                  placeholder="Select a date"
                  error={errors.date?.message}
                />
              )}
            />
          </div>
          <div>
            <Label className="mb-2 block" required>
              Duration (days)
            </Label>
            <Input
              type="number"
              min={1}
              {...register("days")}
              error={errors.days?.message}
            />
          </div>
        </div>

        {/* Type */}
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <Select
              label="Type"
              placeholder="Select a type"
              options={TYPE_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              error={errors.type?.message}
            />
          )}
        />

        {/* Image */}
        <div>
          <Label className="mb-2 block" optional>
            Image
          </Label>
          <AttachmentField
            value={file}
            onChange={setFile}
            disabled={submit.isPending}
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
          <Textarea
            rows={3}
            placeholder="Add a short note…"
            {...register("description")}
          />
          {errors.description && (
            <p className="mt-1.5 text-xs text-destructive">
              {errors.description.message}
            </p>
          )}
        </div>
      </Card>

      {/* Sticky footer */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/90 backdrop-blur-sm md:pl-[240px]">
        <div className="mx-auto flex max-w-2xl items-center justify-end gap-3 p-4">
          <Button
            variant="outline"
            onClick={() => router.push("/all-holidays")}
            disabled={submit.isPending}
          >
            Cancel
          </Button>
          <Button onClick={onSubmit} isLoading={submit.isPending}>
            <Save className="h-4 w-4" /> Add Holiday
          </Button>
        </div>
      </div>
    </div>
  );
}

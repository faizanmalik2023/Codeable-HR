"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Building2, Users, Trash2, ImagePlus, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sheet, SheetFooter } from "@/components/ui/sheet";
import { ConfirmModal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { QueryState } from "@/components/shared/query-state";
import { uploadFile } from "@/lib/api/uploads";
import { primaryManager, memberCount, type Department } from "@/lib/api/departments";
import { useDepartments } from "./use-departments";

const schema = z.object({
  name: z.string().trim().min(1, "Department name is required").max(80, "Keep it under 80 characters"),
  description: z.string().max(500, "Keep it under 500 characters").optional(),
});
type FormValues = z.infer<typeof schema>;

export default function DepartmentsPage() {
  const router = useRouter();
  const { query, create, remove } = useDepartments();

  const [createOpen, setCreateOpen] = React.useState(false);
  const [toDelete, setToDelete] = React.useState<Department | null>(null);
  const [coverFile, setCoverFile] = React.useState<File | null>(null);
  const [coverPreview, setCoverPreview] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "" },
  });

  const closeCreate = () => {
    setCreateOpen(false);
    reset({ name: "", description: "" });
    setCoverFile(null);
    setCoverPreview(null);
  };

  const onPickCover = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const onSubmit = handleSubmit(async (values) => {
    let image: string | undefined;
    if (coverFile) {
      try {
        setUploading(true);
        const { url } = await uploadFile(coverFile, "departments");
        image = url;
      } finally {
        setUploading(false);
      }
    }
    create.mutate(
      { name: values.name.trim(), description: values.description?.trim() || undefined, image },
      { onSuccess: closeCreate }
    );
  });

  const submitting = uploading || create.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Departments"
        description="Organize your teams and structure"
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> New Department
          </Button>
        }
      />

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        data={query.data}
        onRetry={() => query.refetch()}
        skeleton={
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-[var(--radius-lg)]" />
            ))}
          </div>
        }
        emptyIcon={Building2}
        emptyTitle="No departments yet"
        emptyDescription="Create your first team to start organizing your people."
        emptyAction={{ label: "New Department", onClick: () => setCreateOpen(true) }}
      >
        {(list) => (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((dept) => {
              const manager = primaryManager(dept);
              const count = memberCount(dept);
              return (
                <Card
                  key={dept.id}
                  hover
                  className="group flex cursor-pointer flex-col overflow-hidden"
                  onClick={() => router.push(`/departments/${dept.id}`)}
                >
                  {/* Cover */}
                  <div className="relative h-24 bg-primary-muted">
                    {dept.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={dept.image_url}
                        alt={dept.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Building2 className="h-8 w-8 text-primary/60" />
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="absolute right-2 top-2 bg-card/80 backdrop-blur-sm hover:bg-card"
                      aria-label="Delete department"
                      onClick={(e) => {
                        e.stopPropagation();
                        setToDelete(dept);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>

                  {/* Body */}
                  <div className="flex flex-1 flex-col gap-3 p-4">
                    <div>
                      <h3 className="font-semibold text-foreground transition-colors group-hover:text-primary">
                        {dept.name}
                      </h3>
                      {dept.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-foreground-muted">
                          {dept.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-auto flex flex-wrap items-center gap-2">
                      <Badge variant="muted" className="gap-1">
                        <Users className="h-3 w-3" />
                        {count} {count === 1 ? "person" : "people"}
                      </Badge>
                      {manager && (
                        <div className="flex items-center gap-1.5 text-xs text-foreground-muted">
                          <Avatar name={manager.full_name} src={manager.avatar ?? undefined} size="xs" />
                          <span className="truncate">{manager.full_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </QueryState>

      {/* Create sheet */}
      <Sheet open={createOpen} onClose={closeCreate} title="New Department" description="Create a new team for your organization" size="md">
        <div className="space-y-5">
          <div>
            <Label className="mb-2 block" required>
              Department name
            </Label>
            <Input placeholder="e.g. Marketing" error={errors.name?.message} {...register("name")} />
          </div>

          <div>
            <Label className="mb-2 block" optional>
              Description
            </Label>
            <Textarea rows={4} placeholder="What does this team do?" error={errors.description?.message} {...register("description")} />
          </div>

          <div>
            <Label className="mb-2 block" optional>
              Cover image
            </Label>
            <label className="flex cursor-pointer items-center gap-3 rounded-[var(--radius)] border border-dashed border-border p-3 transition-colors hover:border-border-hover">
              {coverPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverPreview} alt="Cover preview" className="h-14 w-20 rounded-md object-cover" />
              ) : (
                <div className="flex h-14 w-20 items-center justify-center rounded-md bg-secondary">
                  <ImagePlus className="h-5 w-5 text-foreground-muted" />
                </div>
              )}
              <span className="text-sm text-foreground-muted">
                {coverFile ? coverFile.name : "Choose an image (optional)"}
              </span>
              <input type="file" accept="image/*" className="sr-only" onChange={onPickCover} />
            </label>
          </div>
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={closeCreate} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={onSubmit} isLoading={submitting}>
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Uploading…
              </>
            ) : (
              "Create Department"
            )}
          </Button>
        </SheetFooter>
      </Sheet>

      {/* Delete confirm */}
      <ConfirmModal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) remove.mutate(toDelete.id, { onSettled: () => setToDelete(null) });
        }}
        title={toDelete ? `Delete ${toDelete.name}?` : "Delete department?"}
        description="This department will be permanently removed. Team members won't be deleted."
        confirmLabel="Delete"
        variant="destructive"
        isLoading={remove.isPending}
      />
    </div>
  );
}

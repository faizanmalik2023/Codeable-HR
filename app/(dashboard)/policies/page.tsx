"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Calendar, ChevronRight, FileText, Plus, Pencil, Trash2, UploadCloud } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetFooter } from "@/components/ui/sheet";
import { ConfirmModal } from "@/components/ui/modal";
import { DatePicker } from "@/components/ui/date-picker";
import { SkeletonList } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { QueryState } from "@/components/shared/query-state";
import { formatOrdinalDate, toWireDate } from "@/lib/format";
import { uploadFile } from "@/lib/api/uploads";
import { cn } from "@/lib/utils";
import { usePolicies } from "./use-policies";
import type { PolicyModel } from "@/types";

export default function PoliciesPage() {
  const router = useRouter();
  const { query, policies, canManage, create, update, remove } = usePolicies();
  const count = policies.length;
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<PolicyModel | null>(null);
  const [toDelete, setToDelete] = React.useState<PolicyModel | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (p: PolicyModel) => {
    setEditing(p);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Company Policies"
        description="Documents and guidelines in one place"
        actions={
          canManage ? (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> New Policy
            </Button>
          ) : undefined
        }
      />

      {/* Knowledge-hub banner */}
      <Card className="flex flex-wrap items-center justify-between gap-4 border-primary/10 bg-gradient-to-br from-primary-muted/50 to-accent-muted/30 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-primary/10 text-primary">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Your knowledge hub</p>
            <p className="text-sm text-foreground-muted">
              Company has {count} document{count === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <Badge variant="muted" className="gap-1">
          <FileText className="h-3.5 w-3.5" />
          {count}
        </Badge>
      </Card>

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        data={query.data}
        onRetry={() => query.refetch()}
        skeleton={<SkeletonList items={4} />}
        emptyIcon={BookOpen}
        emptyTitle="No policies"
        emptyDescription="Company policies will appear here once they're published."
      >
        {(list) => (
          <div className="grid gap-3 sm:grid-cols-2">
            {list.map((policy) => (
              <PolicyCard
                key={policy.id}
                policy={policy}
                canManage={canManage}
                onClick={() => router.push(`/policies/view?id=${policy.id}`)}
                onEdit={() => openEdit(policy)}
                onDelete={() => setToDelete(policy)}
              />
            ))}
          </div>
        )}
      </QueryState>

      {canManage && (
        <PolicyFormSheet
          open={formOpen}
          onClose={() => setFormOpen(false)}
          policy={editing}
          isSaving={create.isPending || update.isPending}
          onSubmit={(body) => {
            if (editing) {
              update.mutate({ id: editing.id, body }, { onSuccess: () => setFormOpen(false) });
            } else {
              create.mutate(body, { onSuccess: () => setFormOpen(false) });
            }
          }}
        />
      )}

      <ConfirmModal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) remove.mutate(toDelete.id, { onSettled: () => setToDelete(null) });
        }}
        title="Delete policy?"
        description="This document will be permanently removed."
        confirmLabel="Delete"
        variant="destructive"
        isLoading={remove.isPending}
      />
    </div>
  );
}

function PolicyCard({
  policy,
  canManage,
  onClick,
  onEdit,
  onDelete,
}: {
  policy: PolicyModel;
  canManage: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const dateLabel = policy.effective_date
    ? `Effective ${formatOrdinalDate(policy.effective_date)}`
    : policy.created_at
      ? `Added ${formatOrdinalDate(policy.created_at)}`
      : null;

  return (
    <Card hover onClick={onClick} className={cn("group cursor-pointer p-4")}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-primary-muted text-primary">
          <FileText className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-1 font-medium text-foreground transition-colors group-hover:text-primary">
            {policy.title}
          </h3>
          {policy.description && (
            <p className="mt-0.5 line-clamp-2 text-sm text-foreground-muted">{policy.description}</p>
          )}
          {dateLabel && (
            <p className="mt-2 flex items-center gap-1 text-xs text-foreground-subtle">
              <Calendar className="h-3 w-3" />
              {dateLabel}
            </p>
          )}
        </div>
        {canManage ? (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon-sm" onClick={onEdit} aria-label="Edit">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={onDelete} aria-label="Delete">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ) : (
          <ChevronRight className="mt-0.5 h-5 w-5 shrink-0 text-foreground-subtle transition-colors group-hover:text-primary" />
        )}
      </div>
    </Card>
  );
}

interface PolicyFormSheetProps {
  open: boolean;
  onClose: () => void;
  policy: PolicyModel | null;
  isSaving: boolean;
  onSubmit: (body: {
    title: string;
    document_url: string;
    description?: string;
    effective_date?: string;
    notify?: boolean;
  }) => void;
}

function PolicyFormSheet({ open, onClose, policy, isSaving, onSubmit }: PolicyFormSheetProps) {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [effectiveDate, setEffectiveDate] = React.useState<Date | undefined>();
  const [documentUrl, setDocumentUrl] = React.useState("");
  const [fileName, setFileName] = React.useState("");
  const [uploading, setUploading] = React.useState(false);
  const [notify, setNotify] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Reset when the target policy changes / sheet opens.
  React.useEffect(() => {
    if (open) {
      setTitle(policy?.title ?? "");
      setDescription(policy?.description ?? "");
      setEffectiveDate(policy?.effective_date ? new Date(policy.effective_date) : undefined);
      setDocumentUrl(policy?.document_url ?? "");
      setFileName(policy?.document_url ? "Current document" : "");
      setNotify(false);
      setError(null);
    }
  }, [open, policy]);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const res = await uploadFile(file, "policies");
      setDocumentUrl(res.url);
      setFileName(file.name);
    } catch {
      setError("Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  const submit = () => {
    if (!title.trim()) return setError("Please enter a title");
    if (!documentUrl) return setError("Please attach a PDF");
    onSubmit({
      title: title.trim(),
      document_url: documentUrl,
      description: description.trim() || undefined,
      effective_date: effectiveDate ? toWireDate(effectiveDate) : undefined,
      notify,
    });
  };

  return (
    <Sheet open={open} onClose={onClose} title={policy ? "Edit Policy" : "New Policy"} size="md">
      <div className="space-y-4">
        <div>
          <Label className="mb-2 block">Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Leave Policy" />
        </div>
        <div>
          <Label className="mb-2 block">Description <span className="text-foreground-subtle">(optional)</span></Label>
          <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <Label className="mb-2 block">Effective date <span className="text-foreground-subtle">(optional)</span></Label>
          <DatePicker value={effectiveDate} onChange={(d) => setEffectiveDate(d ?? undefined)} />
        </div>
        <div>
          <Label className="mb-2 block">Document (PDF)</Label>
          <label className="flex cursor-pointer items-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-border bg-secondary/40 px-4 py-3 text-sm transition-colors hover:border-border-hover">
            <UploadCloud className="h-5 w-5 text-foreground-muted" />
            <span className="flex-1 truncate text-foreground-muted">
              {uploading ? "Uploading…" : fileName || "Choose a PDF"}
            </span>
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </label>
        </div>
        <div className="flex items-center justify-between rounded-[var(--radius-lg)] border border-border p-3">
          <div>
            <p className="text-sm font-medium text-foreground">Notify employees</p>
            <p className="text-xs text-foreground-muted">Send a notification when published.</p>
          </div>
          <Switch checked={notify} onChange={setNotify} aria-label="Notify employees" />
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
      <SheetFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={submit} isLoading={isSaving} disabled={uploading}>
          {policy ? "Save changes" : "Publish"}
        </Button>
      </SheetFooter>
    </Sheet>
  );
}

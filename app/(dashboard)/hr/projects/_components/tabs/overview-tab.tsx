"use client";

import * as React from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Flag,
  FileText,
  Link2,
  StickyNote,
  CalendarDays,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/modal";
import { SkeletonList } from "@/components/ui/skeleton";
import { formatOrdinalDate } from "@/lib/format";
import type {
  ProjectDocument,
  ProjectMilestone,
  ProjectSummary,
} from "@/lib/api/projects-mgmt";
import type { useProjectDetail } from "../../[id]/use-project-detail";
import { MilestoneSheet } from "../milestone-sheet";
import { DocumentSheet } from "../document-sheet";
import { MilestoneStatusBadge } from "../project-meta";

interface OverviewTabProps {
  summary: ProjectSummary;
  milestones: ProjectMilestone[];
  pd: ReturnType<typeof useProjectDetail>;
}

const DOC_ICON = { file: FileText, link: Link2, note: StickyNote } as const;

export function OverviewTab({ summary, milestones, pd }: OverviewTabProps) {
  const [milestoneSheet, setMilestoneSheet] = React.useState(false);
  const [editingMilestone, setEditingMilestone] = React.useState<ProjectMilestone | null>(null);
  const [deletingMilestone, setDeletingMilestone] = React.useState<ProjectMilestone | null>(null);

  const [docSheet, setDocSheet] = React.useState(false);
  const [deletingDoc, setDeletingDoc] = React.useState<ProjectDocument | null>(null);

  const docs = pd.documents.data ?? [];

  const openNewMilestone = () => {
    setEditingMilestone(null);
    setMilestoneSheet(true);
  };
  const openEditMilestone = (m: ProjectMilestone) => {
    setEditingMilestone(m);
    setMilestoneSheet(true);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Summary */}
      <Card className="space-y-4 p-5 lg:col-span-1">
        <h3 className="text-sm font-semibold text-foreground">Overview</h3>
        {summary.description ? (
          <p className="whitespace-pre-wrap text-sm text-foreground-muted">{summary.description}</p>
        ) : (
          <p className="text-sm text-foreground-subtle">No description provided.</p>
        )}
        <dl className="space-y-3 border-t border-border pt-4 text-sm">
          <Row label="Client" value={summary.client_name || "—"} />
          <Row label="Start date" value={formatOrdinalDate(summary.start_date)} />
          <Row label="Deadline" value={formatOrdinalDate(summary.due_date)} />
          <Row
            label="Milestones"
            value={`${summary.completed_milestone_count ?? 0} / ${summary.milestone_count ?? milestones.length} done`}
          />
          <Row label="Open tasks" value={String(summary.open_task_count ?? 0)} />
        </dl>
      </Card>

      <div className="space-y-6 lg:col-span-2">
        {/* Milestones */}
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Milestones</h3>
            <Button size="sm" variant="outline" onClick={openNewMilestone}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
          {milestones.length === 0 ? (
            <EmptyRow icon={Flag} text="No milestones yet." />
          ) : (
            <div className="space-y-2">
              {milestones.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 rounded-[var(--radius)] border border-border p-3"
                >
                  <Flag className="h-4 w-4 shrink-0 text-foreground-muted" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{m.title}</p>
                    {m.due_date && (
                      <p className="flex items-center gap-1 text-xs text-foreground-muted">
                        <CalendarDays className="h-3 w-3" /> {formatOrdinalDate(m.due_date)}
                      </p>
                    )}
                  </div>
                  <MilestoneStatusBadge status={m.status} />
                  <div className="flex items-center gap-0.5">
                    <Button variant="ghost" size="icon-sm" onClick={() => openEditMilestone(m)} aria-label="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => setDeletingMilestone(m)} aria-label="Delete">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Documents */}
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Documents</h3>
            <Button size="sm" variant="outline" onClick={() => setDocSheet(true)}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
          {pd.documents.isLoading ? (
            <SkeletonList items={3} />
          ) : docs.length === 0 ? (
            <EmptyRow icon={FileText} text="No documents yet." />
          ) : (
            <div className="space-y-2">
              {docs.map((d) => {
                const Icon = DOC_ICON[d.type] ?? FileText;
                const clickable = d.type !== "note" && !!d.url;
                return (
                  <div
                    key={d.id}
                    className="flex items-center gap-3 rounded-[var(--radius)] border border-border p-3"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                      <Icon className="h-4 w-4 text-foreground-muted" />
                    </span>
                    <div className="min-w-0 flex-1">
                      {clickable ? (
                        <a
                          href={d.url ?? "#"}
                          target="_blank"
                          rel="noreferrer"
                          className="truncate text-sm font-medium text-primary hover:underline"
                        >
                          {d.name}
                        </a>
                      ) : (
                        <p className="truncate text-sm font-medium text-foreground">{d.name}</p>
                      )}
                      {d.type === "note" && d.body && (
                        <p className="line-clamp-2 text-xs text-foreground-muted">{d.body}</p>
                      )}
                      <p className="text-xs capitalize text-foreground-subtle">{d.type}</p>
                    </div>
                    <Button variant="ghost" size="icon-sm" onClick={() => setDeletingDoc(d)} aria-label="Delete">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Milestone editor */}
      <MilestoneSheet
        open={milestoneSheet}
        onClose={() => setMilestoneSheet(false)}
        milestone={editingMilestone}
        isPending={pd.createMilestone.isPending || pd.updateMilestone.isPending}
        onSubmit={(body) => {
          if (editingMilestone) {
            pd.updateMilestone.mutate(
              { milestoneId: editingMilestone.id, body },
              { onSuccess: () => setMilestoneSheet(false) }
            );
          } else {
            pd.createMilestone.mutate(body, { onSuccess: () => setMilestoneSheet(false) });
          }
        }}
      />

      {/* Document editor */}
      <DocumentSheet
        open={docSheet}
        onClose={() => setDocSheet(false)}
        isPending={pd.addDocument.isPending}
        onSubmit={(body) => pd.addDocument.mutate(body, { onSuccess: () => setDocSheet(false) })}
      />

      <ConfirmModal
        open={!!deletingMilestone}
        onClose={() => setDeletingMilestone(null)}
        onConfirm={() =>
          deletingMilestone &&
          pd.removeMilestone.mutate(deletingMilestone.id, { onSettled: () => setDeletingMilestone(null) })
        }
        title="Delete milestone?"
        description={deletingMilestone?.title}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={pd.removeMilestone.isPending}
      />

      <ConfirmModal
        open={!!deletingDoc}
        onClose={() => setDeletingDoc(null)}
        onConfirm={() =>
          deletingDoc && pd.removeDocument.mutate(deletingDoc.id, { onSettled: () => setDeletingDoc(null) })
        }
        title="Remove document?"
        description={deletingDoc?.name}
        confirmLabel="Remove"
        variant="destructive"
        isLoading={pd.removeDocument.isPending}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-foreground-muted">{label}</dt>
      <dd className="truncate text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}

function EmptyRow({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
      <Icon className="h-6 w-6 text-foreground-subtle" />
      <p className="text-sm text-foreground-muted">{text}</p>
    </div>
  );
}

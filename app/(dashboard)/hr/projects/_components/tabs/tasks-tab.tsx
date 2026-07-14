"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, CalendarDays, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Tooltip } from "@/components/ui/tooltip";
import { ConfirmModal } from "@/components/ui/modal";
import { SkeletonList } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatOrdinalDate } from "@/lib/format";
import type {
  ProjectMember,
  ProjectMilestone,
  ProjectTask,
  ProjectTaskStatus,
} from "@/lib/api/projects-mgmt";
import type { useProjectDetail } from "../../[id]/use-project-detail";
import { TaskEditorSheet } from "../task-editor-sheet";
import { TASK_COLUMNS } from "../project-meta";

interface TasksTabProps {
  members: ProjectMember[];
  milestones: ProjectMilestone[];
  pd: ReturnType<typeof useProjectDetail>;
}

export function TasksTab({ members, milestones, pd }: TasksTabProps) {
  const tasks = pd.tasks.data ?? [];
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState<ProjectTask | null>(null);
  const [newStatus, setNewStatus] = React.useState<ProjectTaskStatus>("todo");
  const [deleting, setDeleting] = React.useState<ProjectTask | null>(null);
  const [dragId, setDragId] = React.useState<string | null>(null);
  const [dragOver, setDragOver] = React.useState<ProjectTaskStatus | null>(null);

  const grouped = React.useMemo(() => {
    const g: Record<ProjectTaskStatus, ProjectTask[]> = { todo: [], in_progress: [], done: [] };
    for (const t of tasks) (g[t.status] ?? g.todo).push(t);
    return g;
  }, [tasks]);

  const openNew = (status: ProjectTaskStatus) => {
    setEditingTask(null);
    setNewStatus(status);
    setEditorOpen(true);
  };
  const openEdit = (t: ProjectTask) => {
    setEditingTask(t);
    setEditorOpen(true);
  };

  const drop = (status: ProjectTaskStatus) => {
    setDragOver(null);
    const id = dragId;
    setDragId(null);
    if (!id) return;
    const task = tasks.find((t) => t.id === id);
    if (!task || task.status === status) return;
    pd.updateTask.mutate({ taskId: id, body: { status } });
  };

  if (pd.tasks.isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {TASK_COLUMNS.map((c) => (
          <div key={c.value} className="space-y-3">
            <SkeletonList items={2} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-foreground-subtle">Drag a card between columns to change its status.</p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {TASK_COLUMNS.map((col) => {
          const items = grouped[col.value] ?? [];
          const isOver = dragOver === col.value;
          return (
            <div
              key={col.value}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(col.value);
              }}
              onDragLeave={(e) => {
                if (e.currentTarget === e.target) setDragOver(null);
              }}
              onDrop={() => drop(col.value)}
              className={cn(
                "flex flex-col rounded-[var(--radius-lg)] border bg-secondary/30 p-3 transition-colors",
                isOver ? "border-primary bg-primary-muted/40" : "border-border"
              )}
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{col.label}</span>
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary px-1.5 text-xs font-medium text-foreground-muted">
                    {items.length}
                  </span>
                </div>
                <Button variant="ghost" size="icon-sm" onClick={() => openNew(col.value)} aria-label="Add task">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex min-h-[80px] flex-1 flex-col gap-2">
                {items.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center rounded-[var(--radius)] border border-dashed border-border py-6 text-xs text-foreground-subtle">
                    No tasks
                  </div>
                ) : (
                  items.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      dragging={dragId === task.id}
                      onDragStart={() => setDragId(task.id)}
                      onDragEnd={() => {
                        setDragId(null);
                        setDragOver(null);
                      }}
                      onEdit={() => openEdit(task)}
                      onDelete={() => setDeleting(task)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <TaskEditorSheet
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        task={editingTask}
        defaultStatus={newStatus}
        members={members}
        milestones={milestones}
        isPending={pd.createTask.isPending || pd.updateTask.isPending}
        onSubmit={(body) => {
          if (editingTask) {
            pd.updateTask.mutate(
              { taskId: editingTask.id, body },
              { onSuccess: () => setEditorOpen(false) }
            );
          } else {
            pd.createTask.mutate(body, { onSuccess: () => setEditorOpen(false) });
          }
        }}
      />

      <ConfirmModal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() =>
          deleting && pd.removeTask.mutate(deleting.id, { onSettled: () => setDeleting(null) })
        }
        title="Delete task?"
        description={deleting?.title}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={pd.removeTask.isPending}
      />
    </div>
  );
}

function TaskCard({
  task,
  dragging,
  onDragStart,
  onDragEnd,
  onEdit,
  onDelete,
}: {
  task: ProjectTask;
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const assignee = task.assignee;
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        "group cursor-grab rounded-[var(--radius)] border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing",
        dragging && "opacity-50"
      )}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-foreground-subtle" />
        <p className="min-w-0 flex-1 text-sm font-medium text-foreground">{task.title}</p>
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <Button variant="ghost" size="icon-sm" onClick={onEdit} aria-label="Edit">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onDelete} aria-label="Delete">
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      </div>
      {(assignee || task.due_date) && (
        <div className="mt-2 flex items-center justify-between pl-6">
          {task.due_date ? (
            <span className="flex items-center gap-1 text-xs text-foreground-muted">
              <CalendarDays className="h-3 w-3" /> {formatOrdinalDate(task.due_date)}
            </span>
          ) : (
            <span />
          )}
          {assignee && (
            <Tooltip content={assignee.full_name || assignee.name || "Assignee"}>
              <Avatar name={assignee.full_name || assignee.name || "?"} src={assignee.avatar ?? undefined} size="xs" />
            </Tooltip>
          )}
        </div>
      )}
    </div>
  );
}

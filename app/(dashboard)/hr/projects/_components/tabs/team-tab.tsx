"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { ConfirmModal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { memberUserId, type ProjectMember } from "@/lib/api/projects-mgmt";
import type { useProjectDetail } from "../../[id]/use-project-detail";
import { MemberAddSheet, MemberEditSheet, memberAvatar, memberName } from "../member-sheet";
import { roleLabel } from "../project-meta";

interface TeamTabProps {
  projectId: string;
  members: ProjectMember[];
  pd: ReturnType<typeof useProjectDetail>;
}

export function TeamTab({ projectId, members, pd }: TeamTabProps) {
  const [addOpen, setAddOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ProjectMember | null>(null);
  const [removing, setRemoving] = React.useState<ProjectMember | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Team <span className="text-foreground-muted">({members.length})</span>
        </h3>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" /> Add Member
        </Button>
      </div>

      {members.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No team members"
          description="Add employees to this project to get started."
          action={{ label: "Add Member", onClick: () => setAddOpen(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {members.map((m) => (
            <Card key={m.id ?? memberUserId(m)} className="flex items-center gap-3 p-4">
              <Avatar name={memberName(m)} src={memberAvatar(m)} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">{memberName(m)}</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <Badge variant="secondary">{roleLabel(m.project_role)}</Badge>
                  {m.allocation != null && (
                    <span className="text-xs text-foreground-muted">{m.allocation}%</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                <Button variant="ghost" size="icon-sm" onClick={() => setEditing(m)} aria-label="Edit">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={() => setRemoving(m)} aria-label="Remove">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <MemberAddSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        projectId={projectId}
        isPending={pd.addMembers.isPending}
        onSubmit={(m) => pd.addMembers.mutate(m, { onSuccess: () => setAddOpen(false) })}
      />

      <MemberEditSheet
        open={!!editing}
        onClose={() => setEditing(null)}
        member={editing}
        isPending={pd.updateMember.isPending}
        onSubmit={(body) =>
          editing &&
          pd.updateMember.mutate(
            { userId: memberUserId(editing), body },
            { onSuccess: () => setEditing(null) }
          )
        }
      />

      <ConfirmModal
        open={!!removing}
        onClose={() => setRemoving(null)}
        onConfirm={() =>
          removing &&
          pd.removeMember.mutate(memberUserId(removing), { onSettled: () => setRemoving(null) })
        }
        title="Remove member?"
        description={`${memberName(removing)} will be removed from this project.`}
        confirmLabel="Remove"
        variant="destructive"
        isLoading={pd.removeMember.isPending}
      />
    </div>
  );
}

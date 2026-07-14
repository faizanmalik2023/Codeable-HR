"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import {
  Building2,
  Users,
  UserCog,
  Pencil,
  UserMinus,
  UserPlus,
  Check,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Sheet, SheetFooter } from "@/components/ui/sheet";
import { ConfirmModal } from "@/components/ui/modal";
import { SkeletonList } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { QueryState } from "@/components/shared/query-state";
import { EmptyState } from "@/components/ui/empty-state";
import { primaryManager, type DepartmentEmployee } from "@/lib/api/departments";
import { useDepartmentDetail } from "./use-department-detail";

export default function DepartmentDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { query, department, available, update, setManager, addMember, removeMember } =
    useDepartmentDetail(id);

  // Inline name/description edit
  const [editing, setEditing] = React.useState(false);
  const [nameDraft, setNameDraft] = React.useState("");
  const [descDraft, setDescDraft] = React.useState("");

  // Sheets / modals
  const [managerOpen, setManagerOpen] = React.useState(false);
  const [managerDraft, setManagerDraft] = React.useState("");
  const [addOpen, setAddOpen] = React.useState(false);
  const [toRemove, setToRemove] = React.useState<DepartmentEmployee | null>(null);

  const startEdit = () => {
    if (!department) return;
    setNameDraft(department.name);
    setDescDraft(department.description ?? "");
    setEditing(true);
  };

  const saveEdit = () => {
    if (!nameDraft.trim()) return;
    update.mutate(
      { name: nameDraft.trim(), description: descDraft.trim() || undefined },
      { onSuccess: () => setEditing(false) }
    );
  };

  const openManager = () => {
    setManagerDraft(department ? primaryManager(department)?.id ?? "" : "");
    setManagerOpen(true);
    available.refetch();
  };

  const openAdd = () => {
    setAddOpen(true);
    available.refetch();
  };

  const availableOptions = React.useMemo(
    () =>
      (available.data ?? []).map((e) => ({
        value: e.id,
        label: e.full_name,
        description: e.designation ?? e.role,
      })),
    [available.data]
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Department" back />

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        data={department}
        onRetry={() => query.refetch()}
        skeleton={<SkeletonList items={5} />}
        emptyIcon={Building2}
        emptyTitle="Department not found"
        emptyDescription="It may have been removed or you don't have access."
      >
        {(dept) => {
          const manager = primaryManager(dept);
          const members = dept.employees ?? [];
          return (
            <div className="space-y-6">
              {/* Header / details card */}
              <Card className="p-6">
                {editing ? (
                  <div className="space-y-4">
                    <div>
                      <Label className="mb-2 block" required>
                        Name
                      </Label>
                      <Input value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} autoFocus />
                    </div>
                    <div>
                      <Label className="mb-2 block" optional>
                        Description
                      </Label>
                      <Textarea rows={3} value={descDraft} onChange={(e) => setDescDraft(e.target.value)} />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditing(false)} disabled={update.isPending}>
                        <X className="h-4 w-4" /> Cancel
                      </Button>
                      <Button size="sm" onClick={saveEdit} isLoading={update.isPending} disabled={!nameDraft.trim()}>
                        <Check className="h-4 w-4" /> Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-muted">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h1 className="text-xl font-bold text-foreground">{dept.name}</h1>
                      <p className="mt-0.5 text-sm text-foreground-muted">
                        {members.length} {members.length === 1 ? "member" : "members"}
                      </p>
                      {dept.description && (
                        <p className="mt-3 text-sm text-foreground">{dept.description}</p>
                      )}
                    </div>
                    <Button variant="outline" size="sm" onClick={startEdit}>
                      <Pencil className="h-4 w-4" /> Edit
                    </Button>
                  </div>
                )}
              </Card>

              {/* Manager section */}
              <Card className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground-muted">
                    Manager
                  </h2>
                  <Button variant="outline" size="sm" onClick={openManager}>
                    <UserCog className="h-4 w-4" /> {manager ? "Change Manager" : "Assign Manager"}
                  </Button>
                </div>
                {manager ? (
                  <div className="flex items-center gap-3">
                    <Avatar name={manager.full_name} src={manager.avatar ?? undefined} size="md" />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{manager.full_name}</p>
                      {(manager.designation ?? manager.role) && (
                        <p className="truncate text-sm text-foreground-muted">
                          {manager.designation ?? manager.role}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm italic text-foreground-muted">No manager assigned</p>
                )}
              </Card>

              {/* Members section */}
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-foreground">Members</h2>
                    <Badge variant="muted" className="gap-1">
                      <Users className="h-3 w-3" />
                      {members.length}
                    </Badge>
                  </div>
                  <Button size="sm" onClick={openAdd}>
                    <UserPlus className="h-4 w-4" /> Add Member
                  </Button>
                </div>

                {members.length === 0 ? (
                  <EmptyState
                    icon={Users}
                    title="No members yet"
                    description="Add people to this department to get started."
                    action={{ label: "Add Member", onClick: openAdd }}
                  />
                ) : (
                  <div className="space-y-2">
                    {members.map((emp) => {
                      const isManager = manager?.id === emp.id;
                      return (
                        <Card key={emp.id} className="flex items-center gap-3 p-4">
                          <Avatar name={emp.full_name} src={emp.avatar ?? undefined} size="md" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate font-medium text-foreground">{emp.full_name}</p>
                              {isManager && (
                                <Badge variant="muted" className="gap-1 text-xs">
                                  <UserCog className="h-3 w-3" /> Manager
                                </Badge>
                              )}
                            </div>
                            {(emp.designation ?? emp.role) && (
                              <p className="truncate text-sm text-foreground-muted">
                                {emp.designation ?? emp.role}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Remove member"
                            onClick={() => setToRemove(emp)}
                          >
                            <UserMinus className="h-4 w-4 text-destructive" />
                          </Button>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        }}
      </QueryState>

      {/* Change manager sheet */}
      <Sheet
        open={managerOpen}
        onClose={() => setManagerOpen(false)}
        title="Change Manager"
        description="Pick a team member to lead this department"
        size="md"
      >
        <div className="space-y-4">
          <Select
            label="Manager"
            placeholder={available.isFetching ? "Loading…" : "Select a manager"}
            options={availableOptions}
            value={managerDraft}
            onChange={setManagerDraft}
          />
          {!available.isFetching && availableOptions.length === 0 && (
            <p className="text-sm text-foreground-muted">No eligible employees available.</p>
          )}
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={() => setManagerOpen(false)} disabled={setManager.isPending}>
            Cancel
          </Button>
          <Button
            onClick={() =>
              setManager.mutate(managerDraft, { onSuccess: () => setManagerOpen(false) })
            }
            isLoading={setManager.isPending}
            disabled={!managerDraft}
          >
            Save Manager
          </Button>
        </SheetFooter>
      </Sheet>

      {/* Add member sheet */}
      <Sheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add Member"
        description="Add an employee to this department"
        size="md"
      >
        <QueryState
          isLoading={available.isFetching}
          isError={available.isError}
          error={available.error}
          data={available.data}
          onRetry={() => available.refetch()}
          skeleton={<SkeletonList items={4} />}
          emptyIcon={Users}
          emptyTitle="No available employees"
          emptyDescription="Everyone is already assigned to a department."
        >
          {(list) => (
            <div className="space-y-2">
              {list.map((emp) => (
                <div
                  key={emp.id}
                  className="flex items-center gap-3 rounded-[var(--radius)] border border-border p-3"
                >
                  <Avatar name={emp.full_name} src={emp.avatar ?? undefined} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{emp.full_name}</p>
                    {(emp.designation ?? emp.role) && (
                      <p className="truncate text-xs text-foreground-muted">
                        {emp.designation ?? emp.role}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addMember.mutate(emp.id)}
                    isLoading={addMember.isPending && addMember.variables === emp.id}
                    disabled={addMember.isPending}
                  >
                    <UserPlus className="h-4 w-4" /> Add
                  </Button>
                </div>
              ))}
            </div>
          )}
        </QueryState>
      </Sheet>

      {/* Remove member confirm */}
      <ConfirmModal
        open={!!toRemove}
        onClose={() => setToRemove(null)}
        onConfirm={() => {
          if (toRemove)
            removeMember.mutate(toRemove.employee_code ?? toRemove.id, {
              onSettled: () => setToRemove(null),
            });
        }}
        title={toRemove ? `Remove ${toRemove.full_name}?` : "Remove member?"}
        description="They will be removed from this department."
        confirmLabel="Remove"
        variant="destructive"
        isLoading={removeMember.isPending}
      />
    </div>
  );
}

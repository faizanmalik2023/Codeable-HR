"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { Sheet, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar } from "@/components/ui/avatar";
import { SkeletonList } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useEnums, toOptions } from "@/lib/api/enums";
import {
  pmKeys,
  projectsMgmtApi,
  type MemberInput,
  type MemberUpdateBody,
  type ProjectMember,
} from "@/lib/api/projects-mgmt";
import { PROJECT_ROLE_FALLBACK, PROJECT_ROLE_LABELS } from "./project-meta";

/** Role options — server `project_member_role` if present, else fallback list. */
function useRoleOptions() {
  const enums = useEnums();
  return React.useMemo(() => {
    const values = enums.data?.project_member_role;
    const list = values && values.length > 0 ? values : PROJECT_ROLE_FALLBACK;
    return toOptions(list, PROJECT_ROLE_LABELS);
  }, [enums.data]);
}

/* ------------------------------------------------------------------ */
/* Add members                                                         */
/* ------------------------------------------------------------------ */
interface MemberAddSheetProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  onSubmit: (members: MemberInput[]) => void;
  isPending?: boolean;
}

interface Draft {
  role: string;
  allocation: string;
}

export function MemberAddSheet({ open, onClose, projectId, onSubmit, isPending }: MemberAddSheetProps) {
  const roleOptions = useRoleOptions();
  const defaultRole = roleOptions[0]?.value ?? "member";
  const [selected, setSelected] = React.useState<Record<string, Draft>>({});

  const available = useQuery({
    queryKey: pmKeys.available(projectId),
    queryFn: () => projectsMgmtApi.availableEmployees(projectId),
    enabled: open,
  });

  React.useEffect(() => {
    if (open) setSelected({});
  }, [open]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = { role: defaultRole, allocation: "100" };
      return next;
    });

  const setDraft = (id: string, patch: Partial<Draft>) =>
    setSelected((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const submit = () => {
    const members: MemberInput[] = Object.entries(selected).map(([userId, d]) => ({
      userId,
      role: d.role,
      allocation: d.allocation ? Number(d.allocation) : undefined,
    }));
    if (members.length === 0) return;
    onSubmit(members);
  };

  const employees = available.data ?? [];
  const count = Object.keys(selected).length;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Add Team Members"
      description="Select employees and set their role and allocation."
      size="lg"
    >
      <div className="space-y-2">
        {available.isLoading ? (
          <SkeletonList items={5} />
        ) : employees.length === 0 ? (
          <EmptyState icon={Users} title="No available employees" description="Everyone is already on this project." />
        ) : (
          employees.map((emp) => {
            const id = emp.id as string;
            const draft = selected[id];
            const name = emp.full_name || emp.name || "Unknown";
            return (
              <div
                key={id}
                className="rounded-[var(--radius)] border border-border p-3"
              >
                <div className="flex items-center gap-3">
                  <Checkbox checked={!!draft} onChange={() => toggle(id)} />
                  <Avatar name={name} src={emp.avatar ?? undefined} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{name}</p>
                    {(emp.designation || emp.department) && (
                      <p className="truncate text-xs text-foreground-muted">
                        {emp.designation}
                        {emp.designation && emp.department ? " · " : ""}
                        {emp.department}
                      </p>
                    )}
                  </div>
                </div>
                {draft && (
                  <div className="mt-3 grid grid-cols-2 gap-3 pl-8">
                    <Select
                      options={roleOptions}
                      value={draft.role}
                      onChange={(v) => setDraft(id, { role: v })}
                    />
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      placeholder="Allocation %"
                      value={draft.allocation}
                      onChange={(e) => setDraft(id, { allocation: e.target.value })}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <SheetFooter className="-mx-6 -mb-5 mt-4">
        <Button variant="outline" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button onClick={submit} isLoading={isPending} disabled={count === 0}>
          Add {count > 0 ? `(${count})` : ""}
        </Button>
      </SheetFooter>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/* Edit member                                                         */
/* ------------------------------------------------------------------ */
interface MemberEditSheetProps {
  open: boolean;
  onClose: () => void;
  member: ProjectMember | null;
  onSubmit: (body: MemberUpdateBody) => void;
  isPending?: boolean;
}

export function MemberEditSheet({ open, onClose, member, onSubmit, isPending }: MemberEditSheetProps) {
  const roleOptions = useRoleOptions();
  const [role, setRole] = React.useState("");
  const [allocation, setAllocation] = React.useState("");

  React.useEffect(() => {
    if (!open || !member) return;
    setRole(member.role ?? roleOptions[0]?.value ?? "member");
    setAllocation(member.allocation != null ? String(member.allocation) : "");
  }, [open, member, roleOptions]);

  const name = memberName(member);

  return (
    <Sheet open={open} onClose={onClose} title="Edit Member" description={name} size="md">
      <div className="space-y-5">
        <div>
          <Label className="mb-2 block">Role</Label>
          <Select options={roleOptions} value={role} onChange={setRole} />
        </div>
        <div>
          <Label className="mb-2 block">Allocation %</Label>
          <Input
            type="number"
            min={0}
            max={100}
            placeholder="100"
            value={allocation}
            onChange={(e) => setAllocation(e.target.value)}
          />
        </div>
      </div>
      <SheetFooter className="-mx-6 -mb-5 mt-2">
        <Button variant="outline" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button
          onClick={() =>
            onSubmit({ role, allocation: allocation ? Number(allocation) : undefined })
          }
          isLoading={isPending}
        >
          Save
        </Button>
      </SheetFooter>
    </Sheet>
  );
}

export function memberName(m: ProjectMember | null | undefined): string {
  if (!m) return "";
  return m.user?.full_name || m.user?.name || m.full_name || "Unknown";
}

export function memberAvatar(m: ProjectMember): string | undefined {
  return m.user?.avatar ?? m.avatar ?? undefined;
}

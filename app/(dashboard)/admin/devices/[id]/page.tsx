"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Fingerprint, Pencil, Users, UserPlus, Trash2, KeyRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Avatar } from "@/components/ui/avatar";
import { ConfirmModal } from "@/components/ui/modal";
import { SkeletonList } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { QueryState } from "@/components/shared/query-state";
import { timeAgo } from "@/lib/format";
import { useDeviceDetail } from "./use-device-detail";
import { EditDeviceSheet } from "../_components/edit-device-sheet";
import { AddMappingSheet } from "../_components/add-mapping-sheet";
import type { DeviceMapping } from "@/lib/api/admin-devices";

export default function DeviceDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { query, device, mappingsQuery, mappings, update, addMapping, removeMapping } =
    useDeviceDetail(id);

  const [editOpen, setEditOpen] = React.useState(false);
  const [addOpen, setAddOpen] = React.useState(false);
  const [toRemove, setToRemove] = React.useState<DeviceMapping | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader title="Device" back />

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        data={device}
        onRetry={() => query.refetch()}
        skeleton={<SkeletonList items={4} />}
        emptyIcon={Fingerprint}
        emptyTitle="Device not found"
        emptyDescription="It may have been removed or you don't have access."
      >
        {(dev) => (
          <div className="space-y-6">
            {/* Info card */}
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-muted">
                  <Fingerprint className="h-6 w-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-foreground">{dev.name}</h1>
                    <Badge variant={dev.is_active ? "success" : "muted"}>
                      {dev.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-sm text-foreground-muted">{dev.serial_number}</p>

                  <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    <InfoItem label="Location" value={dev.location} />
                    <InfoItem label="Model" value={dev.model} />
                    <InfoItem label="Last sync" value={dev.last_sync ? timeAgo(dev.last_sync) : "Never"} />
                    <InfoItem label="Mappings" value={String(dev.mappings_count ?? mappings.length)} />
                  </dl>
                </div>
                <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                  <Pencil className="h-4 w-4" /> Edit
                </Button>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Device status</p>
                  <p className="text-xs text-foreground-muted">
                    {dev.is_active ? "Syncing attendance punches" : "Paused — not accepting punches"}
                  </p>
                </div>
                <Switch
                  checked={dev.is_active}
                  onChange={(v) => update.mutate({ is_active: v })}
                  disabled={update.isPending}
                  aria-label={dev.is_active ? "Deactivate device" : "Activate device"}
                />
              </div>
            </Card>

            {/* PIN mappings */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-foreground">PIN Mappings</h2>
                  <Badge variant="muted" className="gap-1">
                    <Users className="h-3 w-3" />
                    {mappings.length}
                  </Badge>
                </div>
                <Button size="sm" onClick={() => setAddOpen(true)}>
                  <UserPlus className="h-4 w-4" /> Add Mapping
                </Button>
              </div>

              <QueryState
                isLoading={mappingsQuery.isLoading}
                isError={mappingsQuery.isError}
                error={mappingsQuery.error}
                data={mappings}
                onRetry={() => mappingsQuery.refetch()}
                skeleton={<SkeletonList items={3} />}
                emptyIcon={KeyRound}
                emptyTitle="No mappings yet"
                emptyDescription="Link a device PIN to an employee to attribute their punches."
                emptyAction={{ label: "Add Mapping", onClick: () => setAddOpen(true) }}
              >
                {(list) => (
                  <div className="space-y-2">
                    {list.map((m) => (
                      <Card key={m.id} className="flex items-center gap-3 p-4">
                        <Avatar name={m.employee_name} size="md" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-foreground">{m.employee_name}</p>
                          <p className="truncate text-sm text-foreground-muted">
                            PIN <span className="font-mono text-foreground">{m.pin}</span>
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Remove mapping"
                          onClick={() => setToRemove(m)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </Card>
                    ))}
                  </div>
                )}
              </QueryState>
            </div>
          </div>
        )}
      </QueryState>

      <EditDeviceSheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        device={device}
        onSubmit={(body) => update.mutate(body, { onSuccess: () => setEditOpen(false) })}
        isPending={update.isPending}
      />

      <AddMappingSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        deviceId={id}
        onSubmit={(_deviceId, body) =>
          addMapping.mutate(body, { onSuccess: () => setAddOpen(false) })
        }
        isPending={addMapping.isPending}
      />

      <ConfirmModal
        open={!!toRemove}
        onClose={() => setToRemove(null)}
        onConfirm={() => {
          if (toRemove) removeMapping.mutate(toRemove.id, { onSettled: () => setToRemove(null) });
        }}
        title={toRemove ? `Remove ${toRemove.employee_name}?` : "Remove mapping?"}
        description="This PIN will no longer be attributed to the employee."
        confirmLabel="Remove"
        variant="destructive"
        isLoading={removeMapping.isPending}
      />
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-foreground-muted">{label}</dt>
      <dd className="mt-0.5 text-foreground">{value || "—"}</dd>
    </div>
  );
}

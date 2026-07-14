"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, RefreshCw, Fingerprint, AlertTriangle, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { DataTable, type DataTableColumn } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonList } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { QueryState } from "@/components/shared/query-state";
import { timeAgo } from "@/lib/format";
import { useDevices } from "./use-devices";
import { RegisterDeviceSheet } from "./_components/register-device-sheet";
import type { DeviceModel } from "@/lib/api/admin-devices";

export default function AdminDevicesPage() {
  const router = useRouter();
  const { query, devices, unmappedCount, create, setActive, refresh } = useDevices();
  const [registerOpen, setRegisterOpen] = React.useState(false);

  const columns: DataTableColumn<DeviceModel>[] = [
    {
      key: "name",
      header: "Device",
      render: (d) => (
        <div className="min-w-0">
          <p className="font-medium text-foreground">{d.name}</p>
          <p className="truncate text-xs text-foreground-muted">
            {d.serial_number}
            {d.location ? ` · ${d.location}` : ""}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (d) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Switch
            checked={d.is_active}
            onChange={(v) => setActive.mutate({ id: d.id, is_active: v })}
            disabled={setActive.isPending}
            aria-label={d.is_active ? "Deactivate device" : "Activate device"}
          />
          <Badge variant={d.is_active ? "success" : "muted"}>
            {d.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>
      ),
    },
    {
      key: "last_sync",
      header: "Last sync",
      render: (d) => (
        <span className="text-foreground-muted">
          {d.last_sync ? timeAgo(d.last_sync) : "Never"}
        </span>
      ),
    },
    {
      key: "mappings_count",
      header: "Mappings",
      align: "right",
      render: (d) => <span className="tabular-nums">{d.mappings_count ?? 0}</span>,
    },
    {
      key: "chevron",
      header: "",
      align: "right",
      render: () => <ChevronRight className="ml-auto h-4 w-4 text-foreground-subtle" />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Devices"
        description="Biometric attendance devices"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={refresh} aria-label="Refresh">
              <RefreshCw className={query.isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            </Button>
            <Button onClick={() => setRegisterOpen(true)}>
              <Plus className="h-4 w-4" /> Register Device
            </Button>
          </div>
        }
      />

      {unmappedCount > 0 && (
        <button
          type="button"
          onClick={() => router.push("/admin/devices/unmapped")}
          className="flex w-full items-center gap-3 rounded-[var(--radius-lg)] border border-warning/40 bg-warning-muted p-4 text-left transition-colors hover:bg-warning-muted/80"
        >
          <AlertTriangle className="h-5 w-5 shrink-0 text-warning" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">
              {unmappedCount} unmapped {unmappedCount === 1 ? "punch" : "punches"}
            </p>
            <p className="text-xs text-foreground-muted">
              Some device PINs aren&apos;t linked to an employee. Review and map them.
            </p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-foreground-muted" />
        </button>
      )}

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        data={devices}
        onRetry={() => query.refetch()}
        skeleton={<SkeletonList items={5} />}
        emptyIcon={Fingerprint}
        emptyTitle="No devices registered"
        emptyDescription="Register your first biometric device to start syncing attendance."
        emptyAction={{ label: "Register Device", onClick: () => setRegisterOpen(true) }}
      >
        {(list) => (
          <Card className="p-2">
            <DataTable
              columns={columns}
              data={list}
              rowKey={(d) => d.id}
              onRowClick={(d) => router.push(`/admin/devices/${d.id}`)}
              empty={
                <EmptyState
                  icon={Fingerprint}
                  title="No devices registered"
                  description="Register your first biometric device."
                  action={{ label: "Register Device", onClick: () => setRegisterOpen(true) }}
                />
              }
            />
          </Card>
        )}
      </QueryState>

      <RegisterDeviceSheet
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onSubmit={(body) =>
          create.mutate(body, { onSuccess: () => setRegisterOpen(false) })
        }
        isPending={create.isPending}
      />
    </div>
  );
}

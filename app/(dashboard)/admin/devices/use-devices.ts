"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiRequestError } from "@/lib/api/client";
import {
  adminDeviceKeys,
  adminDevicesApi,
  toItems,
  type CreateDeviceBody,
  type UpdateDeviceBody,
} from "@/lib/api/admin-devices";

const errMsg = (e: unknown, fallback: string) =>
  e instanceof ApiRequestError ? e.message : fallback;

/** List hook for the devices registry — devices, unmapped count, create + status toggle. */
export function useDevices() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: adminDeviceKeys.list(),
    queryFn: () => adminDevicesApi.list(),
    select: toItems,
  });

  const unmapped = useQuery({
    queryKey: adminDeviceKeys.unmapped(),
    queryFn: () => adminDevicesApi.unmapped(),
    select: toItems,
  });

  const create = useMutation({
    mutationFn: (body: CreateDeviceBody) => adminDevicesApi.create(body),
    onSuccess: () => {
      toast.success("Device registered");
      qc.invalidateQueries({ queryKey: adminDeviceKeys.list() });
    },
    onError: (e) => toast.error(errMsg(e, "Couldn't register device")),
  });

  const setActive = useMutation({
    mutationFn: (vars: { id: string; is_active: boolean } & UpdateDeviceBody) =>
      adminDevicesApi.update(vars.id, { is_active: vars.is_active }),
    onSuccess: () => {
      toast.success("Device updated");
      qc.invalidateQueries({ queryKey: adminDeviceKeys.list() });
    },
    onError: (e) => toast.error(errMsg(e, "Couldn't update device")),
  });

  return {
    query,
    devices: query.data ?? [],
    unmappedCount: (unmapped.data ?? []).length,
    create,
    setActive,
    refresh: () => {
      query.refetch();
      unmapped.refetch();
    },
  };
}

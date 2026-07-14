"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiRequestError } from "@/lib/api/client";
import {
  adminDeviceKeys,
  adminDevicesApi,
  toItems,
  type AddMappingBody,
} from "@/lib/api/admin-devices";

const errMsg = (e: unknown, fallback: string) =>
  e instanceof ApiRequestError ? e.message : fallback;

/** Hook for the unmapped-punches page — punches, device list, and a map mutation. */
export function useUnmappedPunches() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: adminDeviceKeys.unmapped(),
    queryFn: () => adminDevicesApi.unmapped(),
    select: toItems,
  });

  const devices = useQuery({
    queryKey: adminDeviceKeys.list(),
    queryFn: () => adminDevicesApi.list(),
    select: toItems,
  });

  const addMapping = useMutation({
    mutationFn: (vars: { deviceId: string } & AddMappingBody) =>
      adminDevicesApi.addMapping(vars.deviceId, { pin: vars.pin, user_id: vars.user_id }),
    onSuccess: () => {
      toast.success("Mapping added");
      qc.invalidateQueries({ queryKey: adminDeviceKeys.unmapped() });
      qc.invalidateQueries({ queryKey: adminDeviceKeys.list() });
    },
    onError: (e) => toast.error(errMsg(e, "Couldn't add mapping")),
  });

  return {
    query,
    punches: query.data ?? [],
    devices: devices.data ?? [],
    addMapping,
    refresh: () => query.refetch(),
  };
}

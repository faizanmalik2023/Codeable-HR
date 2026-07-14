"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiRequestError } from "@/lib/api/client";
import {
  adminDeviceKeys,
  adminDevicesApi,
  toItems,
  type AddMappingBody,
  type UpdateDeviceBody,
} from "@/lib/api/admin-devices";

const errMsg = (e: unknown, fallback: string) =>
  e instanceof ApiRequestError ? e.message : fallback;

/** Detail hook — device info, PIN mappings, plus update/mapping mutations. */
export function useDeviceDetail(id: string) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: adminDeviceKeys.detail(id),
    queryFn: () => adminDevicesApi.get(id),
    enabled: !!id,
  });

  const mappingsQuery = useQuery({
    queryKey: adminDeviceKeys.mappings(id),
    queryFn: () => adminDevicesApi.mappings(id),
    select: toItems,
    enabled: !!id,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: adminDeviceKeys.detail(id) });
    qc.invalidateQueries({ queryKey: adminDeviceKeys.mappings(id) });
    qc.invalidateQueries({ queryKey: adminDeviceKeys.list() });
  };

  const update = useMutation({
    mutationFn: (body: UpdateDeviceBody) => adminDevicesApi.update(id, body),
    onSuccess: () => {
      toast.success("Device updated");
      invalidate();
    },
    onError: (e) => toast.error(errMsg(e, "Couldn't update device")),
  });

  const addMapping = useMutation({
    mutationFn: (body: AddMappingBody) => adminDevicesApi.addMapping(id, body),
    onSuccess: () => {
      toast.success("Mapping added");
      invalidate();
    },
    onError: (e) => toast.error(errMsg(e, "Couldn't add mapping")),
  });

  const removeMapping = useMutation({
    mutationFn: (mappingId: string) => adminDevicesApi.removeMapping(id, mappingId),
    onSuccess: () => {
      toast.success("Mapping removed");
      invalidate();
    },
    onError: (e) => toast.error(errMsg(e, "Couldn't remove mapping")),
  });

  return {
    query,
    device: query.data,
    mappingsQuery,
    mappings: mappingsQuery.data ?? [],
    update,
    addMapping,
    removeMapping,
  };
}

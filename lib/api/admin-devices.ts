import { api } from "@/lib/api/client";

/* ------------------------------------------------------------------ */
/* Local models (types/index.ts is off-limits for this feature)        */
/* ------------------------------------------------------------------ */

/** A registered biometric attendance device. */
export interface DeviceModel {
  id: string;
  name: string;
  serial_number: string;
  location?: string | null;
  model?: string | null;
  comm_key?: string | null;
  is_active: boolean;
  last_sync?: string | null;
  mappings_count?: number;
}

/** A PIN → employee mapping on a device. */
export interface DeviceMapping {
  id: string;
  pin: string;
  user_id: string;
  employee_name: string;
  created_at?: string | null;
}

/** A raw punch whose PIN isn't mapped to any employee yet. */
export interface UnmappedPunch {
  pin: string;
  device: string;
  timestamp: string;
}

/** `GET /admin/devices` — accepts a bare array or an `{ items }` envelope. */
export type DeviceListResponse = DeviceModel[] | { items: DeviceModel[] };

/* ------------------------------------------------------------------ */
/* Request bodies                                                      */
/* ------------------------------------------------------------------ */

export interface CreateDeviceBody {
  serial_number: string;
  name: string;
  location?: string;
  model?: string;
  comm_key?: string;
}

export interface UpdateDeviceBody {
  is_active?: boolean;
  name?: string;
  location?: string;
  comm_key?: string;
}

export interface AddMappingBody {
  pin: string;
  user_id: string;
}

/* ------------------------------------------------------------------ */
/* API surface                                                         */
/* ------------------------------------------------------------------ */

export const adminDevicesApi = {
  list: () => api.get<DeviceListResponse>("/admin/devices", { limit: 100 }),

  get: (id: string) => api.get<DeviceModel>(`/admin/devices/${id}`),

  create: (body: CreateDeviceBody) => api.post<DeviceModel>("/admin/devices", body),

  update: (id: string, body: UpdateDeviceBody) =>
    api.patch<DeviceModel>(`/admin/devices/${id}`, body),

  mappings: (id: string) =>
    api.get<DeviceMapping[] | { items: DeviceMapping[] }>(`/admin/devices/${id}/mappings`),

  addMapping: (id: string, body: AddMappingBody) =>
    api.post<DeviceMapping>(`/admin/devices/${id}/mappings`, body),

  removeMapping: (id: string, mappingId: string) =>
    api.delete<void>(`/admin/devices/${id}/mappings/${mappingId}`),

  unmapped: () =>
    api.get<UnmappedPunch[] | { items: UnmappedPunch[] }>("/admin/devices/punches/unmapped"),
};

/** Normalise a list/`{ items }` response into a plain array. */
export function toItems<T>(res: T[] | { items: T[] } | null | undefined): T[] {
  if (!res) return [];
  return Array.isArray(res) ? res : res.items ?? [];
}

/* ------------------------------------------------------------------ */
/* Local query keys (keys.ts is off-limits for this feature)           */
/* ------------------------------------------------------------------ */

export const adminDeviceKeys = {
  all: ["admin-devices"] as const,
  list: () => ["admin-devices", "list"] as const,
  detail: (id: string) => ["admin-devices", "detail", id] as const,
  mappings: (id: string) => ["admin-devices", "mappings", id] as const,
  unmapped: () => ["admin-devices", "unmapped"] as const,
  employees: () => ["admin-devices", "employees"] as const,
};

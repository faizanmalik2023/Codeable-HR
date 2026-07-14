import { api } from "@/lib/api/client";

/** A person shown inside a department (member, manager, or an available pick). */
export interface DepartmentEmployee {
  id: string;
  employee_code?: string;
  full_name: string;
  avatar?: string | null;
  designation?: string;
  role?: string;
  email?: string;
}

/** Department entity — backend may return `manager`/`managers` and `employees`/`employeeCount`. */
export interface Department {
  id: string;
  name: string;
  description?: string | null;
  manager?: DepartmentEmployee | null;
  managers?: DepartmentEmployee[];
  employees?: DepartmentEmployee[];
  employeeCount?: number;
  image_url?: string | null;
  created_at?: string;
}

export interface DepartmentCreateBody {
  name: string;
  description?: string;
  cover_image?: string;
}

export interface DepartmentUpdateBody {
  name?: string;
  description?: string;
}

/** `GET /departments` may return a bare array or an `{ items }` envelope. */
export type DepartmentListResponse = Department[] | { items: Department[] };

export const departmentsApi = {
  list: () => api.get<DepartmentListResponse>("/departments"),

  get: (id: string) => api.get<Department>(`/departments/${id}`),

  create: (body: DepartmentCreateBody) => api.post<Department>("/departments", body),

  update: (id: string, body: DepartmentUpdateBody) =>
    api.patch<Department>(`/departments/${id}`, body),

  remove: (id: string) => api.delete<void>(`/departments/${id}`),

  availableEmployees: (id: string) =>
    api.get<DepartmentEmployee[] | { items: DepartmentEmployee[] }>(
      `/departments/${id}/available-employees`
    ),

  addMember: (id: string, employee_id: string) =>
    api.post<void>(`/departments/${id}/members`, { employee_id }),

  removeMember: (id: string, code: string) =>
    api.delete<void>(`/departments/${id}/members/${code}`),

  setManager: (id: string, manager_id: string) =>
    api.patch<void>(`/departments/${id}/manager`, { manager_id }),
};

/** Normalise a list/available response into a plain array. */
export function toItems<T>(res: T[] | { items: T[] } | null | undefined): T[] {
  if (!res) return [];
  return Array.isArray(res) ? res : res.items ?? [];
}

/** Primary manager for a department (first of `managers` or the singular `manager`). */
export function primaryManager(dept: Department): DepartmentEmployee | null {
  return dept.manager ?? dept.managers?.[0] ?? null;
}

/** Member count from whichever shape the backend supplied. */
export function memberCount(dept: Department): number {
  return dept.employeeCount ?? dept.employees?.length ?? 0;
}

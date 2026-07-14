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
  /** Department picture — createDepartmentSchema expects `image` (a hosted URL). */
  image?: string;
}

export interface DepartmentUpdateBody {
  name?: string;
  description?: string;
}

/** `GET /departments` may return a bare array or an `{ items }` envelope. */
export type DepartmentListResponse = Department[] | { items: Department[] };

export const departmentsApi = {
  list: () => api.get<DepartmentListResponse>("/departments"),

  // NOTE: there is no `GET /departments/:id` on the backend — the detail view
  // hydrates from the list-query cache (see use-department-detail.ts).

  create: (body: DepartmentCreateBody) => api.post<Department>("/departments", body),

  update: (id: string, body: DepartmentUpdateBody) =>
    api.patch<Department>(`/departments/${id}`, body),

  remove: (id: string) => api.delete<void>(`/departments/${id}`),

  availableEmployees: (id: string) =>
    api.get<DepartmentEmployee[] | { items: DepartmentEmployee[] }>(
      `/departments/${id}/available-employees`
    ),

  // addMembersSchema expects `employee_codes: string[]` (a batch of employee codes).
  addMember: (id: string, employee_code: string) =>
    api.post<Department>(`/departments/${id}/members`, {
      employee_codes: [employee_code],
    }),

  removeMember: (id: string, code: string) =>
    api.delete<Department>(`/departments/${id}/members/${code}`),

  // updateManagerSchema expects `employee_codes: string[]` (empty clears all).
  setManager: (id: string, employee_code: string) =>
    api.patch<Department>(`/departments/${id}/manager`, {
      employee_codes: [employee_code],
    }),
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

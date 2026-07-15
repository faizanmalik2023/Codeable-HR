import { api } from "@/lib/api/client";
import type {
  EmploymentType,
  PerkType,
  SalaryRevisionType,
  UserRole,
} from "@/lib/enums";

/* ------------------------------------------------------------------ */
/* Local types (types/index.ts is off-limits for this feature)         */
/* ------------------------------------------------------------------ */

/** Nested id/name reference used across employee payloads. */
export interface NamedRef {
  id: string;
  name: string;
}

/** Row shape for the People directory list. */
export interface EmployeeListItem {
  id: string;
  employee_code: string;
  full_name: string;
  email: string;
  department?: NamedRef | null;
  designation?: NamedRef | null;
  managerName?: string | null;
  status: string;
  joined_at?: string | null;
  avatar?: string | null;
}

/** `GET /employees` — accepts `{items}` or a full paginated envelope. */
export interface EmployeeListResponse {
  items: EmployeeListItem[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
  };
  counts?: Record<string, number>;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relation: string;
}

export interface SalaryComponent {
  /** e.g. basic, house_rent, medical, transport, utility, tax, provident_fund, insurance */
  type?: string;
  label?: string;
  amount: number;
}

export interface SalaryHistoryItem {
  id?: string;
  type: SalaryRevisionType | string;
  previous_amount?: number;
  new_amount: number;
  increase?: number;
  increase_percent?: number;
  effective_date: string;
  note?: string | null;
  created_at?: string;
}

export interface Perk {
  title: string;
  description?: string | null;
  status?: string | null;
  /** onboarding/edit payload extras */
  type?: PerkType | string;
  amount?: number | null;
  percentage?: number | null;
}

export interface EmployeeInfo {
  id: string;
  employee_code: string;
  full_name: string;
  email: string;
  phone?: string | null;
  cnic?: string | null;
  designation?: NamedRef | null;
  department?: NamedRef | null;
  employment?: {
    employment_type?: EmploymentType | string | null;
    joined_at?: string | null;
  } | null;
  dob?: string | null;
  emergency_contact?: EmergencyContact | null;
  role?: UserRole | string | null;
  status: string;
  father_name?: string | null;
  gender?: string | null;
  personal_email?: string | null;
  bank_name?: string | null;
  account_number?: string | null;
  payment_method?: string | null;
  manager?: { id: string; full_name: string } | null;
  cnic_front_image?: string | null;
  cnic_back_image?: string | null;
  contract_document?: string | null;
  avatar?: string | null;
  salary?: { components: SalaryComponent[] } | null;
  salary_history?: SalaryHistoryItem[];
  perks?: Perk[];
}

export interface Designation {
  id: string;
  name: string;
  track?: string | null;
  level?: string | number | null;
}

/**
 * Human label for a designation, matching the mobile app: `Track · Lx · Name`
 * (e.g. "Design · L1 · Design Intern"). Falls back to just the name for legacy
 * rows that carry no track/level.
 */
export function designationLabel(d: Designation): string {
  const hasLevel = d.level !== null && d.level !== undefined && d.level !== "";
  if (d.track && hasLevel) return `${d.track} · L${d.level} · ${d.name}`;
  if (d.track) return `${d.track} · ${d.name}`;
  return d.name;
}

export interface Department {
  id: string;
  name: string;
  employee_count?: number;
}

/* ------------------------------------------------------------------ */
/* Request bodies                                                      */
/* ------------------------------------------------------------------ */

/** Perk entry accepted by createEmployeeSchema (validators/hr/employee.js). */
export interface CreateEmployeePerk {
  /** One of PERK_KEYS: medical_insurance | provident_fund | fuel_allowance | meal_allowance | phone_allowance */
  key: PerkType | string;
  enabled?: boolean;
  amount?: number | null;
  percentage?: number | null;
}

export interface CreateEmployeeBody {
  full_name: string;
  email: string;
  phone: string;
  cnic: string;
  dob: string;
  designation_id: string;
  department_id: string;
  role: UserRole | string;
  employment_type: EmploymentType | string;
  joined_at?: string | null;
  gender?: string | null;
  personal_email?: string | null;
  emergency_contact: EmergencyContact;
  cnic_front_image?: string | null;
  cnic_back_image?: string | null;
  contract_document?: string | null;
  /* Named salary fields — folded into salary components server-side. */
  basic_salary?: number;
  house_rent?: number;
  medical?: number;
  transport?: number;
  utility?: number;
  tax?: number;
  provident_fund?: number;
  insurance?: number;
  perks: CreateEmployeePerk[];
}

export interface UpdateEmployeeBody {
  full_name?: string;
  email?: string;
  phone?: string;
  cnic?: string;
  role?: UserRole | string;
  employment_type?: EmploymentType | string;
  gender?: string | null;
  personal_email?: string | null;
  bank_name?: string | null;
  account_number?: string | null;
  payment_method?: string | null;
  emergency_contact?: EmergencyContact;
  department_id?: string;
  designation_id?: string;
  manager_id?: string | null;
  dob?: string | null;
  joined_at?: string | null;
  perks?: Perk[];
}

export interface PromoteBody {
  new_salary: number;
  designation_id?: string;
  effective_date: string;
}

export interface IncrementBody {
  new_salary: number;
  effective_date: string;
}

/* ------------------------------------------------------------------ */
/* API surface                                                         */
/* ------------------------------------------------------------------ */

export const employeesApi = {
  list: (params?: { limit?: number; search?: string }) =>
    api.get<EmployeeListResponse>("/employees", {
      limit: params?.limit ?? 100,
      search: params?.search,
    }),

  get: (id: string) =>
    api
      .get<{ employee: EmployeeInfo }>(`/employees/${id}`)
      .then((r) => r.employee),

  designations: () =>
    api
      .get<{ designations: Designation[] }>("/employees/designations")
      .then((r) => r.designations),

  departments: () =>
    api.get<{ items: Department[] }>("/departments").then((r) => r.items),

  create: (body: CreateEmployeeBody) =>
    api.post<{ employee_code: string }>("/employees", body),

  update: (id: string, body: UpdateEmployeeBody) =>
    api.put<EmployeeInfo>(`/employees/${id}`, body),

  promote: (id: string, body: PromoteBody) =>
    api.post<EmployeeInfo>(`/employees/${id}/promote`, body),

  increment: (id: string, body: IncrementBody) =>
    api.post<EmployeeInfo>(`/employees/${id}/increment`, body),

  deactivate: (id: string) =>
    api.post<EmployeeInfo>(`/employees/${id}/deactivate`),
};

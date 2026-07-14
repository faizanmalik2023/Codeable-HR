import { api } from "@/lib/api/client";
import type { AttendanceMonthModel, Paginated } from "@/types";

/** Row in the HR attendance employee directory. */
export interface HrAttendanceEmployee {
  employee_code: string;
  full_name: string;
  department?: string;
  avatar?: string | null;
}

/** HR-facing attendance endpoints — browse employees, view a month's logs. */
export const hrAttendanceApi = {
  /** Employee directory — server `name`/`department` search; array or paginated. */
  employees: (params: { name?: string; department?: string; page?: number }) =>
    api.get<Paginated<HrAttendanceEmployee> | { items: HrAttendanceEmployee[] }>(
      "/attendance/employees",
      { name: params.name, department: params.department, page: params.page }
    ),

  /** A single employee's whole-month attendance log — no pagination. */
  employeeLogs: (code: string, params: { month: number; year: number }) =>
    api.get<AttendanceMonthModel>(`/attendance/employees/${code}/logs`, {
      month: params.month,
      year: params.year,
    }),
};

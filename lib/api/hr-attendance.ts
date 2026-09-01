import { api } from "@/lib/api/client";
import type { AttendanceMonthModel, EmployeeRef, Paginated } from "@/types";

/** Row in the HR attendance employee directory. The person is nested under
 *  `employee` (canonical EmployeeRef); the health stats sit alongside it. */
export interface HrAttendanceEmployee {
  employee: EmployeeRef;
  attendance_percentage?: number;
  avg_daily_hours?: number;
  health?: string;
}

/** One row of the attendance review queue — a day HR must decide (overtime or a
 *  backdated/conflicting checkout). Shows both the effective checkout and what the
 *  machine actually recorded. */
export interface AttendanceReviewModel {
  id: string;
  employee?: EmployeeRef;
  date?: string;
  check_in_time?: string | null;
  check_out_time?: string | null;
  recorded_check_out_time?: string | null;
  hours_worked?: { hours: number; minutes: number };
  shift_hours?: number;
  overtime_minutes?: number;
  checkout_status?: string;
  unclosed?: boolean;
  reasons?: string[];
  adjustment?: { requested_out?: string; source?: string; note?: string | null } | null;
  review_note?: string | null;
  status?: string;
  reviewed_at?: string | null;
  created_at?: string | null;
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

  /** The decision queue. Defaults server-side to pending — the actionable view. */
  reviews: (params: { status?: string; page?: number; limit?: number }) =>
    api.get<Paginated<AttendanceReviewModel>>("/attendance/reviews", params),

  /** Approve: the recorded time stands (and any held correction takes effect). */
  approveReview: (id: string, note?: string) =>
    api.post<AttendanceReviewModel>(
      `/attendance/reviews/${id}/approve`,
      note ? { note } : {}
    ),

  /** Reject: the day is capped at shift hours; the employee is notified. */
  rejectReview: (id: string, note?: string) =>
    api.post<AttendanceReviewModel>(
      `/attendance/reviews/${id}/reject`,
      note ? { note } : {}
    ),
};

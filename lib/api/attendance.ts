import { api } from "@/lib/api/client";
import type { AttendanceMonthModel, AttendanceToday } from "@/types";

/** Query params for the monthly attendance log. */
export interface AttendanceLogsParams {
  /** Calendar month, 1–12. */
  month: number;
  /** Four-digit year. */
  year: number;
}

export const attendanceApi = {
  /** Whole-month attendance log — no pagination. */
  logs: ({ month, year }: AttendanceLogsParams) =>
    api.get<AttendanceMonthModel>("/attendance/logs", { month, year }),

  /** Today's live record — sessions + status for the work timer. */
  today: () => api.get<AttendanceToday>("/attendance/today"),
};

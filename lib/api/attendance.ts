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

  /**
   * Set the checkout time for a day left open (forgot to tap out).
   *
   * Same-day corrections apply immediately; a BACKDATED one is held until HR approves,
   * because correcting a day that already closed is a request to rewrite history rather
   * than someone finishing their own day. The server decides which — the response's
   * `checkout_status` says whether it landed (`final`) or is queued (`pending_approval`).
   *
   * `date` may be omitted for today. Times are ISO 8601.
   */
  adjustCheckout: (body: { check_out_time: string; date?: string; reason?: string }) =>
    api.post<AttendanceToday>("/attendance/checkout-adjust", body),
};

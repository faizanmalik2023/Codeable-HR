import { api } from "@/lib/api/client";
import type { SalarySlipStatus } from "@/lib/enums";
import type { EmployeeRef, Paginated, SalaryLineItem } from "@/types";

/* ------------------------------------------------------------------ */
/* Local types (not exported from `@/types`)                          */
/* ------------------------------------------------------------------ */

/** A payroll row for a given period — one employee's slip summary. */
export interface PayrollSlip {
  id: string;
  employee: EmployeeRef;
  month: number | string;
  year: number;
  status: SalarySlipStatus;
  net?: number;
  basic_salary?: number;
}

/** Full slip detail (HR view) — breakdown line items + totals. */
export interface PayrollSlipDetail {
  id: string;
  employee: EmployeeRef;
  month: number | string;
  year: number;
  status: SalarySlipStatus;
  basic_salary?: number;
  earnings?: SalaryLineItem[];
  deductions?: SalaryLineItem[];
  tax?: number;
  provident_fund?: number;
  gross?: number;
  net?: number;
}

/** Result of a period-wide generate run. */
export interface PayrollGenerateResult {
  month: number;
  year: number;
  total: number;
  created: number;
  skipped: number;
}

/** Result of a period-wide release run. */
export interface PayrollReleaseResult {
  month: number;
  year: number;
  total: number;
  failed: number;
}

/** Editable slip payload for an amendment. */
export interface PayrollAmendBody {
  basic_salary: number;
  earnings: SalaryLineItem[];
  deductions: SalaryLineItem[];
}

/** Signed download URL for a single slip. */
export interface PayrollSlipDownload {
  url: string;
}

/* ------------------------------------------------------------------ */
/* API                                                                 */
/* ------------------------------------------------------------------ */

export const payrollApi = {
  /** Payroll slips for a period (defaults to a full page of 100). */
  slips: (params: { month: number; year: number; page?: number; limit?: number }) =>
    api.get<Paginated<PayrollSlip>>("/salary/payroll/slips", {
      month: params.month,
      year: params.year,
      page: params.page ?? 1,
      limit: params.limit ?? 100,
    }),

  /** Generate slips for everyone with a salary config in the period. */
  generate: (body: { month: number; year: number }) =>
    api.post<PayrollGenerateResult>("/salary/payroll/generate", body),

  /** Release (send) every pending slip in the period. */
  release: (body: { month: number; year: number }) =>
    api.post<PayrollReleaseResult>("/salary/payroll/release", body),

  /** Full slip detail. */
  slip: (id: string) => api.get<PayrollSlipDetail>(`/salary/slips/${id}`),

  /** Amend a pending slip's basic / earnings / deductions. */
  amend: (id: string, body: PayrollAmendBody) =>
    api.patch<PayrollSlipDetail>(`/salary/slips/${id}`, body),

  /** Release a single pending slip. */
  releaseOne: (id: string) =>
    api.patch<PayrollSlipDetail>(`/salary/slips/${id}`, { status: "generated" }),

  /** Signed download URL (HR/staff variant). */
  download: (id: string) =>
    api.get<PayrollSlipDownload>(`/salary/slips/${id}/staff-download`),
};

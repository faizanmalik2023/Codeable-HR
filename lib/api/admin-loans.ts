import { api } from "@/lib/api/client";
import type { Paginated } from "@/types";

/* ------------------------------------------------------------------ */
/* Local model interfaces (types/index.ts is off-limits here)          */
/* ------------------------------------------------------------------ */

/** Lifecycle of an employee loan. */
export type LoanStatus = "active" | "completed" | "cancelled";

/** How a repayment was applied. */
export type RepaymentType = "payroll_deduction" | "manual";

/** Nested borrower reference carried on every loan payload. */
export interface LoanEmployee {
  full_name: string;
  employee_code: string;
  avatar?: string | null;
}

/** A single repayment against a loan (ledger row). */
export interface LoanRepayment {
  date: string;
  type: RepaymentType;
  amount: number;
  month?: string | null;
  note?: string | null;
}

/** Employee loan record. `monthly_deduction` null/0 = dynamic (no fixed auto-deduction). */
export interface Loan {
  id: string;
  employee: LoanEmployee;
  principal: number;
  balance_remaining: number;
  amount_repaid: number;
  /** null or 0 → dynamic loan (repaid ad-hoc, no fixed monthly amount). */
  monthly_deduction: number | null;
  status: LoanStatus;
  start_month?: string | null;
  name?: string | null;
  note?: string | null;
  repayments?: LoanRepayment[];
}

/* ------------------------------------------------------------------ */
/* Request bodies                                                      */
/* ------------------------------------------------------------------ */

export interface CreateLoanBody {
  principal: number;
  user_id: string;
  name?: string;
  monthly_deduction?: number;
  start_month?: string;
  note?: string;
}

export interface UpdateLoanBody {
  name?: string;
  principal?: number;
  monthly_deduction?: number;
  status?: LoanStatus;
  note?: string;
}

export interface RecordPaymentBody {
  amount: number;
  type: "manual";
  month?: string;
  date?: string;
  note?: string;
}

/* ------------------------------------------------------------------ */
/* Local query keys (shared catalog lib/query/keys.ts is off-limits)   */
/* ------------------------------------------------------------------ */

export const adminLoanKeys = {
  all: ["admin-loans"] as const,
  list: (status: string, page: number) =>
    ["admin-loans", "list", status, page] as const,
  detail: (id: string) => ["admin-loans", "detail", id] as const,
  payments: (id: string) => ["admin-loans", "detail", id, "payments"] as const,
};

/** Filter-tab values for the loans list. `all` → no status param. */
export const LOAN_FILTERS = ["all", "active", "completed", "cancelled"] as const;

export const LOAN_STATUS_LABELS: Record<LoanStatus, string> = {
  active: "Active",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const LOAN_STATUS_TONE: Record<
  LoanStatus,
  "success" | "muted" | "destructive"
> = {
  active: "success",
  completed: "muted",
  cancelled: "destructive",
};

/**
 * Estimated remaining installments for a fixed-deduction loan.
 * Returns `null` for dynamic loans (no fixed monthly amount).
 */
export function estInstallments(
  balance: number,
  monthlyDeduction: number | null | undefined
): number | null {
  if (!monthlyDeduction || monthlyDeduction <= 0) return null;
  return Math.ceil(balance / monthlyDeduction);
}

/* ------------------------------------------------------------------ */
/* API surface                                                         */
/* ------------------------------------------------------------------ */

export const adminLoansApi = {
  list: (params: { page?: number; limit?: number; status?: string }) =>
    api.get<Paginated<Loan>>("/admin/loans", {
      page: params.page ?? 1,
      limit: params.limit ?? 10,
      status: params.status,
    }),

  get: (id: string) => api.get<Loan>(`/admin/loans/${id}`),

  create: (body: CreateLoanBody) => api.post<Loan>("/admin/loans", body),

  update: (id: string, body: UpdateLoanBody) =>
    api.patch<Loan>(`/admin/loans/${id}`, body),

  remove: (id: string) => api.delete<void>(`/admin/loans/${id}`),

  payments: (id: string) =>
    api.get<LoanRepayment[]>(`/admin/loans/${id}/payments`),

  recordPayment: (id: string, body: RecordPaymentBody) =>
    api.post<Loan>(`/admin/loans/${id}/payments`, body),
};

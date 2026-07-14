import { api } from "@/lib/api/client";
import type { Paginated } from "@/types";
import type { ExpenseCurrency } from "@/lib/enums";

/* ------------------------------------------------------------------ */
/* Local enums (lib/enums.ts is off-limits for this feature)           */
/* ------------------------------------------------------------------ */

/** Money direction for a manual treasury adjustment. */
export type AdjustmentDirection = "in" | "out";
export const ADJUSTMENT_DIRECTION_LABELS: Record<AdjustmentDirection, string> = {
  in: "Inflow",
  out: "Outflow",
};

/** Adjustment classification. */
export type AdjustmentType = "tax" | "provident_fund" | "capital" | "other";
export const ADJUSTMENT_TYPE_LABELS: Record<AdjustmentType, string> = {
  tax: "Tax",
  provident_fund: "Provident Fund",
  capital: "Capital",
  other: "Other",
};

/** Direction filter tab values — `all` means no direction param. */
export const ADJUSTMENT_DIRECTION_FILTERS = ["all", "in", "out"] as const;

/* ------------------------------------------------------------------ */
/* Local models (types/index.ts is off-limits for this feature)        */
/* ------------------------------------------------------------------ */

/** `GET /admin/treasury` — the live treasury snapshot. */
export interface TreasuryOverview {
  currency: ExpenseCurrency;
  opening_balance: number;
  opening_date?: string | null;
  total_income: number;
  total_expenses: number;
  net_profit_to_date: number;
  total_disbursed: number;
  total_payroll: number;
  loans_outstanding: number;
  adjustments_net: number;
  current_balance: number;
  note?: string | null;
  updated_at?: string | null;
}

/** `GET /admin/treasury/opening` — the configured opening balance. */
export interface TreasuryOpening {
  opening_balance: number;
  opening_date?: string | null;
  currency: ExpenseCurrency;
  note?: string | null;
}

/** A single monthly cash-flow data point (an item of `analytics.monthly`). */
export interface CashFlowPoint {
  month: string;
  income: number;
  expenses: number;
  net_change: number;
  running_balance: number;
}

/** `GET /admin/treasury/analytics` — nested `{ range, currency, totals, monthly }`. */
export interface TreasuryAnalytics {
  range?: { from: string; to: string };
  currency?: ExpenseCurrency;
  totals?: Record<string, number>;
  monthly: CashFlowPoint[];
}

/** `GET /admin/finance/report` — a P&L + cash-flow report for a date range. */
export interface FinanceReport {
  period?: { from: string; to: string };
  currency?: ExpenseCurrency;
  profit_and_loss: {
    income: number;
    expenses: number;
    net_profit: number;
    equity_distributed: number;
    payroll: number;
    retained: number;
  };
  cash_flow: {
    loan_disbursed: number;
    loan_repaid: number;
    adjustments_net: number;
    net_change: number;
    monthly?: CashFlowPoint[];
  };
  treasury: {
    current_balance: number;
    loans_outstanding: number;
  };
  generated_at: string;
}

/** An immutable finance audit-trail entry. */
export interface AuditEntry {
  id?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  actor: string;
  created_at: string;
}

/** A closed accounting period. */
export interface FinancePeriod {
  id?: string;
  month: string;
  note?: string | null;
  closed_at?: string | null;
  closed_by?: string | null;
}

/** A manual treasury adjustment. */
export interface Adjustment {
  id: string;
  type: AdjustmentType;
  direction: AdjustmentDirection;
  amount: number;
  currency: ExpenseCurrency;
  date?: string | null;
  description?: string | null;
  created_at?: string | null;
}

/* ------------------------------------------------------------------ */
/* Request bodies                                                      */
/* ------------------------------------------------------------------ */

export interface SetOpeningBody {
  opening_balance: number;
  opening_date?: string;
  currency?: ExpenseCurrency;
  note?: string;
}

export interface DateRangeParams {
  from?: string;
  to?: string;
}

export interface CreateAdjustmentBody {
  type: AdjustmentType;
  direction: AdjustmentDirection;
  amount: number;
  currency?: ExpenseCurrency;
  date?: string;
  description?: string;
}

export interface ClosePeriodBody {
  month: string;
  note?: string;
}

/* ------------------------------------------------------------------ */
/* API surface                                                         */
/* ------------------------------------------------------------------ */

export const adminTreasuryApi = {
  overview: () => api.get<TreasuryOverview>("/admin/treasury"),

  setOpening: (body: SetOpeningBody) =>
    api.put<TreasuryOpening>("/admin/treasury/opening", body),

  analytics: (params: DateRangeParams) =>
    api.get<TreasuryAnalytics>("/admin/treasury/analytics", {
      from: params.from,
      to: params.to,
    }),

  report: (params: DateRangeParams) =>
    api.get<FinanceReport>("/admin/finance/report", {
      from: params.from,
      to: params.to,
    }),

  audit: (params: {
    page?: number;
    limit?: number;
    entityType?: string;
    action?: string;
  }) =>
    api.get<Paginated<AuditEntry>>("/admin/finance/audit", {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      entity_type: params.entityType,
      action: params.action,
    }),

  periods: (params: { page?: number; limit?: number }) =>
    api.get<Paginated<FinancePeriod>>("/admin/finance/periods", {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
    }),

  closePeriod: (body: ClosePeriodBody) =>
    api.post<FinancePeriod>("/admin/finance/periods", body),

  reopenPeriod: (month: string) =>
    api.delete<void>(`/admin/finance/periods/${month}`),

  adjustments: (params: {
    page?: number;
    limit?: number;
    type?: string;
    direction?: string;
  }) =>
    api.get<Paginated<Adjustment>>("/admin/finance/adjustments", {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      type: params.type,
      direction: params.direction,
    }),

  createAdjustment: (body: CreateAdjustmentBody) =>
    api.post<Adjustment>("/admin/finance/adjustments", body),

  deleteAdjustment: (id: string) =>
    api.delete<void>(`/admin/finance/adjustments/${id}`),
};

/* ------------------------------------------------------------------ */
/* Local query keys (lib/query/keys.ts is off-limits for this feature) */
/* ------------------------------------------------------------------ */

export const adminTreasuryKeys = {
  all: ["admin-treasury"] as const,
  overview: () => ["admin-treasury", "overview"] as const,
  opening: () => ["admin-treasury", "opening"] as const,
  analytics: (from?: string, to?: string) =>
    ["admin-treasury", "analytics", from ?? null, to ?? null] as const,
  report: (from?: string, to?: string) =>
    ["admin-treasury", "report", from ?? null, to ?? null] as const,
  audit: (page: number, entityType?: string, action?: string) =>
    ["admin-treasury", "audit", page, entityType ?? null, action ?? null] as const,
  periods: (page: number) => ["admin-treasury", "periods", page] as const,
  adjustments: (page: number, type: string, direction: string) =>
    ["admin-treasury", "adjustments", page, type, direction] as const,
};

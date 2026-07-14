/**
 * Admin Company Expenses — company expense ledger.
 *
 * Wire types and query keys are defined locally so the shared
 * `lib/query/keys.ts` and `types/index.ts` stay untouched (per feature rules).
 */

import { api } from "@/lib/api/client";
import type { ExpenseCurrency, Tone } from "@/lib/enums";
import type { Paginated } from "@/types";

/* ------------------------------------------------------------------ */
/* Wire types                                                          */
/* ------------------------------------------------------------------ */

/** How the expense recurs / is priced. */
export type ExpenseAmountType = "one_time" | "fixed" | "variable";

/** Ledger row lifecycle. */
export type ExpenseRecordStatus = "recorded" | "pending_amount" | "paid";

/** A single company-expense ledger entry. */
export interface AdminExpense {
  id: string;
  name: string;
  /** Category key (server `expense_type`). */
  type: string;
  amount: number;
  item: string;
  date: string;
  payment_method?: string | null;
  vendor?: string | null;
  description?: string | null;
  is_recurring: boolean;
  amount_type: ExpenseAmountType;
  /** Ledger lifecycle (server `entry_status`). */
  entry_status: ExpenseRecordStatus;
  reimburse_to_employee_code?: string | null;
  attachment_path?: string | null;
  currency: ExpenseCurrency;
}

/** Create/update payload. */
export interface ExpenseBody {
  name: string;
  type: string;
  amount: number;
  item: string;
  date?: string;
  payment_method?: string | null;
  vendor?: string | null;
  description?: string | null;
  is_recurring: boolean;
  amount_type?: ExpenseAmountType;
  reimburse_to_employee_code?: string | null;
  attachment?: string | null;
  currency?: ExpenseCurrency;
}

/** Server-supplied picker options for the ledger (`GET /admin/expenses/options`). */
export interface AdminExpenseOptions {
  types?: string[];
  categories?: string[];
  payment_methods?: string[];
  currencies?: string[];
}

/** A recurring definition awaiting a per-occurrence amount. */
export interface PendingEntry {
  id: string;
  name: string;
  type?: string;
  date?: string | null;
  vendor?: string | null;
  currency?: ExpenseCurrency;
  amount_type?: ExpenseAmountType;
}

/** One slice of an analytics/report breakdown (server keys `category`/`total`). */
export interface ExpenseBreakdownItem {
  category?: string;
  total: number;
  count?: number;
  pct?: number;
}

/** A point on the spend-over-time trend. */
export interface ExpenseTrendPoint {
  month?: string;
  total: number;
  recurring?: number;
  one_time?: number;
}

/** Rollup totals nested under `analytics.totals`. */
export interface AdminExpenseTotals {
  total_spend: number;
  recurring_total: number;
  one_time_total: number;
  monthly_recurring_commitment?: number;
  avg_monthly_spend?: number;
  current_month_total?: number;
  previous_month_total?: number;
  mom_change_pct?: number | null;
}

/** `GET /admin/expenses/analytics` — nested `{ range, totals, monthly_trend, by_category }`. */
export interface AdminExpenseAnalytics {
  range?: { from: string; to: string };
  totals: AdminExpenseTotals;
  monthly_trend?: ExpenseTrendPoint[];
  by_category?: ExpenseBreakdownItem[];
}

/** Nested summary under `report.summary`. */
export interface AdminExpenseReportSummary {
  total_spend: number;
  recurring_total: number;
  one_time_total: number;
  by_category?: ExpenseBreakdownItem[];
}

/** `GET /admin/expenses/report` — `{ period, summary, line_items, generated_at }`. */
export interface AdminExpenseReport {
  period?: { from: string; to: string; label?: string };
  summary: AdminExpenseReportSummary;
  generated_at?: string;
}

/** A recurring-expense template. */
export interface ExpenseTemplate {
  id: string;
  name: string;
  category?: string;
  amount_type?: ExpenseAmountType;
  default_amount: number;
  currency?: ExpenseCurrency;
  /** Human cadence, e.g. "Monthly". */
  cadence?: string | null;
  frequency?: string | null;
  day_of_month?: number | null;
  start_month?: string;
  end_month?: string | null;
  next_due_month?: string | null;
  is_active: boolean;
}

/* ------------------------------------------------------------------ */
/* Display helpers (pure)                                              */
/* ------------------------------------------------------------------ */

/** Turn an enum key like `office_supplies` into `Office Supplies`. */
export function prettify(key: string | null | undefined): string {
  if (!key) return "—";
  return key
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export const EXPENSE_STATUS_META: Record<
  ExpenseRecordStatus,
  { label: string; tone: Tone }
> = {
  recorded: { label: "Recorded", tone: "muted" },
  pending_amount: { label: "Pending amount", tone: "warning" },
  paid: { label: "Paid", tone: "success" },
};

export function statusMeta(status: string): { label: string; tone: Tone } {
  return (
    EXPENSE_STATUS_META[status as ExpenseRecordStatus] ?? {
      label: prettify(status),
      tone: "muted" as Tone,
    }
  );
}

/* ------------------------------------------------------------------ */
/* List params                                                         */
/* ------------------------------------------------------------------ */

export interface AdminExpenseListParams {
  page?: number;
  limit?: number;
  /** `YYYY-MM`. */
  month?: string;
  /** `one_time` | `recurring` (single value; `all` omitted). */
  frequency?: string;
  /** Comma-joined category keys. */
  category?: string;
  search?: string;
}

/* ------------------------------------------------------------------ */
/* Local query keys                                                    */
/* ------------------------------------------------------------------ */

export const aeKeys = {
  all: ["admin-expenses"] as const,
  list: (params: AdminExpenseListParams) =>
    ["admin-expenses", "list", params] as const,
  detail: (id: string) => ["admin-expenses", "detail", id] as const,
  options: ["admin-expenses", "options"] as const,
  pending: ["admin-expenses", "pending-entries"] as const,
  analytics: ["admin-expenses", "analytics"] as const,
  report: (from: string, to: string) =>
    ["admin-expenses", "report", from, to] as const,
  templates: ["admin-expenses", "templates"] as const,
};

/* ------------------------------------------------------------------ */
/* API                                                                 */
/* ------------------------------------------------------------------ */

export const adminExpensesApi = {
  list: (params: AdminExpenseListParams) =>
    api.get<Paginated<AdminExpense>>("/admin/expenses", {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      month: params.month || undefined,
      frequency: params.frequency || undefined,
      category: params.category || undefined,
      search: params.search || undefined,
    }),

  get: (id: string) => api.get<AdminExpense>(`/admin/expenses/${id}`),

  options: () => api.get<AdminExpenseOptions>("/admin/expenses/options"),

  pendingEntries: () =>
    api
      .get<{ count: number; items: PendingEntry[] } | PendingEntry[]>(
        "/admin/expenses/pending-entries",
      )
      .then((r) => (Array.isArray(r) ? r : r?.items ?? [])),

  analytics: () =>
    api.get<AdminExpenseAnalytics>("/admin/expenses/analytics"),

  report: (params: { from: string; to: string }) =>
    api.get<AdminExpenseReport>("/admin/expenses/report", {
      from: params.from,
      to: params.to,
    }),

  create: (body: ExpenseBody) =>
    api.post<AdminExpense>("/admin/expenses", body),

  update: (id: string, body: Partial<ExpenseBody>) =>
    api.patch<AdminExpense>(`/admin/expenses/${id}`, body),

  remove: (id: string) => api.delete<void>(`/admin/expenses/${id}`),

  /* recurring templates */
  templates: () =>
    api
      .get<{ items: ExpenseTemplate[] } | ExpenseTemplate[]>("/admin/expense-templates")
      .then((r) => (Array.isArray(r) ? r : r?.items ?? [])),

  templateToggle: (id: string, is_active: boolean) =>
    api.patch<ExpenseTemplate>(`/admin/expense-templates/${id}`, { is_active }),

  templateDelete: (id: string) =>
    api.delete<void>(`/admin/expense-templates/${id}?keep_occurrences=true`),
};

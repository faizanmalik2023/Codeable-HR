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
  status: ExpenseRecordStatus;
  reimburse_to_employee_code?: string | null;
  attachment?: string | null;
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

/** Server-supplied picker options for the ledger. */
export interface AdminExpenseOptions {
  expense_type?: string[];
  payment_method?: string[];
  amount_type?: string[];
  currency?: string[];
  /** Some backends key categories differently — kept for resilience. */
  category?: string[];
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

/** One slice of an analytics/report breakdown. */
export interface ExpenseBreakdownItem {
  key?: string;
  label?: string;
  type?: string;
  amount: number;
  count?: number;
  percentage?: number;
}

/** A point on the spend-over-time trend. */
export interface ExpenseTrendPoint {
  key?: string;
  label?: string;
  month?: string;
  amount: number;
}

/** `GET /admin/expenses/analytics` — flexible so backend shape can evolve. */
export interface AdminExpenseAnalytics {
  currency?: ExpenseCurrency;
  total?: number;
  total_amount?: number;
  recurring_total?: number;
  one_time_total?: number;
  count?: number;
  by_category?: ExpenseBreakdownItem[];
  by_payment_method?: ExpenseBreakdownItem[];
  monthly_trend?: ExpenseTrendPoint[];
}

/** `GET /admin/expenses/report` — financial summary for a date range. */
export interface AdminExpenseReport {
  currency?: ExpenseCurrency;
  total?: number;
  total_amount?: number;
  count?: number;
  recurring_total?: number;
  one_time_total?: number;
  reimbursable_total?: number;
  by_category?: ExpenseBreakdownItem[];
  by_payment_method?: ExpenseBreakdownItem[];
}

/** A recurring-expense template. */
export interface ExpenseTemplate {
  id: string;
  name: string;
  amount: number;
  currency?: ExpenseCurrency;
  type?: string;
  amount_type?: ExpenseAmountType;
  /** Human cadence, e.g. "Monthly". */
  cadence?: string | null;
  frequency?: string | null;
  day_of_month?: number | null;
  next_run?: string | null;
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
    api.get<PendingEntry[]>("/admin/expenses/pending-entries"),

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
  templates: () => api.get<ExpenseTemplate[]>("/admin/expense-templates"),

  templateToggle: (id: string, is_active: boolean) =>
    api.patch<ExpenseTemplate>(`/admin/expense-templates/${id}`, { is_active }),

  templateDelete: (id: string) =>
    api.delete<void>(`/admin/expense-templates/${id}?keep_occurrences=true`),
};

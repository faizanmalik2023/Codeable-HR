import { api } from "@/lib/api/client";
import type { Paginated } from "@/types";
import type { ExpenseCurrency } from "@/lib/enums";

/* ------------------------------------------------------------------ */
/* Local model interfaces (types/index.ts is off-limits here)          */
/* ------------------------------------------------------------------ */

/** A single project-income ledger entry. */
export interface ProjectIncome {
  id: string;
  name: string;
  amount: number;
  project_id?: string | null;
  project_name?: string | null;
  source?: string | null;
  currency: ExpenseCurrency | string;
  date?: string | null;
  description?: string | null;
  attachment?: string | null;
  is_reversed?: boolean;
  reversed_at?: string | null;
}

/** Per-currency total in the summary breakdown. */
export interface CurrencyTotal {
  currency: ExpenseCurrency | string;
  amount: number;
}

/** `GET /admin/project-income/summary` — headline totals. */
export interface ProjectIncomeSummary {
  /** Everything normalised to PKR. */
  total_pkr: number;
  /** Number of income records in range. */
  count: number;
  /** Original-currency breakdown (e.g. PKR + USD). */
  totals?: CurrencyTotal[];
}

/* ------------------------------------------------------------------ */
/* Request bodies / params                                             */
/* ------------------------------------------------------------------ */

export interface IncomeListParams {
  page?: number;
  limit?: number;
  search?: string;
  project_id?: string;
  month?: string;
  from?: string;
  to?: string;
}

export interface IncomeSummaryParams {
  from?: string;
  to?: string;
}

export interface CreateIncomeBody {
  name: string;
  amount: number;
  project_id?: string;
  source?: string;
  currency: ExpenseCurrency | string;
  date?: string;
  description?: string;
  attachment?: string;
}

export type UpdateIncomeBody = Partial<CreateIncomeBody>;

/* ------------------------------------------------------------------ */
/* API surface                                                         */
/* ------------------------------------------------------------------ */

export const adminIncomeApi = {
  list: (params: IncomeListParams = {}) =>
    api.get<Paginated<ProjectIncome>>("/admin/project-income", {
      page: params.page ?? 1,
      limit: params.limit ?? 10,
      search: params.search,
      project_id: params.project_id,
      month: params.month,
      from: params.from,
      to: params.to,
    }),

  summary: (params: IncomeSummaryParams = {}) =>
    api.get<ProjectIncomeSummary>("/admin/project-income/summary", {
      from: params.from,
      to: params.to,
    }),

  get: (id: string) => api.get<ProjectIncome>(`/admin/project-income/${id}`),

  create: (body: CreateIncomeBody) =>
    api.post<ProjectIncome>("/admin/project-income", body),

  update: (id: string, body: UpdateIncomeBody) =>
    api.patch<ProjectIncome>(`/admin/project-income/${id}`, body),

  reverse: (id: string) =>
    api.post<ProjectIncome>(`/admin/project-income/${id}/reverse`),

  remove: (id: string) => api.delete<void>(`/admin/project-income/${id}`),
};

/* ------------------------------------------------------------------ */
/* Local query keys (keys.ts is off-limits for this feature)           */
/* ------------------------------------------------------------------ */

export const adminIncomeKeys = {
  all: ["admin-income"] as const,
  list: (params: IncomeListParams) =>
    ["admin-income", "list", params] as const,
  summary: (from?: string, to?: string) =>
    ["admin-income", "summary", from ?? null, to ?? null] as const,
  detail: (id: string) => ["admin-income", "detail", id] as const,
};

import { api } from "@/lib/api/client";
import type { Paginated } from "@/types";
import type { ExpenseCurrency } from "@/lib/enums";

/* ------------------------------------------------------------------ */
/* Local model interfaces (types/index.ts is off-limits here)          */
/* ------------------------------------------------------------------ */

/** A referenced project on an income entry / summary line. */
export interface IncomeProjectRef {
  id: string;
  code?: string | null;
  name: string;
  client_name?: string | null;
}

/** A single project-income ledger entry. */
export interface ProjectIncome {
  id: string;
  name: string;
  amount: number;
  project_id?: string | null;
  /** Populated project reference on reads. */
  project?: IncomeProjectRef | null;
  source?: string | null;
  currency: ExpenseCurrency | string;
  date?: string | null;
  description?: string | null;
  attachment_path?: string | null;
  is_reversed?: boolean;
  reversed_at?: string | null;
}

/** One per-project total in the summary breakdown. */
export interface ProjectSummaryLine {
  project_id?: string | null;
  project?: IncomeProjectRef | null;
  total: number;
  count: number;
}

/** `GET /admin/project-income/summary` — `{ range, total_income, by_project }`. */
export interface ProjectIncomeSummary {
  range?: { from: string | null; to: string | null };
  /** Grand total (PKR) over the range. */
  total_income: number;
  by_project: ProjectSummaryLine[];
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

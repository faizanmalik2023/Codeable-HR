import { api } from "@/lib/api/client";
import type { Paginated } from "@/types";
import type { ExpenseCurrency } from "@/lib/enums";

/**
 * The company's financial position — where cash actually sits, what is owed to it,
 * what is forecast, and what it owns.
 *
 * Nothing here feeds net profit or the treasury balance. Income counts when it
 * arrives, not when it is expected; an asset is already expensed when it was bought.
 * This is the balance-sheet side, kept deliberately separate from the P&L.
 */

export type CashAccountKind =
  | "bank"
  | "upwork"
  | "payoneer"
  | "wise"
  | "mercury"
  | "cash"
  | "other";

export const CASH_ACCOUNT_KIND_LABELS: Record<CashAccountKind, string> = {
  bank: "Bank",
  upwork: "Upwork",
  payoneer: "Payoneer",
  wise: "Wise",
  mercury: "Mercury",
  cash: "Cash",
  other: "Other",
};

/**
 * How certain incoming money is.
 * `confirmed` is the only stage worth leaning on for a cash-flow decision.
 */
export type ReceivableStage = "confirmed" | "unconfirmed" | "pipeline";
export const RECEIVABLE_STAGE_LABELS: Record<ReceivableStage, string> = {
  confirmed: "Confirmed",
  unconfirmed: "Not confirmed",
  pipeline: "Pipeline",
};

export type ReceivableCadence = "one_time" | "monthly";
export const RECEIVABLE_CADENCE_LABELS: Record<ReceivableCadence, string> = {
  one_time: "One-time",
  monthly: "Monthly",
};

export type AssetCategory =
  | "equipment"
  | "furniture"
  | "vehicle"
  | "property"
  | "software"
  | "investment"
  | "other";

export const ASSET_CATEGORY_LABELS: Record<AssetCategory, string> = {
  equipment: "Equipment",
  furniture: "Furniture",
  vehicle: "Vehicle",
  property: "Property",
  software: "Software",
  investment: "Investment",
  other: "Other",
};

export type AssetStatus = "active" | "disposed" | "written_off";
export const ASSET_STATUS_LABELS: Record<AssetStatus, string> = {
  active: "Active",
  disposed: "Disposed",
  written_off: "Written off",
};

export interface CashAccount {
  id: string;
  name: string;
  kind: CashAccountKind;
  holder_id: string | null;
  holder: string | null;
  currency: ExpenseCurrency;
  balance: number;
  balance_pkr: number;
  conversion_rate: number | null;
  /** When someone last checked this against the real account. */
  last_reconciled_at: string | null;
  is_active: boolean;
  sort_order: number;
  note: string | null;
  updated_at: string;
}

export interface Receivable {
  id: string;
  name: string;
  stage: ReceivableStage;
  cadence: ReceivableCadence;
  project_id: string | null;
  project: string | null;
  client: string | null;
  amount: number;
  currency: ExpenseCurrency;
  amount_pkr: number;
  expected_month: string | null;
  /** Months a `monthly` retainer runs. Null start = already running, null end = rolling. */
  start_month: string | null;
  end_month: string | null;
  settled_at: string | null;
  note: string | null;
  created_at: string;
}

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  quantity: number;
  value: number;
  purchase_value: number | null;
  currency: ExpenseCurrency;
  value_pkr: number;
  /** value_pkr × quantity — what every summary adds up. */
  total_value_pkr: number;
  purchased_at: string | null;
  assigned_to_id: string | null;
  assigned_to: string | null;
  location: string | null;
  serial_number: string | null;
  status: AssetStatus;
  disposed_at: string | null;
  note: string | null;
  created_at: string;
}

export interface Position {
  currency: ExpenseCurrency;
  usd_to_pkr: number;
  available: {
    by_currency: {
      currency: ExpenseCurrency;
      total: number;
      accounts: { id: string; name: string; holder: string | null; balance: number }[];
    }[];
    total_pkr: number;
  };
  receivables: {
    confirmed: { total: number; total_pkr: number; count: number };
    unconfirmed: { total: number; total_pkr: number; count: number };
  };
  pipeline: {
    months: number;
    /** Recurring revenue per month across the pipeline. */
    monthly_run: number;
    monthly_run_pkr: number;
    one_time: number;
    one_time_pkr: number;
    /** monthly_run × months + one_time. */
    projected: number;
    projected_pkr: number;
  };
  assets: {
    total_pkr: number;
    by_category: { category: AssetCategory; total_pkr: number; units: number }[];
  };
  /**
   * The books vs the bank. Computed two completely independent ways, so a gap means
   * either a movement was never recorded or an account balance is stale.
   */
  reconciliation: {
    ledger_balance_pkr: number;
    accounts_balance_pkr: number;
    difference_pkr: number;
  };
  /** Cash + confirmed only. Hope and forecast excluded — plan against this one. */
  secure_position_pkr: number;
  net_worth_pkr: number;
}

export interface AccountsResponse {
  items: CashAccount[];
  totals: {
    by_currency: { currency: ExpenseCurrency; total: number }[];
    total_pkr: number;
  };
}

export interface AssetsResponse extends Paginated<Asset> {
  by_category: {
    category: AssetCategory;
    total_pkr: number;
    purchase_pkr: number;
    units: number;
    rows: number;
  }[];
  total_pkr: number;
}

export const adminPositionApi = {
  position: (pipelineMonths?: number) =>
    api.get<Position>("/admin/position", { pipeline_months: pipelineMonths }),

  accounts: () => api.get<AccountsResponse>("/admin/position/accounts", {}),
  createAccount: (body: Partial<CashAccount> & { name: string }) =>
    api.post<CashAccount>("/admin/position/accounts", body),
  updateAccount: (id: string, body: Partial<CashAccount>) =>
    api.patch<CashAccount>(`/admin/position/accounts/${id}`, body),
  deleteAccount: (id: string) => api.delete<void>(`/admin/position/accounts/${id}`),

  receivables: (params: { page?: number; limit?: number; stage?: ReceivableStage }) =>
    api.get<Paginated<Receivable>>("/admin/position/receivables", {
      page: params.page ?? 1,
      limit: params.limit ?? 50,
      stage: params.stage,
    }),
  createReceivable: (body: Partial<Receivable> & { name: string; stage: ReceivableStage }) =>
    api.post<Receivable>("/admin/position/receivables", body),
  updateReceivable: (id: string, body: Partial<Receivable>) =>
    api.patch<Receivable>(`/admin/position/receivables/${id}`, body),
  /** The money arrived — book the income separately; this closes the forecast row. */
  settleReceivable: (id: string) =>
    api.post<Receivable>(`/admin/position/receivables/${id}/settle`, {}),
  deleteReceivable: (id: string) => api.delete<void>(`/admin/position/receivables/${id}`),

  assets: (params: { page?: number; limit?: number; category?: AssetCategory; status?: AssetStatus }) =>
    api.get<AssetsResponse>("/admin/position/assets", {
      page: params.page ?? 1,
      limit: params.limit ?? 50,
      category: params.category,
      status: params.status,
    }),
  createAsset: (body: Partial<Asset> & { name: string; value: number }) =>
    api.post<Asset>("/admin/position/assets", body),
  updateAsset: (id: string, body: Partial<Asset>) =>
    api.patch<Asset>(`/admin/position/assets/${id}`, body),
  deleteAsset: (id: string) => api.delete<void>(`/admin/position/assets/${id}`),
};

export const adminPositionKeys = {
  all: ["admin-position"] as const,
  position: (months?: number) => ["admin-position", "overview", months ?? null] as const,
  accounts: () => ["admin-position", "accounts"] as const,
  receivables: (page: number, stage?: string) =>
    ["admin-position", "receivables", page, stage ?? null] as const,
  assets: (page: number, category?: string, status?: string) =>
    ["admin-position", "assets", page, category ?? null, status ?? null] as const,
};

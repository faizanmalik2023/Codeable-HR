import { api } from "@/lib/api/client";
import type { ExpenseCurrency } from "@/lib/enums";
import type { Paginated } from "@/types";

/* ------------------------------------------------------------------ */
/* Local enums (lib/enums.ts is off-limits for this feature)           */
/* ------------------------------------------------------------------ */

/** Category of an equity beneficiary. */
export type BeneficiaryKind = "person" | "esop" | "charity" | "other";

export const BENEFICIARY_KIND_LABELS: Record<BeneficiaryKind, string> = {
  person: "Person",
  esop: "ESOP",
  charity: "Charity",
  other: "Other",
};

export const BENEFICIARY_KIND_TONE: Record<
  BeneficiaryKind,
  "default" | "secondary" | "success" | "muted"
> = {
  person: "default",
  esop: "secondary",
  charity: "success",
  other: "muted",
};

export const BENEFICIARY_KIND_OPTIONS = (
  Object.keys(BENEFICIARY_KIND_LABELS) as BeneficiaryKind[]
).map((value) => ({ value, label: BENEFICIARY_KIND_LABELS[value] }));

/** Lifecycle of a profit distribution run. */
export type DistributionStatus = "draft" | "confirmed" | "voided";

export const DISTRIBUTION_STATUS_LABELS: Record<DistributionStatus, string> = {
  draft: "Draft",
  confirmed: "Confirmed",
  voided: "Voided",
};

export const DISTRIBUTION_STATUS_TONE: Record<
  DistributionStatus,
  "success" | "warning" | "muted" | "destructive"
> = {
  draft: "warning",
  confirmed: "success",
  voided: "destructive",
};

/** Filter-tab values for the distributions list. `all` → no status param. */
export const DISTRIBUTION_FILTERS = [
  "all",
  "draft",
  "confirmed",
  "voided",
] as const;

/** Currency picker options (design-system Select). */
export const EQUITY_CURRENCY_OPTIONS: { value: ExpenseCurrency; label: string }[] =
  [
    { value: "PKR", label: "PKR (₨)" },
    { value: "USD", label: "USD ($)" },
  ];

/* ------------------------------------------------------------------ */
/* Local model interfaces (types/index.ts is off-limits here)          */
/* ------------------------------------------------------------------ */

/** A configured equity beneficiary (cap-table entry). */
export interface Beneficiary {
  id: string;
  name: string;
  kind: BeneficiaryKind;
  /** Cap-table ownership percentage (0–100). */
  share_percent: number;
  /** Fraction of the owed amount actually paid out (0–100). */
  payout_rate: number;
  user_id?: string | null;
  is_active: boolean;
  sort_order?: number | null;
  note?: string | null;
}

/** A row on the allocation / cap-table overview. */
export interface AllocationRow {
  id?: string;
  name: string;
  kind: BeneficiaryKind;
  share_percent: number;
  payout_rate: number;
  /** Effective paid share = share_percent × payout_rate (0–100). */
  effective_paid_percent: number;
}

/** Roll-up figures for the allocation overview. */
export interface AllocationSummary {
  total_share_percent?: number;
  total_effective_paid_percent?: number;
  retained_percent?: number;
  active_beneficiaries?: number;
  currency?: ExpenseCurrency;
}

export interface AllocationResponse {
  beneficiaries: AllocationRow[];
  summary: AllocationSummary;
}

/** A pooled fund balance held for a non-person beneficiary (charity/ESOP/other). */
export interface Fund {
  beneficiary_id?: string | null;
  name: string;
  kind: BeneficiaryKind;
  collected: number;
  committed: number;
  /** Carried-forward pool balance (collected − committed, rolling). */
  balance: number;
  deficit?: boolean;
}

export interface FundsResponse {
  funds: Fund[];
}

/** A single per-beneficiary line inside a distribution run. */
export interface DistributionAllocationLine {
  beneficiary_id?: string | null;
  name: string;
  kind?: BeneficiaryKind;
  share_percent: number;
  payout_rate: number;
  receivable?: number;
  disbursed: number;
  retained?: number;
  committed?: number;
  remaining?: number;
}

/**
 * A profit-distribution run. `preview()` returns a NON-persisted instance
 * (usually without an `id`); `createDistribution()` persists it.
 */
export interface EquityDistribution {
  id?: string;
  period_label?: string | null;
  month?: string | null;
  net_profit: number;
  revenue?: number | null;
  expenses_total?: number | null;
  payroll?: number | null;
  currency: ExpenseCurrency;
  status: DistributionStatus;
  total_receivable?: number;
  /** Total actually disbursed to beneficiaries (sum of the allocation lines). */
  total_disbursed: number;
  allocated_retained?: number;
  /** Portion the company keeps (net profit not paid out). */
  company_retained: number;
  total_committed?: number;
  allocations: DistributionAllocationLine[];
  note?: string | null;
  created_at?: string | null;
}

/** A recurring monetary commitment owed to a beneficiary. */
export interface Commitment {
  id: string;
  beneficiary_id: string;
  /** Backend may expand the beneficiary; tolerate id-string or ref. */
  beneficiary?: { id: string; name: string } | null;
  name: string;
  amount: number;
  currency: ExpenseCurrency;
  is_active: boolean;
  start_month?: string | null;
  end_month?: string | null;
  note?: string | null;
}

/* ------------------------------------------------------------------ */
/* Request bodies                                                      */
/* ------------------------------------------------------------------ */

export interface BeneficiaryBody {
  name: string;
  kind: BeneficiaryKind;
  share_percent: number;
  payout_rate: number;
  user_id?: string | null;
  is_active?: boolean;
  sort_order?: number;
  note?: string;
}

export interface DistributionBody {
  period_label?: string;
  month?: string;
  net_profit?: number;
  revenue?: number;
  expenses_total?: number;
  currency?: ExpenseCurrency;
  note?: string;
}

export interface CommitmentBody {
  beneficiary_id: string;
  name: string;
  amount: number;
  currency?: ExpenseCurrency;
  is_active?: boolean;
  start_month?: string;
  end_month?: string;
  note?: string;
}

/* ------------------------------------------------------------------ */
/* Local query keys (shared catalog lib/query/keys.ts is off-limits)   */
/* ------------------------------------------------------------------ */

export const equityKeys = {
  all: ["admin-equity"] as const,
  allocation: ["admin-equity", "allocation"] as const,
  funds: ["admin-equity", "funds"] as const,
  beneficiaries: (isActive: string, page: number) =>
    ["admin-equity", "beneficiaries", isActive, page] as const,
  beneficiaryList: ["admin-equity", "beneficiaries", "all"] as const,
  beneficiary: (id: string) => ["admin-equity", "beneficiaries", "detail", id] as const,
  distributions: (status: string, page: number) =>
    ["admin-equity", "distributions", status, page] as const,
  distribution: (id: string) =>
    ["admin-equity", "distributions", "detail", id] as const,
  commitments: (beneficiaryId: string, isActive: string, page: number) =>
    ["admin-equity", "commitments", beneficiaryId, isActive, page] as const,
};

/* ------------------------------------------------------------------ */
/* API surface                                                         */
/* ------------------------------------------------------------------ */

export const adminEquityApi = {
  /* -- Overview -- */
  allocation: () =>
    api.get<AllocationResponse>("/admin/equity/allocation"),

  funds: () => api.get<FundsResponse>("/admin/equity/funds"),

  /* -- Beneficiaries -- */
  beneficiaries: (params: {
    page?: number;
    limit?: number;
    is_active?: boolean;
  }) =>
    api.get<Paginated<Beneficiary>>("/admin/equity/beneficiaries", {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      is_active: params.is_active,
    }),

  getBeneficiary: (id: string) =>
    api.get<Beneficiary>(`/admin/equity/beneficiaries/${id}`),

  createBeneficiary: (body: BeneficiaryBody) =>
    api.post<Beneficiary>("/admin/equity/beneficiaries", body),

  updateBeneficiary: (id: string, body: Partial<BeneficiaryBody>) =>
    api.patch<Beneficiary>(`/admin/equity/beneficiaries/${id}`, body),

  deleteBeneficiary: (id: string) =>
    api.delete<void>(`/admin/equity/beneficiaries/${id}`),

  /* -- Distributions -- */
  distributions: (params: { page?: number; limit?: number; status?: string }) =>
    api.get<Paginated<EquityDistribution>>("/admin/equity/distributions", {
      page: params.page ?? 1,
      limit: params.limit ?? 10,
      status: params.status,
    }),

  getDistribution: (id: string) =>
    api.get<EquityDistribution>(`/admin/equity/distributions/${id}`),

  /** Two-step gate — step 1: returns a NON-persisted preview run. */
  preview: (body: DistributionBody) =>
    api.post<EquityDistribution>("/admin/equity/distributions/preview", body),

  /** Two-step gate — step 2: persist (always send `status: "confirmed"`). */
  createDistribution: (body: DistributionBody & { status: "confirmed" }) =>
    api.post<EquityDistribution>("/admin/equity/distributions", body),

  voidDistribution: (id: string) =>
    api.post<EquityDistribution>(`/admin/equity/distributions/${id}/void`),

  settleDistribution: (id: string) =>
    api.post<EquityDistribution>(`/admin/equity/distributions/${id}/settle`),

  deleteDistribution: (id: string) =>
    api.delete<void>(`/admin/equity/distributions/${id}`),

  /* -- Commitments -- */
  commitments: (params: {
    page?: number;
    limit?: number;
    beneficiary_id?: string;
    is_active?: boolean;
  }) =>
    api.get<Paginated<Commitment>>("/admin/equity/commitments", {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      beneficiary_id: params.beneficiary_id,
      is_active: params.is_active,
    }),

  createCommitment: (body: CommitmentBody) =>
    api.post<Commitment>("/admin/equity/commitments", body),

  updateCommitment: (id: string, body: Partial<CommitmentBody>) =>
    api.patch<Commitment>(`/admin/equity/commitments/${id}`, body),

  deleteCommitment: (id: string) =>
    api.delete<void>(`/admin/equity/commitments/${id}`),
};

/** Display helper — beneficiary name from either an expanded ref or fallback. */
export function commitmentBeneficiaryName(c: Commitment): string {
  return c.beneficiary?.name ?? "—";
}

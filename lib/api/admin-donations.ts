import { api } from "@/lib/api/client";
import type { Paginated } from "@/types";
import type { ExpenseCurrency } from "@/lib/enums";

/**
 * The donation ledger — where the company's giving went and who vouched for it.
 *
 * Donations are drawn from a profit-share pool (normally charity), and that pool's
 * money already left the books when its distribution was confirmed. So a donation
 * NEVER moves the treasury balance: it draws the pool down. `summary.pools[].balance`
 * is what the finance sheet calls "Donations Total (Bank)".
 */

/** One dated gift. */
export interface Donation {
  id: string;
  to: string;
  beneficiary_id: string | null;
  commitment_id: string | null;
  /** The voucher's name — a linked user's, or free text ("No one"). */
  vouched_by: string | null;
  vouched_by_id: string | null;
  vouched_by_employee_code: string | null;
  amount: number;
  currency: ExpenseCurrency;
  amount_pkr: number;
  date: string;
  month: string;
  note: string | null;
  attachment: string | null;
  recorded_by: string | null;
  /** Set once reversed — kept on the record but out of every total. */
  reversed_at: string | null;
  created_at: string;
}

/** A pool's giving account: what it collected vs what has been given away. */
export interface DonationPool {
  beneficiary_id: string;
  accrued: number;
  donated: number;
  /** accrued − donated. Negative means the company covered the difference itself. */
  balance: number;
  in_deficit: boolean;
}

export interface DonationSummary {
  currency: ExpenseCurrency;
  month: string;
  total_donated: number;
  month_donated: number;
  /** What the standing commitments say should go out this month. */
  expected_this_month: number;
  commitments: { id: string; name: string; amount: number; paid_by: string | null }[];
  pools: DonationPool[];
  unpooled_donated: number;
  pool_balance: number;
  by_recipient: {
    to: string;
    total: number;
    count: number;
    last_date: string | null;
    vouchers: string[];
  }[];
  by_voucher: {
    vouched_by: string;
    total: number;
    count: number;
    recipients: string[];
  }[];
  monthly: { month: string; total: number; count: number }[];
}

export interface CreateDonationBody {
  to: string;
  amount: number;
  currency?: ExpenseCurrency;
  conversion_rate?: number;
  date?: string;
  vouched_by_id?: string | null;
  vouched_by_name?: string | null;
  beneficiary_id?: string | null;
  note?: string | null;
}

export type UpdateDonationBody = Partial<CreateDonationBody>;

export const adminDonationsApi = {
  list: (params: {
    page?: number;
    limit?: number;
    month?: string;
    vouchedById?: string;
    includeReversed?: boolean;
  }) =>
    api.get<Paginated<Donation>>("/admin/donations", {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      month: params.month,
      vouched_by_id: params.vouchedById,
      include_reversed: params.includeReversed,
    }),

  summary: (month?: string) =>
    api.get<DonationSummary>("/admin/donations/summary", { month }),

  create: (body: CreateDonationBody) => api.post<Donation>("/admin/donations", body),

  update: (id: string, body: UpdateDonationBody) =>
    api.patch<Donation>(`/admin/donations/${id}`, body),

  /** Reversal, not deletion — the ledger keeps the record of the mistake. */
  reverse: (id: string) => api.post<Donation>(`/admin/donations/${id}/reverse`, {}),
};

export const adminDonationsKeys = {
  all: ["admin-donations"] as const,
  list: (page: number, month?: string) =>
    ["admin-donations", "list", page, month ?? null] as const,
  summary: (month?: string) => ["admin-donations", "summary", month ?? null] as const,
};

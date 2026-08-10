import { api } from "@/lib/api/client";

/**
 * The twice-yearly increment cycle (March and September).
 *
 * The band is policy; the exact figure inside it is a judgement call. So the API
 * only ever PROPOSES — nothing is written until a director submits explicit
 * per-person percentages, and the server re-checks every one against that person's
 * own band before touching a salary.
 */

export type IncrementCycle = "march" | "september";

/** Why someone is not getting a raise this cycle. */
export type IneligibleReason =
  | "tenure"
  | "already_incremented"
  | "no_salary"
  | "no_join_date";

export const INELIGIBLE_LABELS: Record<IneligibleReason, string> = {
  tenure: "Not enough service yet",
  already_incremented: "Already raised this cycle",
  no_salary: "No salary on record",
  no_join_date: "No joining date on record",
};

export interface IncrementBand {
  min: number;
  max: number;
}

export interface IncrementRow {
  user_id: string;
  full_name: string;
  employee_code: string | null;
  designation: string | null;
  work_schedule: "full_time" | "part_time";
  /** Part-timers accrue service at half rate and get half the band. */
  part_time: boolean;
  joined_at: string | null;
  /** Calendar months completed at the cycle date. */
  tenure_months: number | null;
  /** Tenure after the half-rate credit for a part-timer. */
  credited_months: number | null;
  current_basic_salary: number | null;
  /** THIS person's band — already halved for a part-timer. Validate against it. */
  band: IncrementBand;
  last_revision_at: string | null;
  eligible: boolean;
  reason: IneligibleReason | null;
  detail: { months_short?: number; credited_short?: number } | null;
  /** The midpoint of the band — a starting point, not a verdict. */
  proposed_percent: number | null;
  proposed_basic_salary: number | null;
}

export interface IncrementCyclePreview {
  month: string;
  cycle: IncrementCycle;
  effective_date: string;
  /** The FULL-TIME band, for the header. Each row carries its own. */
  band: IncrementBand;
  counts: { eligible: number; not_eligible: number; total: number };
  /** What approving every proposed midpoint would add to the monthly wage bill. */
  proposed_monthly_cost: number;
  eligible: IncrementRow[];
  not_eligible: IncrementRow[];
}

export interface ApplyCycleResult {
  month: string;
  cycle: IncrementCycle;
  effective_date: string;
  applied_count: number;
  monthly_cost_increase: number;
  items: {
    user_id: string;
    full_name: string;
    employee_code: string | null;
    percent: number;
    previous_basic_salary: number;
    new_basic_salary: number;
  }[];
}

/** The cycle month for a given date — March and September only. */
export function nearestCycleMonth(now = new Date()): string {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth() + 1;
  if (m >= 9) return `${y}-09`;
  if (m >= 3) return `${y}-03`;
  // Before March: the most recent cycle was last September.
  return `${y - 1}-09`;
}

export const adminIncrementsApi = {
  preview: (month: string) =>
    api.get<IncrementCyclePreview>("/increments/cycle", { month }),

  apply: (body: {
    month: string;
    items: { user_id: string; percent: number }[];
    note?: string;
  }) => api.post<ApplyCycleResult>("/increments/cycle", body),
};

export const adminIncrementsKeys = {
  all: ["admin-increments"] as const,
  cycle: (month: string) => ["admin-increments", "cycle", month] as const,
};

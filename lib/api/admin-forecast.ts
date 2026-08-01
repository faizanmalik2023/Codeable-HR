import { api } from "@/lib/api/client";
import type { ExpenseCurrency } from "@/lib/enums";

/**
 * Where the company is HEADED — inflow minus recurring cost and payroll, month by
 * month. The position view answers "what's coming in"; this answers "what's left
 * after the lights are kept on".
 *
 * Two scenarios, always side by side, because one projected number invites exactly
 * the wrong decision:
 *   committed — cash + CONFIRMED receivables only. What you can bank on.
 *   expected  — plus unconfirmed work and the pipeline. What you're aiming at.
 * Costs are identical in both: optimism applies to income, never to cost.
 */

export interface ForecastMonth {
  month: string;
  recurring_expenses: number;
  payroll: number;
  /** recurring_expenses + payroll. */
  outflow: number;
  inflow_committed: number;
  inflow_expected: number;
  net_profit_committed: number;
  net_profit_expected: number;
  closing_cash_committed: number;
  closing_cash_expected: number;
}

export interface Forecast {
  currency: ExpenseCurrency;
  usd_to_pkr: number;
  from: string;
  to: string;
  months: number;
  /** Company cash only — money held for the partners is excluded. */
  opening_cash: number;
  baseline: {
    recurring_expenses: number;
    payroll: number;
    /** What a month costs before a single rupee comes in. */
    monthly_outflow: number;
    headcount: number;
    recurring_count: number;
    /** Months today's cash covers with NOTHING coming in. Null if there's no cost. */
    months_of_cost_covered: number | null;
    /**
     * Recurring costs switched OFF. Correctly excluded from the projection, but
     * reported because one paused by mistake makes the company look cheaper to run
     * than it is — the one direction a forecast must never be wrong in.
     */
    paused: {
      count: number;
      monthly_total: number;
      items: { id: string; name: string; amount: number }[];
    };
  };
  monthly: ForecastMonth[];
  totals: {
    inflow_committed: number;
    inflow_expected: number;
    recurring_expenses: number;
    payroll: number;
    outflow: number;
    net_profit_committed: number;
    net_profit_expected: number;
  };
  /**
   * Index of the first month cash goes negative, or `null` when it doesn't inside
   * the window — which is NOT "infinite runway", so render it as "beyond the
   * window" rather than inventing a number.
   */
  runway: { committed: number | null; expected: number | null };
  closing_cash: { committed: number; expected: number };
  generated_at: string;
}

export type ForecastScenario = "committed" | "expected";

export const SCENARIO_LABELS: Record<ForecastScenario, string> = {
  committed: "Committed",
  expected: "Expected",
};

export const SCENARIO_HELP: Record<ForecastScenario, string> = {
  committed: "Cash on hand plus confirmed work only — what you can bank on.",
  expected: "Adds unconfirmed work and the pipeline — what you're aiming at.",
};

export const adminForecastApi = {
  get: (months?: number) => api.get<Forecast>("/admin/position/forecast", { months }),
};

export const adminForecastKeys = {
  all: ["admin-forecast"] as const,
  forecast: (months: number) => ["admin-forecast", months] as const,
};

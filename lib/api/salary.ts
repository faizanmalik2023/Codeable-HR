import { api } from "@/lib/api/client";
import type {
  SalaryBreakdownModel,
  SalaryRevisionModel,
  SalarySlipModel,
} from "@/types";

/** Response shape for a slip download request. */
export interface SalarySlipDownload {
  url: string;
}

export const salaryApi = {
  /** Current salary breakdown, or `null` when nothing is configured yet.
   *  Wire wraps it as `{ breakdown }`. */
  breakdown: () =>
    api
      .get<{ breakdown: SalaryBreakdownModel | null }>("/salary/breakdown")
      .then((r) => r.breakdown),

  /** Salary revision history (initial / increment / promotion). Wire wraps as `{ items }`. */
  revisions: () =>
    api
      .get<{ items: SalaryRevisionModel[] }>("/salary/revisions")
      .then((r) => r.items),

  /** Generated + pending salary slips. Wire wraps as `{ items }`. */
  slips: () =>
    api.get<{ items: SalarySlipModel[] }>("/salary/slips").then((r) => r.items),

  /** Signed download URL for a single slip. */
  download: (id: string) =>
    api.get<SalarySlipDownload>(`/salary/slips/${id}/download`),
};

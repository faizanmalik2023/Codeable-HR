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
  /** Current salary breakdown, or `null` when nothing is configured yet. */
  breakdown: () => api.get<SalaryBreakdownModel | null>("/salary/breakdown"),

  /** Salary revision history (initial / increment / promotion). */
  revisions: () => api.get<SalaryRevisionModel[]>("/salary/revisions"),

  /** Generated + pending salary slips. */
  slips: () => api.get<SalarySlipModel[]>("/salary/slips"),

  /** Signed download URL for a single slip. */
  download: (id: string) =>
    api.get<SalarySlipDownload>(`/salary/slips/${id}/download`),
};

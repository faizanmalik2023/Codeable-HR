import { api } from "@/lib/api/client";
import type { ExpenseClaimModel, InsuranceClaimModel, Paginated } from "@/types";

/** Query params shared by both claim list endpoints. */
export interface ClaimListParams {
  status?: string;
  page?: number;
  limit?: number;
}

/** POST body for creating an insurance claim. `attachment` is an uploaded file URL. */
export interface InsuranceCreateBody {
  reason: string;
  amount: number;
  note: string;
  expense_date: string;
  attachment?: string;
}

/** POST body for creating an expense claim. `attachment` is an uploaded file URL. */
export interface ExpenseCreateBody {
  category: string;
  amount: number;
  description: string;
  expense_date: string;
  attachment?: string;
}

/** PATCH body for an HR/Admin claim decision. */
export interface ClaimDecisionBody {
  decision: "approve" | "reject";
  rejection_reason?: string;
}

export const claimsApi = {
  /* ------------------------------ Insurance ------------------------------ */
  insuranceList: (params: ClaimListParams) =>
    api.get<Paginated<InsuranceClaimModel>>("/insurance-claims", {
      status: params.status,
      page: params.page ?? 1,
      limit: params.limit ?? 20,
    }),

  insuranceGet: (id: string) =>
    api.get<InsuranceClaimModel>(`/insurance-claims/${id}`),

  insuranceCreate: (body: InsuranceCreateBody) =>
    api.post<InsuranceClaimModel>("/insurance-claims", body),

  /** HR/Admin approval queue (populated `employee`). */
  insuranceRequests: (params: ClaimListParams) =>
    api.get<Paginated<InsuranceClaimModel>>("/insurance-claims/requests", {
      status: params.status,
      page: params.page ?? 1,
      limit: params.limit ?? 20,
    }),

  insuranceDecision: (id: string, body: ClaimDecisionBody) =>
    api.patch<InsuranceClaimModel>(`/insurance-claims/${id}/decision`, body),

  /* ------------------------------- Expense ------------------------------- */
  expenseList: (params: ClaimListParams) =>
    api.get<Paginated<ExpenseClaimModel>>("/expense-claims", {
      status: params.status,
      page: params.page ?? 1,
      limit: params.limit ?? 20,
    }),

  expenseGet: (id: string) =>
    api.get<ExpenseClaimModel>(`/expense-claims/${id}`),

  expenseCreate: (body: ExpenseCreateBody) =>
    api.post<ExpenseClaimModel>("/expense-claims", body),

  /** HR/Admin approval queue (populated `employee`). */
  expenseRequests: (params: ClaimListParams) =>
    api.get<Paginated<ExpenseClaimModel>>("/expense-claims/requests", {
      status: params.status,
      page: params.page ?? 1,
      limit: params.limit ?? 20,
    }),

  expenseDecision: (id: string, body: ClaimDecisionBody) =>
    api.patch<ExpenseClaimModel>(`/expense-claims/${id}/decision`, body),
};

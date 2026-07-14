import { api } from "@/lib/api/client";
import type { LeaveDecisionBody } from "@/lib/api/leaves";
import type { LeaveModel, Paginated } from "@/types";

export type { LeaveDecisionBody };

/** HR-facing leave endpoints — company-wide approval queue. */
export const hrLeavesApi = {
  /** Approval queue — populated `employee`, whole-set `counts`. */
  requests: (params: { status?: string; page?: number; limit?: number }) =>
    api.get<Paginated<LeaveModel>>("/leaves/requests", {
      status: params.status,
      page: params.page ?? 1,
      limit: params.limit ?? 20,
    }),

  /** Everyone on leave today — array or `{ items }` envelope. */
  onLeaveToday: () =>
    api.get<LeaveModel[] | { items: LeaveModel[] }>("/leaves/on-leave-today"),

  /** Approve / reject a pending request. */
  decision: (id: string, body: LeaveDecisionBody) =>
    api.patch<LeaveModel>(`/leaves/${id}/decision`, body),
};

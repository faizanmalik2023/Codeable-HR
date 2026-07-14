import { api } from "@/lib/api/client";
import type { LeaveDecisionBody } from "@/lib/api/leaves";
import type {
  EmployeeRef,
  LeaveModel,
  OnLeaveTodayModel,
  Paginated,
} from "@/types";

export type { LeaveDecisionBody };

/**
 * HR approval-queue item — the applicant (`employee`) sits beside the nested
 * `leave` (the request id is duplicated at the top level for the decision call).
 */
export interface HrLeaveRequestModel {
  id: string;
  employee: EmployeeRef;
  leave: LeaveModel;
}

/** HR-facing leave endpoints — company-wide approval queue. */
export const hrLeavesApi = {
  /** Approval queue — each item is `{ id, employee, leave }`, whole-set `counts`. */
  requests: (params: { status?: string; page?: number; limit?: number }) =>
    api.get<Paginated<HrLeaveRequestModel>>("/leaves/requests", {
      status: params.status,
      page: params.page ?? 1,
      limit: params.limit ?? 20,
    }),

  /** Everyone on leave today — array or `{ items }` envelope. */
  onLeaveToday: () =>
    api.get<OnLeaveTodayModel[] | { items: OnLeaveTodayModel[] }>(
      "/leaves/on-leave-today"
    ),

  /** Approve / reject a pending request. */
  decision: (id: string, body: LeaveDecisionBody) =>
    api.patch<LeaveModel>(`/leaves/${id}/decision`, body),
};

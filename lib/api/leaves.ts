import { api } from "@/lib/api/client";
import type {
  EmployeeRef,
  LeaveBalanceModel,
  LeaveModel,
  LeaveTypeModel,
  Paginated,
  TeamMemberModel,
} from "@/types";
import type { HalfDayPeriod, LeaveDuration } from "@/lib/enums";

/** Body for `POST /leaves/apply`. */
export interface LeaveApplyBody {
  leave_type_id: string;
  date_from: string;
  date_to: string;
  reason: string;
  duration: LeaveDuration;
  half_day?: HalfDayPeriod | null;
}

/** Body for `PATCH /leaves/{id}/decision`. */
export interface LeaveDecisionBody {
  decision: "approve" | "reject";
  rejection_reason?: string;
}

export const leavesApi = {
  // `GET /leaves/quota` returns `{ leaves: [...] }` — unwrap to the array.
  quota: () =>
    api.get<{ leaves: LeaveBalanceModel[] }>("/leaves/quota").then((r) => r.leaves),

  // `GET /leaves/types` returns `{ leave_types: [...] }` — unwrap to the array.
  types: () =>
    api
      .get<{ leave_types: LeaveTypeModel[] }>("/leaves/types")
      .then((r) => r.leave_types),

  apply: (body: LeaveApplyBody) => api.post<LeaveModel>("/leaves/apply", body),

  history: (params: { status?: string; page?: number; limit?: number }) =>
    api.get<Paginated<LeaveModel>>("/leaves/history", {
      status: params.status,
      page: params.page ?? 1,
      limit: params.limit ?? 10,
    }),

  team: () => api.get<{ items: TeamMemberModel[] }>("/leaves/team"),

  // Returns the member at top-level `employee` alongside the paginated `items`.
  teamMember: (employeeId: string) =>
    api.get<Paginated<LeaveModel> & { employee?: EmployeeRef }>(
      `/leaves/team/${employeeId}`
    ),

  decision: (id: string, body: LeaveDecisionBody) =>
    api.patch<LeaveModel>(`/leaves/${id}/decision`, body),
};

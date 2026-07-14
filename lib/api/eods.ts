import { api } from "@/lib/api/client";
import type { EodReportModel, Paginated, TeamMemberModel } from "@/types";

export interface EodSubmitBody {
  date: string;
  hours: number;
  summary: string;
  project_id?: string;
  blockers?: string;
  tomorrow_plan?: string;
}

export const eodsApi = {
  list: (params: { status?: string; page?: number; limit?: number }) =>
    api.get<Paginated<EodReportModel>>("/eods", {
      status: params.status,
      page: params.page ?? 1,
      limit: params.limit ?? 10,
    }),

  get: (id: string) => api.get<EodReportModel>(`/eods/${id}`),

  saveDraft: (body: EodSubmitBody) => api.post<EodReportModel>("/eods", body),

  submit: (body: EodSubmitBody) => api.post<EodReportModel>("/eods/submit", body),

  remove: (id: string) => api.delete<void>(`/eods/${id}`),

  team: () => api.get<{ items: TeamMemberModel[] }>("/eods/team"),

  isManager: () => api.get<{ is_manager: boolean }>("/eods/team/is-manager"),

  teamMember: (employeeId: string) =>
    api.get<Paginated<EodReportModel>>(`/eods/team/${employeeId}`),

  markRead: (id: string) => api.patch<void>(`/eods/${id}/read`),
};

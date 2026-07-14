import { api } from "@/lib/api/client";
import type { IssueMessage, IssueModel, Paginated } from "@/types";

/** Body for raising a new HR Help ticket. `priority` is only sent for sensitive categories. */
export interface TicketCreateBody {
  title: string;
  description: string;
  category: string;
  is_anonymous: boolean;
  priority?: "high";
}

export const ticketsApi = {
  list: (params: { status?: string; page?: number; limit?: number }) =>
    api.get<Paginated<IssueModel>>("/tickets", {
      status: params.status,
      page: params.page ?? 1,
      limit: params.limit ?? 10,
    }),

  get: (id: string) => api.get<IssueModel>(`/tickets/${id}`),

  create: (body: TicketCreateBody) => api.post<IssueModel>("/tickets", body),

  reply: (id: string, message: string) =>
    api.post<IssueMessage>(`/tickets/${id}/replies`, { message }),
};

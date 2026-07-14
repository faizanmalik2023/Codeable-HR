import { api } from "@/lib/api/client";
import type { IssueMessage, IssueModel, Paginated } from "@/types";

/**
 * HR-side of HR Help — the triage queue over ALL employee tickets.
 * Distinct from `ticketsApi` (the employee's own tickets under `/tickets`).
 */
export const hrHelpApi = {
  /** Triage queue: every employee ticket, filterable by status. */
  requests: (params: { status?: string; page?: number; limit?: number }) =>
    api.get<Paginated<IssueModel>>("/tickets/requests", {
      status: params.status,
      page: params.page ?? 1,
      limit: params.limit ?? 10,
    }),

  /** Full ticket incl. `messages[]`. */
  get: (id: string) => api.get<IssueModel>(`/tickets/${id}`),

  /** Post an HR reply into the thread. */
  reply: (id: string, message: string) =>
    api.post<IssueMessage>(`/tickets/${id}/replies`, { message }),

  /** Change lifecycle status (e.g. `"resolved"`). */
  setStatus: (id: string, status: string) =>
    api.patch<IssueModel>(`/tickets/${id}/status`, { status }),
};

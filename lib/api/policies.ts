import { api } from "@/lib/api/client";
import type { PolicyModel } from "@/types";

export interface PolicyBody {
  title: string;
  document_url: string;
  description?: string;
  effective_date?: string;
  notify?: boolean;
}

/** Company policies — read-only for employees; HR/Admin can manage. */
export const policiesApi = {
  /** GET `/policies` — backend may return a bare array or `{ items }`. */
  list: () => api.get<PolicyModel[] | { items: PolicyModel[] }>("/policies"),

  get: (id: string) => api.get<PolicyModel>(`/policies/${id}`),

  create: (body: PolicyBody) => api.post<PolicyModel>("/policies", body),

  update: (id: string, body: Partial<PolicyBody>) =>
    api.patch<PolicyModel>(`/policies/${id}`, body),

  remove: (id: string) => api.delete<void>(`/policies/${id}`),
};

import { api } from "@/lib/api/client";
import type { DashboardModel } from "@/types";

export const dashboardApi = {
  get: (signal?: AbortSignal) => api.get<DashboardModel>("/dashboard", undefined, signal),
};

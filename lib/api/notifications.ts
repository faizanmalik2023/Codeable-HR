import { api } from "@/lib/api/client";
import type { ActivityItemModel, NotificationModel, Paginated } from "@/types";

/** Notifications inbox + activity feed. */
export const notificationsApi = {
  list: (params: { filter?: string; page?: number; limit?: number }) =>
    api.get<Paginated<NotificationModel>>("/notifications", {
      filter: params.filter,
      page: params.page ?? 1,
      limit: params.limit ?? 30,
    }),

  unreadCount: () => api.get<{ count: number }>("/notifications/unread-count"),

  markRead: (id: string) => api.patch<void>(`/notifications/${id}/read`),

  markAllRead: () => api.patch<void>("/notifications/read-all"),

  /** GET `/activity` — backend may return a paginated shape or `{ items }`. */
  activity: (params: { filter?: string; page?: number; limit?: number }) =>
    api.get<Paginated<ActivityItemModel> | { items: ActivityItemModel[] }>("/activity", {
      filter: params.filter,
      page: params.page ?? 1,
      limit: params.limit ?? 50,
    }),
};

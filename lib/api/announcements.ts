import { api } from "@/lib/api/client";

/** Who an announcement is delivered to. */
export type AnnouncementTarget = "all" | "department" | "role";

export interface AnnouncementBody {
  title: string;
  body: string;
  target: AnnouncementTarget;
  department_id?: string;
  role?: string;
}

export const announcementsApi = {
  /** `POST /notifications/announcements` → `{ recipient_count }` (recipients notified). */
  send: (body: AnnouncementBody) =>
    api.post<{ recipient_count?: number }>("/notifications/announcements", body),
};

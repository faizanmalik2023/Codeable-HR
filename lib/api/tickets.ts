import { api, API_BASE_URL } from "@/lib/api/client";
import { authTokens } from "@/stores/auth-store";
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

  /** Tell the other party we're typing. Fire-and-forget — a failed ping is harmless. */
  typing: (id: string) => api.post<{ ok: boolean }>(`/tickets/${id}/typing`, {}),
};

/* --------------------------- live thread (SSE) --------------------------- */

/** An event pushed down `GET /tickets/:id/stream`. */
export type TicketStreamEvent =
  | { type: "reply"; message: IssueMessage }
  | { type: "typing"; sender: "user" | "hr" }
  | { type: "status"; status: string };

/**
 * Subscribe to a ticket's live thread.
 *
 * Uses `fetch` + a stream reader rather than `EventSource`, because EventSource
 * cannot send an `Authorization` header and the API is bearer-authenticated —
 * the alternative would be putting the token in the query string, where it ends
 * up in access logs.
 *
 * Returns an unsubscribe function. Reconnects on drop with a backoff, since a
 * proxy timeout or a sleeping laptop will kill the connection routinely.
 */
export function streamTicket(
  id: string,
  onEvent: (event: TicketStreamEvent) => void,
  onOpenChange?: (open: boolean) => void
): () => void {
  const controller = new AbortController();
  let stopped = false;
  let attempt = 0;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;

  const connect = async () => {
    if (stopped) return;
    try {
      const token = authTokens()?.token;
      const res = await fetch(`${API_BASE_URL}/tickets/${id}/stream`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: controller.signal,
      });
      if (!res.ok || !res.body) throw new Error(`stream ${res.status}`);

      onOpenChange?.(true);
      attempt = 0; // a good connection resets the backoff

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      // SSE frames are separated by a blank line and may be split across chunks,
      // so hold a buffer and only consume whole frames.
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";
        for (const frame of frames) {
          const line = frame.split("\n").find((l) => l.startsWith("data:"));
          if (!line) continue; // `: ping` heartbeats carry no data
          try {
            onEvent(JSON.parse(line.slice(5).trim()) as TicketStreamEvent);
          } catch {
            // A malformed frame is not worth tearing the connection down for.
          }
        }
      }
    } catch {
      // fall through to the reconnect below
    }

    if (stopped) return;
    onOpenChange?.(false);
    // Back off to a 30s ceiling so a backend that's down isn't hammered.
    attempt += 1;
    retryTimer = setTimeout(connect, Math.min(1000 * 2 ** attempt, 30000));
  };

  void connect();

  return () => {
    stopped = true;
    if (retryTimer) clearTimeout(retryTimer);
    controller.abort();
  };
}

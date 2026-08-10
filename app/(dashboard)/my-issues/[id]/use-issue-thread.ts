"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { streamTicket, ticketsApi } from "@/lib/api/tickets";
import { qk } from "@/lib/query/keys";
import type { IssueMessage, IssueModel } from "@/types";

let tempSeq = 0;
const nextTempId = () => `temp-${Date.now()}-${tempSeq++}`;

/** How long a "typing" ping keeps the indicator up before it lapses. */
const TYPING_LINGER_MS = 4000;
/**
 * Minimum gap between outgoing typing pings. The API allows 300 requests / 15 min
 * per IP and a whole office can share one NAT address, so a ping per keystroke
 * would eat the budget. One per 5s is plenty to hold the indicator up.
 */
const TYPING_PING_MS = 5000;

/** Detail + optimistic reply hook for a single HR Help ticket. */
export function useIssueThread(id: string) {
  const qc = useQueryClient();
  const key = qk.tickets.detail(id);
  const [live, setLive] = React.useState(false);
  const [peerTyping, setPeerTyping] = React.useState(false);

  const query = useQuery({
    queryKey: key,
    queryFn: () => ticketsApi.get(id),
    enabled: !!id,
  });

  const patchMessages = React.useCallback(
    (fn: (messages: IssueMessage[]) => IssueMessage[]) => {
      qc.setQueryData<IssueModel>(key, (prev) =>
        prev ? { ...prev, messages: fn(prev.messages ?? []) } : prev
      );
    },
    [qc, key]
  );

  /* ------------------------------ live thread ------------------------------ */
  React.useEffect(() => {
    if (!id) return;
    let typingTimer: ReturnType<typeof setTimeout> | null = null;

    const stop = streamTicket(
      id,
      (event) => {
        if (event.type === "reply") {
          patchMessages((messages) => {
            // The sender's own reply already arrived through the mutation's
            // optimistic path, and other tabs may deliver it twice — dedupe on id
            // so a message is never rendered twice.
            if (messages.some((m) => m.id && m.id === event.message.id)) return messages;
            return [...messages, event.message];
          });
          // A reply means they stopped typing.
          setPeerTyping(false);
          if (typingTimer) clearTimeout(typingTimer);
          return;
        }
        if (event.type === "typing") {
          setPeerTyping(true);
          // Pings are fire-and-forget with no matching "stopped" event, so the
          // indicator lapses on its own rather than sticking forever.
          if (typingTimer) clearTimeout(typingTimer);
          typingTimer = setTimeout(() => setPeerTyping(false), TYPING_LINGER_MS);
          return;
        }
        if (event.type === "status") {
          qc.setQueryData<IssueModel>(key, (prev) =>
            prev ? { ...prev, status: event.status as IssueModel["status"] } : prev
          );
        }
      },
      setLive
    );

    return () => {
      stop();
      if (typingTimer) clearTimeout(typingTimer);
      setPeerTyping(false);
    };
  }, [id, patchMessages, qc, key]);

  /* -------------------------------- sending -------------------------------- */
  const reply = useMutation({
    mutationFn: (vars: { message: string; tempId: string }) =>
      ticketsApi.reply(id, vars.message),
    onMutate: ({ message, tempId }) => {
      patchMessages((messages) => [
        ...messages,
        {
          id: tempId,
          sender: "user",
          content: message,
          timestamp: new Date().toISOString(),
          delivery: "sending",
        },
      ]);
    },
    onSuccess: (serverMessage, { tempId }) => {
      patchMessages((messages) => {
        // The stream may have delivered the real message before this resolved —
        // drop the placeholder instead of leaving a duplicate behind.
        if (messages.some((m) => m.id === serverMessage.id)) {
          return messages.filter((m) => m.id !== tempId);
        }
        return messages.map((m) =>
          m.id === tempId ? { ...serverMessage, delivery: "sent" } : m
        );
      });
      qc.invalidateQueries({ queryKey: ["tickets"], exact: false, refetchType: "none" });
    },
    onError: (_e, { tempId }) => {
      patchMessages((messages) =>
        messages.map((m) => (m.id === tempId ? { ...m, delivery: "failed" } : m))
      );
    },
  });

  const send = React.useCallback(
    (message: string) => {
      const trimmed = message.trim();
      if (!trimmed) return;
      reply.mutate({ message: trimmed, tempId: nextTempId() });
    },
    [reply]
  );

  const retry = React.useCallback(
    (failed: IssueMessage) => {
      patchMessages((messages) => messages.filter((m) => m.id !== failed.id));
      send(failed.content);
    },
    [patchMessages, send]
  );

  /** Called on keystrokes; throttled so it can't flood the rate limiter. */
  const lastPing = React.useRef(0);
  const notifyTyping = React.useCallback(() => {
    const now = Date.now();
    if (now - lastPing.current < TYPING_PING_MS) return;
    lastPing.current = now;
    // Deliberately unawaited and error-swallowing: a dropped ping costs nothing.
    void ticketsApi.typing(id).catch(() => {});
  }, [id]);

  return { query, issue: query.data, send, retry, notifyTyping, peerTyping, live };
}

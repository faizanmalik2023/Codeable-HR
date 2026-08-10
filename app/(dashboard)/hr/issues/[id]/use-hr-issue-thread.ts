"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { hrHelpApi } from "@/lib/api/hr-help";
import { streamTicket } from "@/lib/api/tickets";
import { ApiRequestError } from "@/lib/api/client";
import type { IssueMessage, IssueModel } from "@/types";

let tempSeq = 0;
const nextTempId = () => `temp-${Date.now()}-${tempSeq++}`;

/** How long a "typing" ping keeps the indicator up before it lapses. */
const TYPING_LINGER_MS = 4000;
/** Minimum gap between outgoing typing pings — see the note in use-issue-thread. */
const TYPING_PING_MS = 5000;

/** Detail + optimistic reply + resolve hook for a single HR-side ticket. */
export function useHrIssueThread(id: string) {
  const qc = useQueryClient();
  // Memoised: the key is a dependency of patchMessages, and a fresh array literal
  // every render would re-create the callback and re-run the stream effect below.
  const key = React.useMemo(() => ["hr-tickets", "detail", id], [id]);
  const [peerTyping, setPeerTyping] = React.useState(false);

  const query = useQuery({
    queryKey: key,
    queryFn: () => hrHelpApi.get(id),
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

    const stop = streamTicket(id, (event) => {
      if (event.type === "reply") {
        patchMessages((messages) =>
          messages.some((m) => m.id && m.id === event.message.id)
            ? messages
            : [...messages, event.message]
        );
        setPeerTyping(false);
        if (typingTimer) clearTimeout(typingTimer);
        return;
      }
      if (event.type === "typing") {
        setPeerTyping(true);
        if (typingTimer) clearTimeout(typingTimer);
        typingTimer = setTimeout(() => setPeerTyping(false), TYPING_LINGER_MS);
        return;
      }
      if (event.type === "status") {
        qc.setQueryData<IssueModel>(key, (prev) =>
          prev ? { ...prev, status: event.status as IssueModel["status"] } : prev
        );
      }
    });

    return () => {
      stop();
      if (typingTimer) clearTimeout(typingTimer);
      setPeerTyping(false);
    };
  }, [id, patchMessages, qc, key]);

  const reply = useMutation({
    mutationFn: (vars: { message: string; tempId: string }) =>
      hrHelpApi.reply(id, vars.message),
    onMutate: ({ message, tempId }) => {
      patchMessages((messages) => [
        ...messages,
        {
          id: tempId,
          sender: "hr",
          content: message,
          timestamp: new Date().toISOString(),
          delivery: "sending",
        },
      ]);
    },
    onSuccess: (serverMessage, { tempId }) => {
      patchMessages((messages) => {
        // The stream may have delivered the real message first — drop the
        // placeholder rather than leaving a duplicate behind.
        if (messages.some((m) => m.id === serverMessage.id)) {
          return messages.filter((m) => m.id !== tempId);
        }
        return messages.map((m) =>
          m.id === tempId ? { ...serverMessage, delivery: "sent" } : m
        );
      });
      qc.invalidateQueries({ queryKey: ["hr-tickets"], exact: false, refetchType: "none" });
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

  const resolve = useMutation({
    mutationFn: () => hrHelpApi.setStatus(id, "resolved"),
    onSuccess: (updated) => {
      qc.setQueryData<IssueModel>(key, (prev) =>
        prev ? { ...prev, ...updated, status: "resolved" } : prev
      );
      qc.invalidateQueries({ queryKey: ["hr-tickets"], exact: false });
      toast.success("Issue marked as resolved");
    },
    onError: (e) =>
      toast.error(e instanceof ApiRequestError ? e.message : "Couldn't resolve this issue"),
  });

  /** Called on keystrokes; throttled so it can't flood the rate limiter. */
  const lastPing = React.useRef(0);
  const notifyTyping = React.useCallback(() => {
    const now = Date.now();
    if (now - lastPing.current < TYPING_PING_MS) return;
    lastPing.current = now;
    void hrHelpApi.typing(id).catch(() => {});
  }, [id]);

  return { query, issue: query.data, send, retry, resolve, notifyTyping, peerTyping };
}

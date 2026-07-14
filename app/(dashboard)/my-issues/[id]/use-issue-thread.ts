"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ticketsApi } from "@/lib/api/tickets";
import { qk } from "@/lib/query/keys";
import type { IssueMessage, IssueModel } from "@/types";

let tempSeq = 0;
const nextTempId = () => `temp-${Date.now()}-${tempSeq++}`;

/** Detail + optimistic reply hook for a single HR Help ticket. */
export function useIssueThread(id: string) {
  const qc = useQueryClient();
  const key = qk.tickets.detail(id);

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
          created_at: new Date().toISOString(),
          delivery: "sending",
        },
      ]);
    },
    onSuccess: (serverMessage, { tempId }) => {
      patchMessages((messages) =>
        messages.map((m) =>
          m.id === tempId ? { ...serverMessage, delivery: "sent" } : m
        )
      );
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

  return { query, issue: query.data, send, retry };
}

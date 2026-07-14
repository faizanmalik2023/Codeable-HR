"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { hrHelpApi } from "@/lib/api/hr-help";
import { ApiRequestError } from "@/lib/api/client";
import type { IssueMessage, IssueModel } from "@/types";

let tempSeq = 0;
const nextTempId = () => `temp-${Date.now()}-${tempSeq++}`;

/** Detail + optimistic reply + resolve hook for a single HR-side ticket. */
export function useHrIssueThread(id: string) {
  const qc = useQueryClient();
  const key = ["hr-tickets", "detail", id];

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
      patchMessages((messages) =>
        messages.map((m) =>
          m.id === tempId ? { ...serverMessage, delivery: "sent" } : m
        )
      );
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

  return { query, issue: query.data, send, retry, resolve };
}

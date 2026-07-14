"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { hrLeavesApi, type LeaveDecisionBody } from "@/lib/api/hr-leaves";
import { qk } from "@/lib/query/keys";
import { statusParam } from "@/lib/enums";
import { ApiRequestError } from "@/lib/api/client";
import type { LeaveModel } from "@/types";

/**
 * HR leave-requests approval queue — filter tab + pagination, the
 * "on leave today" strip, and the approve/reject decision mutation.
 */
export function useLeaveRequests() {
  const qc = useQueryClient();
  const [status, setStatus] = React.useState("all");
  const [page, setPage] = React.useState(1);

  const query = useQuery({
    queryKey: qk.leaves.requests(status, page),
    queryFn: () => hrLeavesApi.requests({ status: statusParam(status), page, limit: 20 }),
    placeholderData: (prev) => prev,
  });

  const onLeaveTodayQuery = useQuery({
    queryKey: qk.leaves.onLeaveToday,
    queryFn: () => hrLeavesApi.onLeaveToday(),
  });

  const decide = useMutation({
    mutationFn: ({ id, body }: { id: string; body: LeaveDecisionBody }) =>
      hrLeavesApi.decision(id, body),
    onSuccess: (_data, variables) => {
      toast.success(
        variables.body.decision === "approve" ? "Leave approved" : "Leave rejected"
      );
      qc.invalidateQueries({ queryKey: ["leaves"] });
    },
    onError: (e) =>
      toast.error(e instanceof ApiRequestError ? e.message : "Couldn't update the request"),
  });

  const raw = onLeaveTodayQuery.data;
  const onLeaveToday: LeaveModel[] = Array.isArray(raw) ? raw : raw?.items ?? [];

  return {
    status,
    setStatus: (s: string) => {
      setStatus(s);
      setPage(1);
    },
    page,
    setPage,
    items: query.data?.items ?? [],
    counts: query.data?.counts ?? {},
    pagination: query.data?.pagination,
    query,
    onLeaveToday,
    onLeaveTodayQuery,
    decide,
  };
}

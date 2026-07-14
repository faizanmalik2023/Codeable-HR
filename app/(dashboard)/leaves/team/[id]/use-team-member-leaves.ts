"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { leavesApi, type LeaveDecisionBody } from "@/lib/api/leaves";
import { qk } from "@/lib/query/keys";
import { ApiRequestError } from "@/lib/api/client";

/** Member leave list + approve/reject decision. */
export function useTeamMemberLeaves(employeeId: string) {
  const qc = useQueryClient();
  const key = qk.leaves.teamMember(employeeId);

  const query = useQuery({
    queryKey: key,
    queryFn: () => leavesApi.teamMember(employeeId),
    enabled: !!employeeId,
  });

  const decide = useMutation({
    mutationFn: ({ id, body }: { id: string; body: LeaveDecisionBody }) =>
      leavesApi.decision(id, body),
    onSuccess: (_data, variables) => {
      toast.success(
        variables.body.decision === "approve" ? "Leave approved" : "Leave rejected"
      );
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: qk.leaves.team });
    },
    onError: (e) =>
      toast.error(e instanceof ApiRequestError ? e.message : "Couldn't update the request"),
  });

  return { query, decide };
}

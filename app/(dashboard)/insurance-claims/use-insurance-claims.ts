"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { claimsApi, type ClaimDecisionBody } from "@/lib/api/claims";
import { qk } from "@/lib/query/keys";
import { statusParam } from "@/lib/enums";
import { ApiRequestError } from "@/lib/api/client";
import { hasRole, useAuthStore } from "@/stores/auth-store";

/**
 * Role-aware Insurance Claims list. Employees see their own claims; HR/Admin see
 * the approval queue (`/insurance-claims/requests`) with an approve/reject action.
 */
export function useInsuranceClaims() {
  const qc = useQueryClient();
  const role = useAuthStore((s) => s.user?.role ?? "employee");
  const isReviewer = hasRole(role, "hr");
  const [status, setStatus] = React.useState("all");
  const [page, setPage] = React.useState(1);

  const query = useQuery({
    queryKey: [...qk.insuranceClaims(status, page), isReviewer ? "queue" : "own"],
    queryFn: () => {
      const params = { status: statusParam(status), page, limit: 20 };
      return isReviewer ? claimsApi.insuranceRequests(params) : claimsApi.insuranceList(params);
    },
    placeholderData: (prev) => prev,
  });

  const decide = useMutation({
    mutationFn: ({ id, body }: { id: string; body: ClaimDecisionBody }) =>
      claimsApi.insuranceDecision(id, body),
    onSuccess: (_d, v) => {
      toast.success(v.body.decision === "approve" ? "Claim approved" : "Claim rejected");
      qc.invalidateQueries({ queryKey: ["insurance-claims"] });
    },
    onError: (e) => toast.error(e instanceof ApiRequestError ? e.message : "Couldn't submit decision"),
  });

  return {
    isReviewer,
    status,
    setStatus: (s: string) => {
      setStatus(s);
      setPage(1);
    },
    page,
    setPage,
    pagination: query.data?.pagination,
    counts: query.data?.counts ?? {},
    items: query.data?.items ?? [],
    query,
    decide,
  };
}

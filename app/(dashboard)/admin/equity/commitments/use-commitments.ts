"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  adminEquityApi,
  equityKeys,
  type CommitmentBody,
} from "@/lib/api/admin-equity";
import { ApiRequestError } from "@/lib/api/client";

const errMsg = (e: unknown, fallback: string) =>
  e instanceof ApiRequestError ? e.message : fallback;

/** List + CRUD hook for the equity Commitments page. */
export function useCommitments() {
  const qc = useQueryClient();
  const [page, setPage] = React.useState(1);

  const query = useQuery({
    queryKey: equityKeys.commitments("all", "all", page),
    queryFn: () => adminEquityApi.commitments({ page, limit: 20 }),
    placeholderData: (prev) => prev,
  });

  // Beneficiary options for the picker.
  const beneficiaries = useQuery({
    queryKey: equityKeys.beneficiaryList,
    queryFn: () => adminEquityApi.beneficiaries({ limit: 100 }),
    staleTime: 60 * 1000,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: equityKeys.all });
  };

  const create = useMutation({
    mutationFn: (body: CommitmentBody) => adminEquityApi.createCommitment(body),
    onSuccess: () => {
      toast.success("Commitment added");
      invalidate();
    },
    onError: (e) => toast.error(errMsg(e, "Couldn't add commitment")),
  });

  const update = useMutation({
    mutationFn: (vars: { id: string; body: Partial<CommitmentBody> }) =>
      adminEquityApi.updateCommitment(vars.id, vars.body),
    onSuccess: () => {
      toast.success("Commitment updated");
      invalidate();
    },
    onError: (e) => toast.error(errMsg(e, "Couldn't update commitment")),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminEquityApi.deleteCommitment(id),
    onSuccess: () => {
      toast.success("Commitment removed");
      invalidate();
    },
    onError: (e) => toast.error(errMsg(e, "Couldn't remove commitment")),
  });

  const beneficiaryOptions = React.useMemo(
    () =>
      (beneficiaries.data?.items ?? []).map((b) => ({
        value: b.id,
        label: b.name,
        description: b.kind,
      })),
    [beneficiaries.data]
  );

  return {
    query,
    items: query.data?.items ?? [],
    pagination: query.data?.pagination,
    page,
    setPage,
    beneficiaryOptions,
    create,
    update,
    remove,
  };
}

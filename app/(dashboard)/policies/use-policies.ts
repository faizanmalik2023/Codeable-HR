"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { policiesApi, type PolicyBody } from "@/lib/api/policies";
import { qk } from "@/lib/query/keys";
import { ApiRequestError } from "@/lib/api/client";
import { hasRole, useAuthStore } from "@/stores/auth-store";
import type { PolicyModel } from "@/types";

/** List hook for the Policies page — normalizes array / `{ items }` responses.
 *  HR/Admin additionally get create/update/delete mutations. */
export function usePolicies() {
  const qc = useQueryClient();
  const role = useAuthStore((s) => s.user?.role ?? "employee");
  const canManage = hasRole(role, "hr");

  const query = useQuery({
    queryKey: qk.policies,
    queryFn: async (): Promise<PolicyModel[]> => {
      const res = await policiesApi.list();
      return Array.isArray(res) ? res : res?.items ?? [];
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: qk.policies });
  const onErr = (e: unknown) =>
    toast.error(e instanceof ApiRequestError ? e.message : "Something went wrong");

  const create = useMutation({
    mutationFn: (body: PolicyBody) => policiesApi.create(body),
    onSuccess: () => {
      toast.success("Policy published");
      invalidate();
    },
    onError: onErr,
  });

  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<PolicyBody> }) =>
      policiesApi.update(id, body),
    onSuccess: () => {
      toast.success("Policy updated");
      invalidate();
    },
    onError: onErr,
  });

  const remove = useMutation({
    mutationFn: (id: string) => policiesApi.remove(id),
    onSuccess: () => {
      toast.success("Policy deleted");
      invalidate();
    },
    onError: onErr,
  });

  return { query, policies: query.data ?? [], canManage, create, update, remove };
}

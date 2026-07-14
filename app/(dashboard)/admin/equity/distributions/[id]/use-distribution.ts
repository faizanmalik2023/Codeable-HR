"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminEquityApi, equityKeys } from "@/lib/api/admin-equity";
import { ApiRequestError } from "@/lib/api/client";

const errMsg = (e: unknown, fallback: string) =>
  e instanceof ApiRequestError ? e.message : fallback;

/** Detail hook for a single distribution — settle / void / delete lifecycle. */
export function useDistribution(id: string) {
  const router = useRouter();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: equityKeys.distribution(id),
    queryFn: () => adminEquityApi.getDistribution(id),
    enabled: !!id,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: equityKeys.all });
  };

  const settle = useMutation({
    mutationFn: () => adminEquityApi.settleDistribution(id),
    onSuccess: () => {
      toast.success("Distribution settled");
      invalidate();
    },
    onError: (e) => toast.error(errMsg(e, "Couldn't settle distribution")),
  });

  const voidRun = useMutation({
    mutationFn: () => adminEquityApi.voidDistribution(id),
    onSuccess: () => {
      toast.success("Distribution voided");
      invalidate();
    },
    onError: (e) => toast.error(errMsg(e, "Couldn't void distribution")),
  });

  const remove = useMutation({
    mutationFn: () => adminEquityApi.deleteDistribution(id),
    onSuccess: () => {
      toast.success("Distribution deleted");
      invalidate();
      router.push("/admin/equity/distributions");
    },
    onError: (e) => toast.error(errMsg(e, "Couldn't delete distribution")),
  });

  return { query, settle, voidRun, remove };
}

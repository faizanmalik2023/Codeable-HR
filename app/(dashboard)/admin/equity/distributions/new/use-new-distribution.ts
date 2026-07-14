"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  adminEquityApi,
  equityKeys,
  type DistributionBody,
} from "@/lib/api/admin-equity";
import { ApiRequestError } from "@/lib/api/client";

const errMsg = (e: unknown, fallback: string) =>
  e instanceof ApiRequestError ? e.message : fallback;

/**
 * New distribution hook — exposes the two mutations behind the mandatory
 * preview → confirm gate. `preview` never persists; `create` always sends
 * `status: "confirmed"` and only runs after a successful preview (gate is
 * enforced in the page component).
 */
export function useNewDistribution() {
  const router = useRouter();
  const qc = useQueryClient();

  const preview = useMutation({
    mutationFn: (body: DistributionBody) => adminEquityApi.preview(body),
    onError: (e) => toast.error(errMsg(e, "Couldn't generate preview")),
  });

  const create = useMutation({
    mutationFn: (body: DistributionBody) =>
      adminEquityApi.createDistribution({ ...body, status: "confirmed" }),
    onSuccess: () => {
      toast.success("Distribution confirmed");
      qc.invalidateQueries({ queryKey: equityKeys.all });
      router.push("/admin/equity/distributions");
    },
    onError: (e) => toast.error(errMsg(e, "Couldn't confirm distribution")),
  });

  return { preview, create };
}

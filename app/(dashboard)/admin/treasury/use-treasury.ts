"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiRequestError } from "@/lib/api/client";
import {
  adminTreasuryApi,
  adminTreasuryKeys,
  type SetOpeningBody,
} from "@/lib/api/admin-treasury";

const errMsg = (e: unknown, fallback: string) =>
  e instanceof ApiRequestError ? e.message : fallback;

/**
 * Treasury overview hook — the live snapshot, the cash-flow analytics series,
 * and the set-opening-balance mutation.
 */
export function useTreasury() {
  const qc = useQueryClient();

  const overview = useQuery({
    queryKey: adminTreasuryKeys.overview(),
    queryFn: () => adminTreasuryApi.overview(),
  });

  const analytics = useQuery({
    queryKey: adminTreasuryKeys.analytics(),
    queryFn: () => adminTreasuryApi.analytics({}),
  });

  const opening = useQuery({
    queryKey: adminTreasuryKeys.opening(),
    queryFn: () => adminTreasuryApi.opening(),
  });

  const setOpening = useMutation({
    mutationFn: (body: SetOpeningBody) => adminTreasuryApi.setOpening(body),
    onSuccess: () => {
      toast.success("Opening balance updated");
      qc.invalidateQueries({ queryKey: adminTreasuryKeys.overview() });
      qc.invalidateQueries({ queryKey: adminTreasuryKeys.opening() });
      qc.invalidateQueries({ queryKey: adminTreasuryKeys.analytics() });
    },
    onError: (e) => toast.error(errMsg(e, "Couldn't update opening balance")),
  });

  return {
    overview,
    analytics,
    opening,
    setOpening,
    points: analytics.data ?? [],
  };
}

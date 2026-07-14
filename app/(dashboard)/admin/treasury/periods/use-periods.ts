"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiRequestError } from "@/lib/api/client";
import {
  adminTreasuryApi,
  adminTreasuryKeys,
  type ClosePeriodBody,
} from "@/lib/api/admin-treasury";

const errMsg = (e: unknown, fallback: string) =>
  e instanceof ApiRequestError ? e.message : fallback;

/**
 * Closed accounting periods hook — paginated list plus close / reopen
 * mutations.
 */
export function usePeriods() {
  const qc = useQueryClient();
  const [page, setPage] = React.useState(1);

  const query = useQuery({
    queryKey: adminTreasuryKeys.periods(page),
    queryFn: () => adminTreasuryApi.periods({ page, limit: 20 }),
    placeholderData: (prev) => prev,
  });

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["admin-treasury", "periods"] });

  const close = useMutation({
    mutationFn: (body: ClosePeriodBody) => adminTreasuryApi.closePeriod(body),
    onSuccess: () => {
      toast.success("Month closed");
      invalidate();
    },
    onError: (e) => toast.error(errMsg(e, "Couldn't close month")),
  });

  const reopen = useMutation({
    mutationFn: (month: string) => adminTreasuryApi.reopenPeriod(month),
    onSuccess: () => {
      toast.success("Month reopened");
      invalidate();
    },
    onError: (e) => toast.error(errMsg(e, "Couldn't reopen month")),
  });

  return {
    page,
    setPage,
    query,
    items: query.data?.items ?? [],
    pagination: query.data?.pagination,
    close,
    reopen,
  };
}

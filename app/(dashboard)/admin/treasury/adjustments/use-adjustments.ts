"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiRequestError } from "@/lib/api/client";
import {
  adminTreasuryApi,
  adminTreasuryKeys,
  type CreateAdjustmentBody,
} from "@/lib/api/admin-treasury";

const errMsg = (e: unknown, fallback: string) =>
  e instanceof ApiRequestError ? e.message : fallback;

/** `all` → no direction param. */
const directionParam = (v: string): string | undefined => (v === "all" ? undefined : v);

/**
 * Treasury adjustments hook — direction filter, paginated list, and the
 * create / delete mutations. Overview is invalidated on mutation since
 * adjustments move the current balance.
 */
export function useAdjustments() {
  const qc = useQueryClient();
  const [direction, setDirection] = React.useState("all");
  const [page, setPage] = React.useState(1);

  const query = useQuery({
    queryKey: adminTreasuryKeys.adjustments(page, "all", direction),
    queryFn: () =>
      adminTreasuryApi.adjustments({
        page,
        limit: 20,
        direction: directionParam(direction),
      }),
    placeholderData: (prev) => prev,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-treasury", "adjustments"] });
    qc.invalidateQueries({ queryKey: adminTreasuryKeys.overview() });
    qc.invalidateQueries({ queryKey: adminTreasuryKeys.analytics() });
  };

  const create = useMutation({
    mutationFn: (body: CreateAdjustmentBody) => adminTreasuryApi.createAdjustment(body),
    onSuccess: () => {
      toast.success("Adjustment added");
      invalidate();
    },
    onError: (e) => toast.error(errMsg(e, "Couldn't add adjustment")),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminTreasuryApi.deleteAdjustment(id),
    onSuccess: () => {
      toast.success("Adjustment deleted");
      invalidate();
    },
    onError: (e) => toast.error(errMsg(e, "Couldn't delete adjustment")),
  });

  return {
    direction,
    setDirection: (d: string) => {
      setDirection(d);
      setPage(1);
    },
    page,
    setPage,
    query,
    items: query.data?.items ?? [],
    pagination: query.data?.pagination,
    create,
    remove,
  };
}

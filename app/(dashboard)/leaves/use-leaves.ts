"use client";

import { useQuery } from "@tanstack/react-query";
import { leavesApi } from "@/lib/api/leaves";
import { qk } from "@/lib/query/keys";

/** Leaves overview — balances + recent history for the landing page. */
export function useLeaves() {
  const quota = useQuery({
    queryKey: qk.leaves.quota,
    queryFn: () => leavesApi.quota(),
  });

  const history = useQuery({
    queryKey: qk.leaves.history("all", 1),
    queryFn: () => leavesApi.history({ status: undefined, page: 1, limit: 10 }),
  });

  return { quota, history };
}

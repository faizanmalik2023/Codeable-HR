"use client";

import { useQuery } from "@tanstack/react-query";
import { leavesApi } from "@/lib/api/leaves";
import { qk } from "@/lib/query/keys";

/** Team roster for the manager leaves view. */
export function useTeamLeaves() {
  return useQuery({
    queryKey: qk.leaves.team,
    queryFn: () => leavesApi.team(),
    select: (d) => d.items,
  });
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { policiesApi } from "@/lib/api/policies";
import { qk } from "@/lib/query/keys";

/** Loads a single policy for the read-only PDF viewer. */
export function usePolicyViewer(id: string | null) {
  const query = useQuery({
    queryKey: qk.policy(id ?? ""),
    queryFn: () => policiesApi.get(id as string),
    enabled: !!id,
  });

  return { query, policy: query.data };
}

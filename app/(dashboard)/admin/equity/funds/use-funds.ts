"use client";

import { useQuery } from "@tanstack/react-query";
import { adminEquityApi, equityKeys } from "@/lib/api/admin-equity";

/** Read-only hook for the pooled funds page. */
export function useFunds() {
  const query = useQuery({
    queryKey: equityKeys.funds,
    queryFn: () => adminEquityApi.funds(),
  });

  return { query, funds: query.data?.funds ?? [] };
}

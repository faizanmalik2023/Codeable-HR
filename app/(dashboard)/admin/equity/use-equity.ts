"use client";

import { useQuery } from "@tanstack/react-query";
import { adminEquityApi, equityKeys } from "@/lib/api/admin-equity";

/** Allocation / cap-table overview hook for the Equity landing page. */
export function useEquity() {
  const query = useQuery({
    queryKey: equityKeys.allocation,
    queryFn: () => adminEquityApi.allocation(),
  });

  return {
    query,
    beneficiaries: query.data?.beneficiaries ?? [],
    summary: query.data?.summary,
  };
}

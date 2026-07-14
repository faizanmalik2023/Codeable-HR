"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { adminEquityApi, equityKeys } from "@/lib/api/admin-equity";
import { statusParam } from "@/lib/enums";

/** List hook for the profit-distributions page — status filter + pagination. */
export function useDistributions() {
  const [status, setStatusState] = React.useState("all");
  const [page, setPage] = React.useState(1);

  const query = useQuery({
    queryKey: equityKeys.distributions(status, page),
    queryFn: () =>
      adminEquityApi.distributions({
        status: statusParam(status),
        page,
        limit: 10,
      }),
    placeholderData: (prev) => prev,
  });

  const setStatus = (s: string) => {
    setStatusState(s);
    setPage(1);
  };

  return {
    status,
    setStatus,
    page,
    setPage,
    query,
    items: query.data?.items ?? [],
    counts: query.data?.counts ?? {},
    pagination: query.data?.pagination,
  };
}

"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { leavesApi } from "@/lib/api/leaves";
import { qk } from "@/lib/query/keys";
import { statusParam } from "@/lib/enums";

/** Leave history list hook — filter tab + pagination. */
export function useLeaveHistory() {
  const [status, setStatus] = React.useState("all");
  const [page, setPage] = React.useState(1);

  const query = useQuery({
    queryKey: qk.leaves.history(status, page),
    queryFn: () => leavesApi.history({ status: statusParam(status), page, limit: 10 }),
    placeholderData: (prev) => prev,
  });

  return {
    status,
    setStatus: (s: string) => {
      setStatus(s);
      setPage(1);
    },
    page,
    setPage,
    pagination: query.data?.pagination,
    counts: query.data?.counts ?? {},
    items: query.data?.items ?? [],
    query,
  };
}

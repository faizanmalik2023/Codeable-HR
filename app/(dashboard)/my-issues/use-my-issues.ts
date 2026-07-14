"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { ticketsApi } from "@/lib/api/tickets";
import { qk } from "@/lib/query/keys";
import { statusParam } from "@/lib/enums";

/** List hook for the My Issues page — filter tab + pagination. */
export function useMyIssues() {
  const [status, setStatus] = React.useState("all");
  const [page, setPage] = React.useState(1);

  const query = useQuery({
    queryKey: qk.tickets.list(status, page),
    queryFn: () => ticketsApi.list({ status: statusParam(status), page, limit: 10 }),
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

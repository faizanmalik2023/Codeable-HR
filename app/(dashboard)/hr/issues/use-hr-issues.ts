"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { hrHelpApi } from "@/lib/api/hr-help";
import { statusParam } from "@/lib/enums";

/** List hook for the HR triage queue — filter tab + pagination. */
export function useHrIssues() {
  const [status, setStatus] = React.useState("all");
  const [page, setPage] = React.useState(1);

  const query = useQuery({
    queryKey: ["hr-tickets", status, page],
    queryFn: () => hrHelpApi.requests({ status: statusParam(status), page, limit: 10 }),
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

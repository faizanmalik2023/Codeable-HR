"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { adminLoansApi, adminLoanKeys } from "@/lib/api/admin-loans";
import { statusParam } from "@/lib/enums";

/** List hook for the Admin Loans page — per-tab filter + pagination. */
export function useLoans() {
  const [status, setStatusState] = React.useState("all");
  const [page, setPage] = React.useState(1);

  const query = useQuery({
    queryKey: adminLoanKeys.list(status, page),
    queryFn: () =>
      adminLoansApi.list({ status: statusParam(status), page, limit: 10 }),
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

"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { adminTreasuryApi, adminTreasuryKeys } from "@/lib/api/admin-treasury";

/**
 * Finance audit-trail hook — read-only, paginated. No mutations: the log is
 * immutable.
 */
export function useAudit() {
  const [page, setPage] = React.useState(1);

  const query = useQuery({
    queryKey: adminTreasuryKeys.audit(page),
    queryFn: () => adminTreasuryApi.audit({ page, limit: 20 }),
    placeholderData: (prev) => prev,
  });

  return {
    page,
    setPage,
    query,
    items: query.data?.items ?? [],
    pagination: query.data?.pagination,
  };
}

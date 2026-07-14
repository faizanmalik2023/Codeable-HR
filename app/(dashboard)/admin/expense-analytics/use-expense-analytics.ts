"use client";

import { useQuery } from "@tanstack/react-query";
import { adminExpensesApi, aeKeys } from "@/lib/api/admin-expenses";

/** Company-expense analytics query. */
export function useExpenseAnalytics() {
  const query = useQuery({
    queryKey: aeKeys.analytics,
    queryFn: () => adminExpensesApi.analytics(),
  });
  return { query, analytics: query.data };
}

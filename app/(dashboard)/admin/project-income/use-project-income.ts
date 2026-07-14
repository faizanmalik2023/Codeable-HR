"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  adminIncomeApi,
  adminIncomeKeys,
} from "@/lib/api/admin-income";

/** List + summary hook for the Project Income page — debounced search + pagination. */
export function useProjectIncome() {
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [page, setPage] = React.useState(1);

  // Debounce the search input by 300ms.
  React.useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const listParams = { page, limit: 10, search: debouncedSearch || undefined };

  const query = useQuery({
    queryKey: adminIncomeKeys.list(listParams),
    queryFn: () => adminIncomeApi.list(listParams),
    placeholderData: (prev) => prev,
  });

  const summary = useQuery({
    queryKey: adminIncomeKeys.summary(),
    queryFn: () => adminIncomeApi.summary(),
    staleTime: 60 * 1000,
  });

  return {
    search,
    setSearch,
    page,
    setPage,
    query,
    summary,
    items: query.data?.items ?? [],
    pagination: query.data?.pagination,
  };
}

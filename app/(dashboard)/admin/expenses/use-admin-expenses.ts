"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiRequestError } from "@/lib/api/client";
import {
  adminExpensesApi,
  aeKeys,
  type AdminExpenseListParams,
} from "@/lib/api/admin-expenses";

/** Debounce a rapidly-changing value (search box). */
function useDebounced<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export interface ExpenseFilters {
  /** `YYYY-MM` or "". */
  month: string;
  /** "" | "one_time" | "recurring". */
  frequency: string;
  /** category keys (multi-select). */
  categories: string[];
}

const EMPTY_FILTERS: ExpenseFilters = {
  month: "",
  frequency: "",
  categories: [],
};

export function activeFilterCount(f: ExpenseFilters): number {
  return (f.month ? 1 : 0) + (f.frequency ? 1 : 0) + f.categories.length;
}

/** List hook for the Company Expenses page — search + filters + pagination. */
export function useAdminExpenses() {
  const qc = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [filters, setFilters] = React.useState<ExpenseFilters>(EMPTY_FILTERS);
  const [page, setPage] = React.useState(1);
  const debouncedSearch = useDebounced(search);

  // Reset to page 1 whenever the query narrows.
  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters]);

  const params: AdminExpenseListParams = {
    page,
    limit: 20,
    search: debouncedSearch,
    month: filters.month || undefined,
    frequency: filters.frequency || undefined,
    category: filters.categories.length ? filters.categories.join(",") : undefined,
  };

  const query = useQuery({
    queryKey: aeKeys.list(params),
    queryFn: () => adminExpensesApi.list(params),
    placeholderData: (prev) => prev,
  });

  const options = useQuery({
    queryKey: aeKeys.options,
    queryFn: () => adminExpensesApi.options(),
    staleTime: 60 * 60 * 1000,
  });

  const pending = useQuery({
    queryKey: aeKeys.pending,
    queryFn: () => adminExpensesApi.pendingEntries(),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminExpensesApi.remove(id),
    onSuccess: () => {
      toast.success("Expense deleted");
      qc.invalidateQueries({ queryKey: aeKeys.all });
    },
    onError: (e) =>
      toast.error(e instanceof ApiRequestError ? e.message : "Couldn't delete expense"),
  });

  const savePending = useMutation({
    mutationFn: (entries: { id: string; amount: number }[]) =>
      Promise.all(
        entries.map((e) => adminExpensesApi.update(e.id, { amount: e.amount })),
      ),
    onSuccess: () => {
      toast.success("Amounts saved");
      qc.invalidateQueries({ queryKey: aeKeys.all });
    },
    onError: (e) =>
      toast.error(e instanceof ApiRequestError ? e.message : "Couldn't save amounts"),
  });

  const clearFilters = () => setFilters(EMPTY_FILTERS);

  const removeFilter = (patch: Partial<ExpenseFilters>) =>
    setFilters((f) => ({ ...f, ...patch }));

  return {
    search,
    setSearch,
    filters,
    setFilters,
    clearFilters,
    removeFilter,
    page,
    setPage,
    items: query.data?.items ?? [],
    pagination: query.data?.pagination,
    query,
    options,
    pendingEntries: pending.data ?? [],
    remove,
    savePending,
  };
}

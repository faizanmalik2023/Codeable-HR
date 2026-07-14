"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiRequestError } from "@/lib/api/client";
import { statusParam } from "@/lib/enums";
import {
  pmKeys,
  projectsMgmtApi,
  type ProjectBody,
} from "@/lib/api/projects-mgmt";

/** Debounce a rapidly-changing value (search box). */
function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/** List hook for the HR Projects page — search + status filter + pagination + create. */
export function useProjects() {
  const qc = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [page, setPage] = React.useState(1);
  const debouncedSearch = useDebounced(search);

  // Reset to page 1 whenever the query narrows.
  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status]);

  const query = useQuery({
    queryKey: pmKeys.list(debouncedSearch, status, page),
    queryFn: () =>
      projectsMgmtApi.list({
        search: debouncedSearch,
        status: statusParam(status),
        page,
        limit: 12,
      }),
    placeholderData: (prev) => prev,
  });

  const create = useMutation({
    mutationFn: (body: ProjectBody) => projectsMgmtApi.create(body),
    onSuccess: () => {
      toast.success("Project created");
      qc.invalidateQueries({ queryKey: pmKeys.all });
    },
    onError: (e) =>
      toast.error(e instanceof ApiRequestError ? e.message : "Couldn't create project"),
  });

  return {
    search,
    setSearch,
    status,
    setStatus,
    page,
    setPage,
    items: query.data?.items ?? [],
    counts: query.data?.counts ?? {},
    pagination: query.data?.pagination,
    query,
    create,
  };
}

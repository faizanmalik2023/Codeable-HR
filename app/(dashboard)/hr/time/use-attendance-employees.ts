"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { hrAttendanceApi, type HrAttendanceEmployee } from "@/lib/api/hr-attendance";
import type { Pagination } from "@/types";

/**
 * HR attendance employee directory — server-side name search (350ms debounce)
 * with pagination when the endpoint returns a paginated envelope.
 */
export function useAttendanceEmployees() {
  const [search, setSearch] = React.useState("");
  const [debounced, setDebounced] = React.useState("");
  const [page, setPage] = React.useState(1);

  // The server pages at 10, which leaves the three-column grid a third empty and
  // pushes a company this size onto a second page for no reason. 24 fills whole
  // rows at every breakpoint (1 / 2 / 3 columns) and fits everyone on one page.
  const LIMIT = 24;

  React.useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const query = useQuery({
    queryKey: ["hr", "attendance", "employees", debounced, page],
    queryFn: () =>
      hrAttendanceApi.employees({ name: debounced || undefined, page, limit: LIMIT }),
    placeholderData: (prev) => prev,
  });

  const data = query.data as
    | { items?: HrAttendanceEmployee[]; pagination?: Pagination }
    | undefined;
  const items: HrAttendanceEmployee[] = data?.items ?? [];
  const pagination = data?.pagination;

  return { search, setSearch, page, setPage, items, pagination, query };
}

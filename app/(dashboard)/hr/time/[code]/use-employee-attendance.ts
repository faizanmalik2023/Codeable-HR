"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { hrAttendanceApi } from "@/lib/api/hr-attendance";
import { statusParam } from "@/lib/enums";
import type { AttendanceDay } from "@/types";

/**
 * A single employee's monthly attendance (HR view) — month/year selector with a
 * client-side status filter over the fetched month. Local cache key.
 */
export function useEmployeeAttendance(code: string) {
  const now = React.useMemo(() => new Date(), []);
  const [month, setMonth] = React.useState(now.getMonth() + 1);
  const [year, setYear] = React.useState(now.getFullYear());
  const [filter, setFilter] = React.useState("all");

  const query = useQuery({
    queryKey: ["hr", "attendance", "employee-logs", code, month, year],
    queryFn: () => hrAttendanceApi.employeeLogs(code, { month, year }),
    enabled: !!code,
    placeholderData: (prev) => prev,
  });

  const items: AttendanceDay[] = query.data?.items ?? [];
  const summary = query.data?.summary;

  const filterValue = statusParam(filter);
  const filtered = React.useMemo(
    () => (filterValue ? items.filter((d) => d.status === filterValue) : items),
    [items, filterValue]
  );

  return { month, setMonth, year, setYear, filter, setFilter, items, filtered, summary, query };
}

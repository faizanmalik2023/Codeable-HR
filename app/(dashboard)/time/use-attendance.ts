"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { attendanceApi } from "@/lib/api/attendance";
import { qk } from "@/lib/query/keys";
import { statusParam } from "@/lib/enums";
import type { AttendanceDay } from "@/types";

/**
 * "My Attendance" hook — month/year selector + client-side status filter.
 * The whole month is fetched once; filter tabs slice over `items` locally.
 */
export function useAttendance() {
  const now = React.useMemo(() => new Date(), []);
  const [month, setMonth] = React.useState(now.getMonth() + 1);
  const [year, setYear] = React.useState(now.getFullYear());
  const [filter, setFilter] = React.useState("all");

  const query = useQuery({
    queryKey: qk.attendance.logs(month, year),
    queryFn: () => attendanceApi.logs({ month, year }),
    placeholderData: (prev) => prev,
  });

  const items: AttendanceDay[] = query.data?.items ?? [];
  const summary = query.data?.summary;

  const filterValue = statusParam(filter);
  const filtered = React.useMemo(
    () => (filterValue ? items.filter((d) => d.status === filterValue) : items),
    [items, filterValue]
  );

  return {
    month,
    setMonth,
    year,
    setYear,
    filter,
    setFilter,
    items,
    filtered,
    summary,
    query,
  };
}

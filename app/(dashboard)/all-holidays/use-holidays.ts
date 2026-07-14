"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  holidaysApi,
  holidayKeys,
  toHolidays,
  type Holiday,
} from "@/lib/api/holidays";

export type HolidayTimeFilter = "upcoming" | "past";

/** Derive whether a holiday is in the past (server `isPast` wins if present). */
export function isHolidayPast(h: Holiday): boolean {
  if (typeof h.isPast === "boolean") return h.isPast;
  if (!h.date) return false;
  const start = new Date(h.date);
  const end = new Date(start);
  end.setDate(start.getDate() + Math.max(0, (h.days ?? 1) - 1));
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  return end < todayStart;
}

/** Holidays list hook — loads all, then filters client-side by upcoming/past. */
export function useHolidays() {
  const [filter, setFilter] = React.useState<HolidayTimeFilter>("upcoming");

  const query = useQuery({
    queryKey: holidayKeys.list(),
    queryFn: () => holidaysApi.list(),
  });

  const all = React.useMemo(() => toHolidays(query.data), [query.data]);

  const filtered = React.useMemo(() => {
    const rows = all.filter((h) =>
      filter === "past" ? isHolidayPast(h) : !isHolidayPast(h)
    );
    return rows.sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return filter === "past" ? db - da : da - db;
    });
  }, [all, filter]);

  const counts = React.useMemo(
    () => ({
      upcoming: all.filter((h) => !isHolidayPast(h)).length,
      past: all.filter((h) => isHolidayPast(h)).length,
    }),
    [all]
  );

  return { filter, setFilter, query, filtered, counts };
}

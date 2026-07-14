"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { notificationsApi } from "@/lib/api/notifications";
import { qk } from "@/lib/query/keys";
import type { ActivityItemModel } from "@/types";

/** Match an activity `type` against a client-side filter tab. */
export function matchesActivityFilter(type: string, filter: string): boolean {
  const t = (type ?? "").toLowerCase();
  if (filter === "leaves") return t.includes("leave");
  if (filter === "eod") return t.includes("eod");
  if (filter === "other") return !t.includes("leave") && !t.includes("eod");
  return true;
}

/** Recent activity feed — fetched once (up to 50), filtered client-side. */
export function useRecentActivity() {
  const [filter, setFilter] = React.useState("all");

  const query = useQuery({
    queryKey: qk.activity("all"),
    queryFn: async (): Promise<ActivityItemModel[]> => {
      const res = await notificationsApi.activity({ filter: "all", page: 1, limit: 50 });
      return res?.items ?? [];
    },
  });

  const all = React.useMemo(() => query.data ?? [], [query.data]);
  const items = React.useMemo(
    () => (filter === "all" ? all : all.filter((a) => matchesActivityFilter(a.type, filter))),
    [all, filter]
  );

  return { filter, setFilter, items, query };
}

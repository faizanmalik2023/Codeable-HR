"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { notificationsApi } from "@/lib/api/notifications";
import { qk } from "@/lib/query/keys";
import { ApiRequestError } from "@/lib/api/client";

/** Notifications inbox hook — server-driven filter + pagination + read mutations. */
export function useNotifications() {
  const qc = useQueryClient();
  const [filter, setFilterState] = React.useState("all");
  const [page, setPage] = React.useState(1);

  const query = useQuery({
    queryKey: qk.notifications(filter, page),
    queryFn: () => notificationsApi.list({ filter, page, limit: 30 }),
    placeholderData: (prev) => prev,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (e) =>
      toast.error(e instanceof ApiRequestError ? e.message : "Couldn't update notification"),
  });

  const markAllRead = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      toast.success("All notifications marked as read");
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (e) =>
      toast.error(e instanceof ApiRequestError ? e.message : "Couldn't update notifications"),
  });

  return {
    filter,
    setFilter: (f: string) => {
      setFilterState(f);
      setPage(1);
    },
    page,
    setPage,
    items: query.data?.items ?? [],
    pagination: query.data?.pagination,
    query,
    markRead,
    markAllRead,
  };
}

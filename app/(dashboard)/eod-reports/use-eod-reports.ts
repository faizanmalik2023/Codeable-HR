"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { eodsApi } from "@/lib/api/eods";
import { qk } from "@/lib/query/keys";
import { statusParam } from "@/lib/enums";
import { ApiRequestError } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth-store";

/** List hook for the EOD Reports page — filter tab + pagination + delete.
 *  The backend blocks admins from the personal `/eods` surface (they use the
 *  team endpoints), so we skip the personal fetch for admins. */
export function useEodReports() {
  const qc = useQueryClient();
  const role = useAuthStore((s) => s.user?.role ?? "employee");
  const isAdmin = role === "admin";
  const [status, setStatus] = React.useState("all");
  const [page, setPage] = React.useState(1);

  const query = useQuery({
    queryKey: qk.eods.list(status, page),
    queryFn: () => eodsApi.list({ status: statusParam(status), page, limit: 10 }),
    placeholderData: (prev) => prev,
    enabled: !isAdmin,
  });

  const remove = useMutation({
    mutationFn: (id: string) => eodsApi.remove(id),
    onSuccess: () => {
      toast.success("Report deleted");
      qc.invalidateQueries({ queryKey: ["eods"] });
    },
    onError: (e) => toast.error(e instanceof ApiRequestError ? e.message : "Couldn't delete report"),
  });

  const counts = query.data?.counts ?? {};
  const pagination = query.data?.pagination;

  // A 403 means this role has no personal-EOD surface (admins, and possibly others).
  const forbidden =
    isAdmin || (query.error instanceof ApiRequestError && query.error.status === 403);

  return {
    status,
    setStatus: (s: string) => {
      setStatus(s);
      setPage(1);
    },
    page,
    setPage,
    pagination,
    counts,
    items: query.data?.items ?? [],
    query,
    remove,
    forbidden,
  };
}

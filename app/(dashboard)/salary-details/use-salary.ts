"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { salaryApi } from "@/lib/api/salary";
import { qk } from "@/lib/query/keys";
import { ApiRequestError } from "@/lib/api/client";

/**
 * Salary Details hook — loads breakdown, revision history and slips in
 * parallel, plus a per-slip download mutation (tracks the pending id).
 */
export function useSalary() {
  const breakdown = useQuery({
    queryKey: qk.salary.breakdown,
    queryFn: () => salaryApi.breakdown(),
  });

  const revisions = useQuery({
    queryKey: qk.salary.revisions,
    queryFn: () => salaryApi.revisions(),
  });

  const slips = useQuery({
    queryKey: qk.salary.slips,
    queryFn: () => salaryApi.slips(),
  });

  const download = useMutation({
    mutationFn: (id: string) => salaryApi.download(id),
    onSuccess: (res) => {
      if (res?.url) window.open(res.url, "_blank");
      else toast.error("No download available for this slip.");
    },
    onError: (e) =>
      toast.error(e instanceof ApiRequestError ? e.message : "Couldn't download slip"),
  });

  const downloadingId = download.isPending ? (download.variables ?? null) : null;

  const refetchAll = () => {
    breakdown.refetch();
    revisions.refetch();
    slips.refetch();
  };

  return { breakdown, revisions, slips, download, downloadingId, refetchAll };
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { eodsApi } from "@/lib/api/eods";
import { qk } from "@/lib/query/keys";
import type { EodReportModel, Paginated } from "@/types";

/** Member EOD list + optimistic mark-read. */
export function useTeamMemberEod(employeeId: string) {
  const qc = useQueryClient();
  const key = qk.eods.teamMember(employeeId);

  const query = useQuery({
    queryKey: key,
    queryFn: () => eodsApi.teamMember(employeeId),
    enabled: !!employeeId,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => eodsApi.markRead(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Paginated<EodReportModel>>(key);
      qc.setQueryData<Paginated<EodReportModel>>(key, (old) =>
        old
          ? { ...old, items: old.items.map((r) => (r.id === id ? { ...r, is_read: true } : r)) }
          : old
      );
      return { prev };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk.eods.team });
    },
  });

  return { query, markRead };
}

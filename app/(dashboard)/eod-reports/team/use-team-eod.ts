"use client";

import { useQuery } from "@tanstack/react-query";
import { eodsApi } from "@/lib/api/eods";
import { qk } from "@/lib/query/keys";

/** Team roster for the manager EOD view. */
export function useTeamEod() {
  return useQuery({
    queryKey: qk.eods.team,
    queryFn: () => eodsApi.team(),
    select: (d) => d.items,
  });
}

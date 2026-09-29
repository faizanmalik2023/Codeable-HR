import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { qk } from "@/lib/query/keys";

export interface ProjectOption {
  id: string;
  name: string;
  code?: string;
  color?: string;
  status?: string;
}

export const projectsApi = {
  options: (all?: boolean) =>
    api.get<ProjectOption[]>("/projects/options", { all: all || undefined }),
};

/**
 * Project picker options (used by EOD, project income, etc.). Active only by
 * default — EOD submit rejects non-active projects. `all` adds planning /
 * on-hold / completed (admin/HR only; the backend ignores it for anyone else).
 */
export function useProjectOptions({ all = false }: { all?: boolean } = {}) {
  return useQuery({
    queryKey: [...qk.projectOptions, { all }],
    queryFn: () => projectsApi.options(all),
    staleTime: 5 * 60 * 1000,
  });
}

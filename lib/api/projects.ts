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
  options: () => api.get<ProjectOption[]>("/projects/options"),
};

/** Project picker options (used by EOD, project income, etc.). */
export function useProjectOptions() {
  return useQuery({
    queryKey: qk.projectOptions,
    queryFn: () => projectsApi.options(),
    staleTime: 5 * 60 * 1000,
  });
}

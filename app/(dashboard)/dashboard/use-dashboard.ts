"use client";

import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/lib/api/dashboard";
import { qk } from "@/lib/query/keys";
import { useAuthStore, isManagerUser } from "@/stores/auth-store";

/** Data hook for the dashboard page — keeps the page component pure UI. */
export function useDashboard() {
  const user = useAuthStore((s) => s.user);
  const query = useQuery({
    queryKey: qk.dashboard,
    queryFn: ({ signal }) => dashboardApi.get(signal),
  });

  return {
    ...query,
    user,
    isManager: isManagerUser(user),
    role: user?.role ?? "employee",
  };
}

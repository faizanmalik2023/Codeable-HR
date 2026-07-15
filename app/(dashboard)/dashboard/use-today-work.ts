"use client";

import { useQuery } from "@tanstack/react-query";
import { attendanceApi } from "@/lib/api/attendance";
import { qk } from "@/lib/query/keys";

/**
 * Today's attendance record for the dashboard work timer. The per-second clock is
 * ticked client-side; we only re-fetch periodically (and on window focus) to pick
 * up new sessions the biometric device pushes when someone leaves/returns.
 *
 * `enabled` lets the caller skip the request for roles that don't clock in.
 */
export function useTodayWork(enabled = true) {
  return useQuery({
    queryKey: qk.attendance.today,
    queryFn: () => attendanceApi.today(),
    enabled,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });
}

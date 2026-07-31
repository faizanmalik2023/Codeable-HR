"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { attendanceApi } from "@/lib/api/attendance";
import { ApiRequestError } from "@/lib/api/client";

/**
 * Submit a checkout time for a day left open.
 *
 * Shared by the dashboard's live card (today) and the attendance log (an earlier day),
 * because both post the same correction and both have to invalidate the same two
 * caches — the live record and the month log, either of which would otherwise keep
 * showing the day as still open.
 */
export function useAdjustCheckout() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (body: { check_out_time: string; date?: string; reason?: string }) =>
      attendanceApi.adjustCheckout(body),
    onSuccess: (updated) => {
      // A same-day fix lands immediately; a backdated one is queued for HR. Say which,
      // because "Saved" would imply the hours already moved when they may not have.
      if (updated?.checkout_status === "pending_approval") {
        toast.success("Sent to HR", {
          description: "Your hours update once it's approved.",
        });
      } else {
        toast.success("Checkout time saved");
      }
      qc.invalidateQueries({ queryKey: ["attendance"], exact: false });
      // The dashboard's glance tiles carry the day's status too.
      qc.invalidateQueries({ queryKey: ["dashboard"], exact: false });
    },
    onError: (e) =>
      toast.error(
        e instanceof ApiRequestError ? e.message : "Couldn't save that checkout time"
      ),
  });
}

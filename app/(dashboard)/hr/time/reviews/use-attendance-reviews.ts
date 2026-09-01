"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { hrAttendanceApi } from "@/lib/api/hr-attendance";
import { ApiRequestError } from "@/lib/api/client";

/**
 * HR attendance review queue — status tab + pagination and the approve/reject
 * decision mutation. Mirrors the leave-requests hook.
 */
export function useAttendanceReviews() {
  const qc = useQueryClient();
  const [status, setStatus] = React.useState("pending");
  const [page, setPage] = React.useState(1);

  const query = useQuery({
    queryKey: ["attendance", "reviews", status, page],
    queryFn: () => hrAttendanceApi.reviews({ status, page, limit: 20 }),
    placeholderData: (prev) => prev,
  });

  const decide = useMutation({
    mutationFn: ({
      id,
      decision,
      note,
    }: {
      id: string;
      decision: "approve" | "reject";
      note?: string;
    }) =>
      decision === "approve"
        ? hrAttendanceApi.approveReview(id, note)
        : hrAttendanceApi.rejectReview(id, note),
    onSuccess: (_data, variables) => {
      toast.success(
        variables.decision === "approve" ? "Attendance approved" : "Attendance adjusted"
      );
      qc.invalidateQueries({ queryKey: ["attendance", "reviews"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (e) =>
      toast.error(e instanceof ApiRequestError ? e.message : "Couldn't save the decision"),
  });

  return {
    status,
    setStatus: (s: string) => {
      setStatus(s);
      setPage(1);
    },
    page,
    setPage,
    items: query.data?.items ?? [],
    pagination: query.data?.pagination,
    query,
    decide,
  };
}

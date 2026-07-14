"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { payrollApi } from "@/lib/api/payroll";
import { ApiRequestError } from "@/lib/api/client";

/** Local query keys — payroll owns these (do not touch the shared catalog). */
const payrollKeys = {
  slips: (month: number, year: number) => ["payroll", "slips", month, year] as const,
};

const now = new Date();

/**
 * HR Payroll list hook — period picker (month/year), summary totals, and the
 * period-wide generate / release mutations. Refetches on period change.
 */
export function usePayroll() {
  const qc = useQueryClient();
  const [month, setMonth] = React.useState(now.getMonth() + 1);
  const [year, setYear] = React.useState(now.getFullYear());

  const query = useQuery({
    queryKey: payrollKeys.slips(month, year),
    queryFn: () => payrollApi.slips({ month, year }),
    placeholderData: (prev) => prev,
  });

  const slips = query.data?.items ?? [];

  const summary = React.useMemo(() => {
    let netTotal = 0;
    let sent = 0;
    let pending = 0;
    for (const s of slips) {
      netTotal += s.net_amount ?? 0;
      if (s.status === "generated") sent += 1;
      else pending += 1;
    }
    return { netTotal, sent, pending };
  }, [slips]);

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: payrollKeys.slips(month, year) });

  const generate = useMutation({
    mutationFn: () => payrollApi.generate({ month, year }),
    onSuccess: (res) => {
      toast.success(
        res.created > 0
          ? `Generated ${res.created} payslip${res.created === 1 ? "" : "s"}`
          : "No new payslips to generate"
      );
      invalidate();
    },
    onError: (e) =>
      toast.error(e instanceof ApiRequestError ? e.message : "Couldn't generate payroll"),
  });

  const release = useMutation({
    mutationFn: () => payrollApi.release({ month, year }),
    onSuccess: (res) => {
      const released = res.released;
      toast.success(
        `Released ${released} payslip${released === 1 ? "" : "s"}` +
          (res.failed > 0 ? ` · ${res.failed} failed` : "")
      );
      invalidate();
    },
    onError: (e) =>
      toast.error(e instanceof ApiRequestError ? e.message : "Couldn't release payroll"),
  });

  return {
    month,
    year,
    setMonth,
    setYear,
    query,
    slips,
    summary,
    generate,
    release,
  };
}

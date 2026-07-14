"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { payrollApi, type PayrollAmendBody } from "@/lib/api/payroll";
import { ApiRequestError } from "@/lib/api/client";

/** Local query keys — payroll owns these (do not touch the shared catalog). */
const payslipKeys = {
  detail: (id: string) => ["payroll", "slip", id] as const,
};

/**
 * Payslip detail hook — loads a single slip and exposes amend / release /
 * download mutations. Invalidates both the detail and the payroll list on write.
 */
export function usePayslip(id: string) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: payslipKeys.detail(id),
    queryFn: () => payrollApi.slip(id),
    enabled: Boolean(id),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: payslipKeys.detail(id) });
    qc.invalidateQueries({ queryKey: ["payroll", "slips"] });
  };

  const amend = useMutation({
    mutationFn: (body: PayrollAmendBody) => payrollApi.amend(id, body),
    onSuccess: () => {
      toast.success("Payslip updated");
      invalidate();
    },
    onError: (e) =>
      toast.error(e instanceof ApiRequestError ? e.message : "Couldn't update payslip"),
  });

  const release = useMutation({
    mutationFn: () => payrollApi.releaseOne(id),
    onSuccess: () => {
      toast.success("Payslip released");
      invalidate();
    },
    onError: (e) =>
      toast.error(e instanceof ApiRequestError ? e.message : "Couldn't release payslip"),
  });

  const download = useMutation({
    mutationFn: () => payrollApi.download(id),
    onSuccess: (res) => {
      if (res?.url) window.open(res.url, "_blank");
      else toast.error("No download available for this slip.");
    },
    onError: (e) =>
      toast.error(e instanceof ApiRequestError ? e.message : "Couldn't download slip"),
  });

  return { query, amend, release, download };
}

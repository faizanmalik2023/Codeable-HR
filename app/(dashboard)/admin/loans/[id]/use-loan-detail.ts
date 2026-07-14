"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  adminLoansApi,
  adminLoanKeys,
  type RecordPaymentBody,
  type UpdateLoanBody,
} from "@/lib/api/admin-loans";
import { ApiRequestError } from "@/lib/api/client";

/** Detail hook — loan record + edit / record-payment / delete mutations. */
export function useLoanDetail(id: string) {
  const router = useRouter();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: adminLoanKeys.detail(id),
    queryFn: () => adminLoansApi.get(id),
    enabled: !!id,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: adminLoanKeys.detail(id) });
    qc.invalidateQueries({ queryKey: adminLoanKeys.all });
  };

  const onError = (fallback: string) => (e: unknown) =>
    toast.error(e instanceof ApiRequestError ? e.message : fallback);

  const update = useMutation({
    mutationFn: (body: UpdateLoanBody) => adminLoansApi.update(id, body),
    onSuccess: () => {
      toast.success("Loan updated");
      invalidate();
    },
    onError: onError("Couldn't update loan"),
  });

  const recordPayment = useMutation({
    mutationFn: (body: RecordPaymentBody) => adminLoansApi.recordPayment(id, body),
    onSuccess: () => {
      toast.success("Payment recorded");
      invalidate();
    },
    onError: onError("Couldn't record payment"),
  });

  const remove = useMutation({
    mutationFn: () => adminLoansApi.remove(id),
    onSuccess: () => {
      toast.success("Loan deleted");
      qc.invalidateQueries({ queryKey: adminLoanKeys.all });
      router.push("/admin/loans");
    },
    onError: onError("Couldn't delete loan"),
  });

  return { query, update, recordPayment, remove };
}

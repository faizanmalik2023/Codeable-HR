"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { employeesApi } from "@/lib/api/employees";
import {
  adminLoansApi,
  adminLoanKeys,
  type CreateLoanBody,
} from "@/lib/api/admin-loans";
import { ApiRequestError } from "@/lib/api/client";

/** Create-loan hook — borrower options (from `/employees?limit=100`) + the create mutation. */
export function useCreateLoan() {
  const router = useRouter();
  const qc = useQueryClient();

  const employees = useQuery({
    queryKey: [...adminLoanKeys.all, "borrowers"],
    queryFn: () => employeesApi.list({ limit: 100 }),
    staleTime: 5 * 60 * 1000,
  });

  const borrowerOptions = React.useMemo(
    () =>
      (employees.data?.items ?? []).map((e) => ({
        value: e.id,
        label: e.full_name,
        description: e.employee_code,
        avatar: e.avatar ?? undefined,
      })),
    [employees.data]
  );

  const create = useMutation({
    mutationFn: (body: CreateLoanBody) => adminLoansApi.create(body),
    onSuccess: () => {
      toast.success("Loan created");
      qc.invalidateQueries({ queryKey: adminLoanKeys.all });
      router.push("/admin/loans");
    },
    onError: (e) =>
      toast.error(
        e instanceof ApiRequestError ? e.message : "Couldn't create loan"
      ),
  });

  return { employees, borrowerOptions, create };
}

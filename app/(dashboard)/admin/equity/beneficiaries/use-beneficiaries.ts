"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  adminEquityApi,
  equityKeys,
  type BeneficiaryBody,
} from "@/lib/api/admin-equity";
import { employeesApi } from "@/lib/api/employees";
import { ApiRequestError } from "@/lib/api/client";

const errMsg = (e: unknown, fallback: string) =>
  e instanceof ApiRequestError ? e.message : fallback;

/** List + CRUD hook for the equity Beneficiaries page. */
export function useBeneficiaries() {
  const qc = useQueryClient();
  const [page, setPage] = React.useState(1);

  const query = useQuery({
    queryKey: equityKeys.beneficiaries("all", page),
    queryFn: () => adminEquityApi.beneficiaries({ page, limit: 20 }),
    placeholderData: (prev) => prev,
  });

  const employees = useQuery({
    queryKey: ["employees", "list"],
    queryFn: () => employeesApi.list({ limit: 100 }),
    staleTime: 60 * 1000,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: equityKeys.all });
  };

  const create = useMutation({
    mutationFn: (body: BeneficiaryBody) => adminEquityApi.createBeneficiary(body),
    onSuccess: () => {
      toast.success("Beneficiary added");
      invalidate();
    },
    onError: (e) => toast.error(errMsg(e, "Couldn't add beneficiary")),
  });

  const update = useMutation({
    mutationFn: (vars: { id: string; body: Partial<BeneficiaryBody> }) =>
      adminEquityApi.updateBeneficiary(vars.id, vars.body),
    onSuccess: () => {
      toast.success("Beneficiary updated");
      invalidate();
    },
    onError: (e) => toast.error(errMsg(e, "Couldn't update beneficiary")),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminEquityApi.deleteBeneficiary(id),
    onSuccess: () => {
      toast.success("Beneficiary removed");
      invalidate();
    },
    onError: (e) => toast.error(errMsg(e, "Couldn't remove beneficiary")),
  });

  const employeeOptions = React.useMemo(
    () =>
      (employees.data?.items ?? []).map((e) => ({
        value: e.id,
        label: e.full_name,
        description: e.designation?.name ?? e.employee_code,
      })),
    [employees.data]
  );

  return {
    query,
    items: query.data?.items ?? [],
    pagination: query.data?.pagination,
    page,
    setPage,
    employeeOptions,
    create,
    update,
    remove,
  };
}

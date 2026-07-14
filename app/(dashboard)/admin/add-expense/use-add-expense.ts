"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiRequestError } from "@/lib/api/client";
import { useEnums, toOptions } from "@/lib/api/enums";
import { employeesApi } from "@/lib/api/employees";
import {
  adminExpensesApi,
  aeKeys,
  prettify,
  type ExpenseBody,
} from "@/lib/api/admin-expenses";

/** Data + mutations for the add/edit-expense wizard. */
export function useAddExpense() {
  const router = useRouter();
  const qc = useQueryClient();
  const params = useSearchParams();
  const id = params.get("id");

  const editing = useQuery({
    queryKey: aeKeys.detail(id ?? ""),
    queryFn: () => adminExpensesApi.get(id as string),
    enabled: !!id,
  });

  const enums = useEnums();

  const employees = useQuery({
    queryKey: ["admin-expenses", "employees"],
    queryFn: () => employeesApi.list({ limit: 100 }),
    staleTime: 5 * 60 * 1000,
  });

  const categoryOptions = React.useMemo(
    () =>
      toOptions(enums.data?.expense_type).map((o) => ({
        value: o.value,
        label: prettify(o.value),
      })),
    [enums.data],
  );

  const paymentOptions = React.useMemo(
    () =>
      toOptions(enums.data?.payment_method).map((o) => ({
        value: o.value,
        label: prettify(o.value),
      })),
    [enums.data],
  );

  const employeeOptions = React.useMemo(
    () =>
      (employees.data?.items ?? []).map((e) => ({
        value: e.employee_code,
        label: e.full_name,
        description: e.employee_code,
      })),
    [employees.data],
  );

  const onDone = (msg: string) => {
    toast.success(msg);
    qc.invalidateQueries({ queryKey: aeKeys.all });
    router.push("/admin/expenses");
  };

  const create = useMutation({
    mutationFn: (body: ExpenseBody) => adminExpensesApi.create(body),
    onSuccess: () => onDone("Expense added"),
    onError: (e) =>
      toast.error(e instanceof ApiRequestError ? e.message : "Couldn't add expense"),
  });

  const update = useMutation({
    mutationFn: (body: ExpenseBody) => adminExpensesApi.update(id as string, body),
    onSuccess: () => onDone("Expense updated"),
    onError: (e) =>
      toast.error(e instanceof ApiRequestError ? e.message : "Couldn't update expense"),
  });

  return {
    id,
    isEditing: !!id,
    editing,
    categoryOptions,
    paymentOptions,
    employeeOptions,
    create,
    update,
  };
}

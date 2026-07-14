"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  employeesApi,
  type CreateEmployeeBody,
} from "@/lib/api/employees";
import { ApiRequestError } from "@/lib/api/client";

/** Local query keys — `lib/query/keys.ts` is off-limits for this feature. */
const keys = {
  list: ["employees", "list"] as const,
  designations: ["employees", "designations"] as const,
  departments: ["employees", "departments"] as const,
};

/** Add-employee onboarding hook — loads picker data + the create mutation. */
export function useAddEmployee() {
  const router = useRouter();
  const qc = useQueryClient();

  const designations = useQuery({
    queryKey: keys.designations,
    queryFn: () => employeesApi.designations(),
    staleTime: 5 * 60 * 1000,
  });

  const departments = useQuery({
    queryKey: keys.departments,
    queryFn: () => employeesApi.departments(),
    staleTime: 5 * 60 * 1000,
  });

  const employees = useQuery({
    queryKey: keys.list,
    queryFn: () => employeesApi.list({ limit: 100 }),
    staleTime: 60 * 1000,
  });

  const create = useMutation({
    mutationFn: (body: CreateEmployeeBody) => employeesApi.create(body),
    onSuccess: (res) => {
      toast.success(`Employee added (${res?.employee_code ?? ""})`.trim());
      qc.invalidateQueries({ queryKey: keys.list });
      router.push("/people");
    },
    onError: (e) =>
      toast.error(e instanceof ApiRequestError ? e.message : "Couldn't add employee"),
  });

  const designationOptions = React.useMemo(
    () => (designations.data ?? []).map((d) => ({ value: d.id, label: d.name })),
    [designations.data]
  );

  const departmentOptions = React.useMemo(
    () => (departments.data ?? []).map((d) => ({ value: d.id, label: d.name })),
    [departments.data]
  );

  const managerOptions = React.useMemo(
    () =>
      (employees.data?.items ?? []).map((e) => ({
        value: e.id,
        label: e.full_name,
        description: e.designation?.name,
      })),
    [employees.data]
  );

  return {
    create,
    designationOptions,
    departmentOptions,
    managerOptions,
  };
}

"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  employeesApi,
  type IncrementBody,
  type PromoteBody,
  type UpdateEmployeeBody,
} from "@/lib/api/employees";
import { ApiRequestError } from "@/lib/api/client";

/** Local query keys — `lib/query/keys.ts` is off-limits for this feature. */
const employeeKeys = {
  detail: (id: string) => ["employees", "detail", id] as const,
  list: ["employees", "list"] as const,
  designations: ["employees", "designations"] as const,
  departments: ["employees", "departments"] as const,
};

const errMsg = (e: unknown, fallback: string) =>
  e instanceof ApiRequestError ? e.message : fallback;

/**
 * Employee detail hook — loads the full record plus picker data (designations,
 * departments, employee list for the manager picker) and exposes the four
 * lifecycle actions: update / promote / increment / deactivate.
 */
export function useEmployee(id: string) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: employeeKeys.detail(id),
    queryFn: () => employeesApi.get(id),
    enabled: !!id,
  });

  const designations = useQuery({
    queryKey: employeeKeys.designations,
    queryFn: () => employeesApi.designations(),
    staleTime: 5 * 60 * 1000,
  });

  const departments = useQuery({
    queryKey: employeeKeys.departments,
    queryFn: () => employeesApi.departments(),
    staleTime: 5 * 60 * 1000,
  });

  const employees = useQuery({
    queryKey: employeeKeys.list,
    queryFn: () => employeesApi.list({ limit: 100 }),
    staleTime: 60 * 1000,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: employeeKeys.detail(id) });
    qc.invalidateQueries({ queryKey: employeeKeys.list });
  };

  const update = useMutation({
    mutationFn: (body: UpdateEmployeeBody) => employeesApi.update(id, body),
    onSuccess: () => {
      toast.success("Employee updated");
      invalidate();
    },
    onError: (e) => toast.error(errMsg(e, "Couldn't update employee")),
  });

  const promote = useMutation({
    mutationFn: (body: PromoteBody) => employeesApi.promote(id, body),
    onSuccess: () => {
      toast.success("Employee promoted");
      invalidate();
    },
    onError: (e) => toast.error(errMsg(e, "Couldn't promote employee")),
  });

  const increment = useMutation({
    mutationFn: (body: IncrementBody) => employeesApi.increment(id, body),
    onSuccess: () => {
      toast.success("Increment applied");
      invalidate();
    },
    onError: (e) => toast.error(errMsg(e, "Couldn't apply increment")),
  });

  const deactivate = useMutation({
    mutationFn: () => employeesApi.deactivate(id),
    onSuccess: () => {
      toast.success("Employee deactivated");
      invalidate();
    },
    onError: (e) => toast.error(errMsg(e, "Couldn't deactivate employee")),
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
      (employees.data?.items ?? [])
        .filter((e) => e.id !== id)
        .map((e) => ({
          value: e.id,
          label: e.full_name,
          description: e.designation?.name,
        })),
    [employees.data, id]
  );

  return {
    query,
    update,
    promote,
    increment,
    deactivate,
    designationOptions,
    departmentOptions,
    managerOptions,
  };
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  departmentsApi,
  toItems,
  type DepartmentCreateBody,
} from "@/lib/api/departments";
import { ApiRequestError } from "@/lib/api/client";

/** Local query keys — spec forbids editing `lib/query/keys.ts`. */
export const departmentKeys = {
  all: ["departments"] as const,
  list: () => ["departments", "list"] as const,
  detail: (id: string) => ["departments", "detail", id] as const,
  available: (id: string) => ["departments", "available", id] as const,
};

/** List hook for the Departments page — load, create, delete. */
export function useDepartments() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: departmentKeys.list(),
    queryFn: () => departmentsApi.list(),
    select: toItems,
  });

  const create = useMutation({
    mutationFn: (body: DepartmentCreateBody) => departmentsApi.create(body),
    onSuccess: () => {
      toast.success("Department created");
      qc.invalidateQueries({ queryKey: departmentKeys.all });
    },
    onError: (e) =>
      toast.error(e instanceof ApiRequestError ? e.message : "Couldn't create department"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => departmentsApi.remove(id),
    onSuccess: () => {
      toast.success("Department deleted");
      qc.invalidateQueries({ queryKey: departmentKeys.all });
    },
    onError: (e) =>
      toast.error(e instanceof ApiRequestError ? e.message : "Couldn't delete department"),
  });

  return { query, items: query.data ?? [], create, remove };
}

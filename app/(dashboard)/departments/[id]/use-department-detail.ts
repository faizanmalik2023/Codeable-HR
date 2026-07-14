"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  departmentsApi,
  toItems,
  type Department,
  type DepartmentListResponse,
  type DepartmentUpdateBody,
} from "@/lib/api/departments";
import { ApiRequestError } from "@/lib/api/client";
import { departmentKeys } from "../use-departments";

const errMsg = (e: unknown, fallback: string) =>
  e instanceof ApiRequestError ? e.message : fallback;

/** Detail hook — load a department plus manager/member mutations. */
export function useDepartmentDetail(id: string) {
  const qc = useQueryClient();

  // There is no `GET /departments/:id` on the backend — the full department
  // (heads + members) already comes back with the list. Hydrate the detail from
  // the list-query cache when present, otherwise fetch the list once and pick it.
  const query = useQuery({
    queryKey: departmentKeys.detail(id),
    queryFn: async (): Promise<Department> => {
      const cached = qc.getQueryData<DepartmentListResponse>(departmentKeys.list());
      const items = toItems(cached ?? (await departmentsApi.list()));
      const found = items.find((d) => d.id === id);
      if (!found)
        throw new ApiRequestError(404, {
          code: "DEPARTMENT_NOT_FOUND",
          message: "Department not found",
        });
      return found;
    },
    enabled: !!id,
  });

  const available = useQuery({
    queryKey: departmentKeys.available(id),
    queryFn: () => departmentsApi.availableEmployees(id),
    select: toItems,
    enabled: false, // fetched on-demand when a picker opens
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: departmentKeys.detail(id) });
    qc.invalidateQueries({ queryKey: departmentKeys.available(id) });
    qc.invalidateQueries({ queryKey: departmentKeys.list() });
  };

  const update = useMutation({
    mutationFn: (body: DepartmentUpdateBody) => departmentsApi.update(id, body),
    onSuccess: () => {
      toast.success("Department updated");
      invalidate();
    },
    onError: (e) => toast.error(errMsg(e, "Couldn't update department")),
  });

  const setManager = useMutation({
    mutationFn: (manager_id: string) => departmentsApi.setManager(id, manager_id),
    onSuccess: () => {
      toast.success("Manager updated");
      invalidate();
    },
    onError: (e) => toast.error(errMsg(e, "Couldn't change manager")),
  });

  const addMember = useMutation({
    mutationFn: (employee_id: string) => departmentsApi.addMember(id, employee_id),
    onSuccess: () => {
      toast.success("Member added");
      invalidate();
    },
    onError: (e) => toast.error(errMsg(e, "Couldn't add member")),
  });

  const removeMember = useMutation({
    mutationFn: (code: string) => departmentsApi.removeMember(id, code),
    onSuccess: () => {
      toast.success("Member removed");
      invalidate();
    },
    onError: (e) => toast.error(errMsg(e, "Couldn't remove member")),
  });

  return {
    query,
    department: query.data,
    available,
    update,
    setManager,
    addMember,
    removeMember,
  };
}

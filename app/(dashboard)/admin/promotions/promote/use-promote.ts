"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  employeesApi,
  type PromoteBody,
  type SalaryComponent,
} from "@/lib/api/employees";
import { ApiRequestError } from "@/lib/api/client";

/** Local query keys — `lib/query/keys.ts` is off-limits for this feature. */
const promoteKeys = {
  employee: (id: string) => ["promotions", "employee", id] as const,
  designations: ["promotions", "designations"] as const,
};

/** Sum the salary components into a single gross figure. */
export function sumComponents(components: SalaryComponent[] | undefined): number {
  if (!components) return 0;
  return components.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
}

/** Promote hook — loads the target employee + designations, exposes promote(). */
export function usePromote() {
  const router = useRouter();
  const qc = useQueryClient();
  const params = useSearchParams();
  const id = params.get("id");

  const employee = useQuery({
    queryKey: promoteKeys.employee(id ?? ""),
    queryFn: () => employeesApi.get(id as string),
    enabled: !!id,
  });

  const designations = useQuery({
    queryKey: promoteKeys.designations,
    queryFn: () => employeesApi.designations(),
    staleTime: 5 * 60 * 1000,
  });

  const promote = useMutation({
    mutationFn: (body: PromoteBody) => employeesApi.promote(id as string, body),
    onSuccess: () => {
      toast.success("Employee promoted");
      qc.invalidateQueries({ queryKey: ["promotions"] });
      qc.invalidateQueries({ queryKey: ["employees"] });
      router.push("/admin/promotions");
    },
    onError: (e) =>
      toast.error(
        e instanceof ApiRequestError ? e.message : "Couldn't promote employee"
      ),
  });

  return {
    id,
    employee,
    designationOptions: (designations.data ?? []).map((d) => ({
      value: d.id,
      label: d.name,
      description: d.track ?? d.level ?? undefined,
    })),
    promote,
  };
}

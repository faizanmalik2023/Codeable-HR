"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiRequestError } from "@/lib/api/client";
import { adminExpensesApi, aeKeys } from "@/lib/api/admin-expenses";

/** List + manage recurring-expense templates. */
export function useExpenseTemplates() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: aeKeys.templates,
    queryFn: () => adminExpensesApi.templates(),
  });

  const toggle = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      adminExpensesApi.templateToggle(id, is_active),
    onSuccess: (_data, vars) => {
      toast.success(vars.is_active ? "Recurring resumed" : "Recurring paused");
      qc.invalidateQueries({ queryKey: aeKeys.templates });
    },
    onError: (e) =>
      toast.error(e instanceof ApiRequestError ? e.message : "Couldn't update"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminExpensesApi.templateDelete(id),
    onSuccess: () => {
      toast.success("Recurring expense stopped");
      qc.invalidateQueries({ queryKey: aeKeys.all });
    },
    onError: (e) =>
      toast.error(e instanceof ApiRequestError ? e.message : "Couldn't stop recurring"),
  });

  return {
    templates: query.data ?? [],
    query,
    toggle,
    remove,
  };
}

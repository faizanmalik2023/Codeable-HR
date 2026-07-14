"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  adminIncomeApi,
  adminIncomeKeys,
  type CreateIncomeBody,
  type UpdateIncomeBody,
} from "@/lib/api/admin-income";
import { useProjectOptions } from "@/lib/api/projects";
import { ApiRequestError } from "@/lib/api/client";

/** Create/edit hook for a project-income entry (reverse + delete in edit mode). */
export function useIncomeForm() {
  const router = useRouter();
  const qc = useQueryClient();
  const params = useSearchParams();
  const id = params.get("id");

  const editing = useQuery({
    queryKey: adminIncomeKeys.detail(id ?? ""),
    queryFn: () => adminIncomeApi.get(id as string),
    enabled: !!id,
  });

  const projects = useProjectOptions();

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: adminIncomeKeys.all });

  const onError = (fallback: string) => (e: unknown) =>
    toast.error(e instanceof ApiRequestError ? e.message : fallback);

  const create = useMutation({
    mutationFn: (body: CreateIncomeBody) => adminIncomeApi.create(body),
    onSuccess: () => {
      toast.success("Income added");
      invalidate();
      router.push("/admin/project-income");
    },
    onError: onError("Couldn't add income"),
  });

  const update = useMutation({
    mutationFn: (body: UpdateIncomeBody) =>
      adminIncomeApi.update(id as string, body),
    onSuccess: () => {
      toast.success("Income updated");
      invalidate();
      router.push("/admin/project-income");
    },
    onError: onError("Couldn't update income"),
  });

  const reverse = useMutation({
    mutationFn: () => adminIncomeApi.reverse(id as string),
    onSuccess: () => {
      toast.success("Income reversed");
      invalidate();
      router.push("/admin/project-income");
    },
    onError: onError("Couldn't reverse income"),
  });

  const remove = useMutation({
    mutationFn: () => adminIncomeApi.remove(id as string),
    onSuccess: () => {
      toast.success("Income deleted");
      invalidate();
      router.push("/admin/project-income");
    },
    onError: onError("Couldn't delete income"),
  });

  return {
    id,
    isEditing: !!id,
    editing,
    projectOptions: (projects.data ?? []).map((p) => ({
      value: p.id,
      label: p.name,
      description: p.code,
    })),
    create,
    update,
    reverse,
    remove,
  };
}

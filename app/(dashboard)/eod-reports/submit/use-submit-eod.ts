"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { eodsApi, type EodSubmitBody } from "@/lib/api/eods";
import { useProjectOptions } from "@/lib/api/projects";
import { qk } from "@/lib/query/keys";
import { ApiRequestError } from "@/lib/api/client";

/** Submit/edit EOD hook — loads the report in edit mode and exposes both actions. */
export function useSubmitEod() {
  const router = useRouter();
  const qc = useQueryClient();
  const params = useSearchParams();
  const id = params.get("id");

  const editing = useQuery({
    queryKey: qk.eods.detail(id ?? ""),
    queryFn: () => eodsApi.get(id as string),
    enabled: !!id,
  });

  const projects = useProjectOptions();

  const onSuccess = (msg: string) => {
    toast.success(msg);
    qc.invalidateQueries({ queryKey: ["eods"] });
    qc.invalidateQueries({ queryKey: qk.dashboard });
    router.push("/eod-reports");
  };

  const saveDraft = useMutation({
    mutationFn: (body: EodSubmitBody) => eodsApi.saveDraft(body),
    onSuccess: () => onSuccess("Draft saved"),
    onError: (e) => toast.error(e instanceof ApiRequestError ? e.message : "Couldn't save draft"),
  });

  const submit = useMutation({
    mutationFn: (body: EodSubmitBody) => eodsApi.submit(body),
    onSuccess: () => onSuccess("EOD submitted"),
    onError: (e) => toast.error(e instanceof ApiRequestError ? e.message : "Couldn't submit report"),
  });

  return {
    id,
    isEditing: !!id,
    editing,
    projectOptions: React.useMemo(
      () => (projects.data ?? []).map((p) => ({ value: p.id, label: p.name, description: p.code })),
      [projects.data]
    ),
    saveDraft,
    submit,
  };
}

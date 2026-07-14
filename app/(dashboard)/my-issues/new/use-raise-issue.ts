"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ticketsApi, type TicketCreateBody } from "@/lib/api/tickets";
import { ApiRequestError } from "@/lib/api/client";

/** Create-ticket hook — mirrors the submit-EOD mutation pattern. */
export function useRaiseIssue() {
  const router = useRouter();
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: (body: TicketCreateBody) => ticketsApi.create(body),
    onSuccess: (issue) => {
      toast.success("Issue raised");
      qc.invalidateQueries({ queryKey: ["tickets"] });
      router.replace(`/my-issues/${issue.id}`);
    },
    onError: (e) =>
      toast.error(e instanceof ApiRequestError ? e.message : "Couldn't raise issue"),
  });

  return { create };
}

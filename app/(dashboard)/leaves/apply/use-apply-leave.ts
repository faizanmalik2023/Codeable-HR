"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { leavesApi, type LeaveApplyBody } from "@/lib/api/leaves";
import { qk } from "@/lib/query/keys";
import { ApiRequestError } from "@/lib/api/client";

/** Apply-leave hook — loads leave types and exposes the submit mutation. */
export function useApplyLeave() {
  const router = useRouter();
  const qc = useQueryClient();

  const types = useQuery({
    queryKey: qk.leaves.types,
    queryFn: () => leavesApi.types(),
  });

  const apply = useMutation({
    mutationFn: (body: LeaveApplyBody) => leavesApi.apply(body),
    onSuccess: () => {
      toast.success("Leave request submitted");
      qc.invalidateQueries({ queryKey: ["leaves"] });
      router.push("/leaves");
    },
    onError: (e) =>
      toast.error(e instanceof ApiRequestError ? e.message : "Couldn't submit leave request"),
  });

  return { types, apply };
}

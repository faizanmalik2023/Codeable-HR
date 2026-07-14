"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { claimsApi, type InsuranceCreateBody } from "@/lib/api/claims";
import { uploadFile } from "@/lib/api/uploads";
import { ApiRequestError } from "@/lib/api/client";

export interface InsuranceSubmitPayload {
  reason: string;
  amount: number;
  note: string;
  expense_date: string;
  file: File | null;
}

/** Submit hook — uploads the optional attachment, then creates the claim. */
export function useSubmitInsuranceClaim() {
  const router = useRouter();
  const qc = useQueryClient();

  const submit = useMutation({
    mutationFn: async ({ file, ...values }: InsuranceSubmitPayload) => {
      const body: InsuranceCreateBody = { ...values };
      if (file) {
        const { url } = await uploadFile(file, "attachments");
        body.attachment = url;
      }
      return claimsApi.insuranceCreate(body);
    },
    onSuccess: () => {
      toast.success("Claim submitted");
      qc.invalidateQueries({ queryKey: ["insurance-claims"] });
      router.push("/insurance-claims");
    },
    onError: (e) =>
      toast.error(e instanceof ApiRequestError ? e.message : "Couldn't submit claim"),
  });

  return { submit };
}

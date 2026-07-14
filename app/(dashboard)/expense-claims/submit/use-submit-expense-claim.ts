"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { claimsApi, type ExpenseCreateBody } from "@/lib/api/claims";
import { uploadFile } from "@/lib/api/uploads";
import { ApiRequestError } from "@/lib/api/client";

export interface ExpenseSubmitPayload {
  category: string;
  amount: number;
  description: string;
  expense_date: string;
  file: File | null;
}

/** Submit hook — uploads the optional receipt, then creates the expense claim. */
export function useSubmitExpenseClaim() {
  const router = useRouter();
  const qc = useQueryClient();

  const submit = useMutation({
    mutationFn: async ({ file, ...values }: ExpenseSubmitPayload) => {
      const body: ExpenseCreateBody = { ...values };
      if (file) {
        const { url } = await uploadFile(file, "attachments");
        body.attachment = url;
      }
      return claimsApi.expenseCreate(body);
    },
    onSuccess: () => {
      toast.success("Expense submitted");
      qc.invalidateQueries({ queryKey: ["expense-claims"] });
      router.push("/expense-claims");
    },
    onError: (e) =>
      toast.error(e instanceof ApiRequestError ? e.message : "Couldn't submit expense"),
  });

  return { submit };
}

"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  holidaysApi,
  holidayKeys,
  type CreateHolidayBody,
} from "@/lib/api/holidays";
import { uploadFile } from "@/lib/api/uploads";
import { ApiRequestError } from "@/lib/api/client";

export interface HolidaySubmitPayload {
  name: string;
  date: string;
  type: string;
  days: number;
  description?: string;
  file: File | null;
}

/** Create-holiday hook — uploads the optional image, then creates the holiday. */
export function useCreateHoliday() {
  const router = useRouter();
  const qc = useQueryClient();

  const submit = useMutation({
    mutationFn: async ({ file, ...values }: HolidaySubmitPayload) => {
      const body: CreateHolidayBody = { ...values };
      if (file) {
        const { url } = await uploadFile(file, "holidays");
        body.image = url;
      }
      return holidaysApi.create(body);
    },
    onSuccess: () => {
      toast.success("Holiday added");
      qc.invalidateQueries({ queryKey: holidayKeys.all });
      router.push("/all-holidays");
    },
    onError: (e) =>
      toast.error(
        e instanceof ApiRequestError ? e.message : "Couldn't add holiday"
      ),
  });

  return { submit };
}

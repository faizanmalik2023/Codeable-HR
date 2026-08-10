"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiRequestError } from "@/lib/api/client";
import {
  adminDonationsApi,
  adminDonationsKeys,
  type CreateDonationBody,
} from "@/lib/api/admin-donations";

const errMsg = (e: unknown, fallback: string) =>
  e instanceof ApiRequestError ? e.message : fallback;

/** The donation ledger + its pool summary, and the record/reverse mutations. */
export function useDonations() {
  const qc = useQueryClient();
  const [page, setPage] = React.useState(1);
  const [month, setMonth] = React.useState<string | undefined>(undefined);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: adminDonationsKeys.all });
  };

  const list = useQuery({
    queryKey: adminDonationsKeys.list(page, month),
    queryFn: () => adminDonationsApi.list({ page, month }),
  });

  const summary = useQuery({
    queryKey: adminDonationsKeys.summary(month),
    queryFn: () => adminDonationsApi.summary(month),
  });

  const create = useMutation({
    mutationFn: (body: CreateDonationBody) => adminDonationsApi.create(body),
    onSuccess: (d) => {
      toast.success(`Recorded ${d.to}`);
      invalidate();
    },
    onError: (e) => toast.error(errMsg(e, "Couldn't record the donation")),
  });

  const reverse = useMutation({
    mutationFn: (id: string) => adminDonationsApi.reverse(id),
    onSuccess: () => {
      toast.success("Donation reversed");
      invalidate();
    },
    onError: (e) => toast.error(errMsg(e, "Couldn't reverse the donation")),
  });

  return {
    page,
    setPage,
    month,
    setMonth,
    list,
    summary,
    create,
    reverse,
    items: list.data?.items ?? [],
    pagination: list.data?.pagination,
  };
}

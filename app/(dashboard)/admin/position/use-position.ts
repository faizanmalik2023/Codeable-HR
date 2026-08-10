"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiRequestError } from "@/lib/api/client";
import {
  adminPositionApi,
  adminPositionKeys,
  type Asset,
  type CashAccount,
  type Receivable,
  type ReceivableStage,
} from "@/lib/api/admin-position";

const errMsg = (e: unknown, fallback: string) =>
  e instanceof ApiRequestError ? e.message : fallback;

/**
 * The financial-position screen: the consolidated view plus the three registers
 * behind it (cash accounts, receivables/pipeline, assets).
 */
export function usePosition() {
  const qc = useQueryClient();
  const [pipelineMonths, setPipelineMonths] = React.useState(3);

  // Every write shifts the consolidated totals, so all of them invalidate the whole
  // namespace rather than trying to be surgical about which panel moved.
  const onDone = (message: string) => ({
    onSuccess: () => {
      toast.success(message);
      qc.invalidateQueries({ queryKey: adminPositionKeys.all });
    },
  });

  const position = useQuery({
    queryKey: adminPositionKeys.position(pipelineMonths),
    queryFn: () => adminPositionApi.position(pipelineMonths),
  });

  const accounts = useQuery({
    queryKey: adminPositionKeys.accounts(),
    queryFn: () => adminPositionApi.accounts(),
  });

  const receivables = useQuery({
    queryKey: adminPositionKeys.receivables(1),
    queryFn: () => adminPositionApi.receivables({ limit: 100 }),
  });

  const assets = useQuery({
    queryKey: adminPositionKeys.assets(1),
    queryFn: () => adminPositionApi.assets({ limit: 100 }),
  });

  const saveAccount = useMutation({
    mutationFn: ({ id, ...body }: Partial<CashAccount> & { name: string; id?: string }) =>
      id
        ? adminPositionApi.updateAccount(id, body)
        : adminPositionApi.createAccount(body as Partial<CashAccount> & { name: string }),
    ...onDone("Account saved"),
    onError: (e) => toast.error(errMsg(e, "Couldn't save the account")),
  });

  const deleteAccount = useMutation({
    mutationFn: (id: string) => adminPositionApi.deleteAccount(id),
    ...onDone("Account removed"),
    onError: (e) => toast.error(errMsg(e, "Couldn't remove the account")),
  });

  // Create and update share a mutation, like saveAccount: the modal is the same form
  // either way, and confirming an existing retainer is the whole point of editing.
  const saveReceivable = useMutation({
    mutationFn: ({
      id,
      ...body
    }: Partial<Receivable> & { name: string; stage: ReceivableStage; id?: string }) =>
      id
        ? adminPositionApi.updateReceivable(id, body)
        : adminPositionApi.createReceivable(body),
    ...onDone("Saved"),
    onError: (e) => toast.error(errMsg(e, "Couldn't save it")),
  });

  const settleReceivable = useMutation({
    mutationFn: (id: string) => adminPositionApi.settleReceivable(id),
    // Settling only closes the forecast row — the money still has to be booked as
    // income separately, which is why the toast says so rather than implying it's done.
    ...onDone("Marked as received — book the income entry too"),
    onError: (e) => toast.error(errMsg(e, "Couldn't mark it received")),
  });

  const deleteReceivable = useMutation({
    mutationFn: (id: string) => adminPositionApi.deleteReceivable(id),
    ...onDone("Removed"),
    onError: (e) => toast.error(errMsg(e, "Couldn't remove it")),
  });

  const createAsset = useMutation({
    mutationFn: (body: Partial<Asset> & { name: string; value: number }) =>
      adminPositionApi.createAsset(body),
    ...onDone("Asset added"),
    onError: (e) => toast.error(errMsg(e, "Couldn't add the asset")),
  });

  const updateAsset = useMutation({
    mutationFn: ({ id, ...body }: Partial<Asset> & { id: string }) =>
      adminPositionApi.updateAsset(id, body),
    ...onDone("Asset updated"),
    onError: (e) => toast.error(errMsg(e, "Couldn't update the asset")),
  });

  const deleteAsset = useMutation({
    mutationFn: (id: string) => adminPositionApi.deleteAsset(id),
    ...onDone("Asset removed"),
    onError: (e) => toast.error(errMsg(e, "Couldn't remove the asset")),
  });

  return {
    pipelineMonths,
    setPipelineMonths,
    position,
    accounts,
    receivables,
    assets,
    saveAccount,
    deleteAccount,
    saveReceivable,
    settleReceivable,
    deleteReceivable,
    createAsset,
    updateAsset,
    deleteAsset,
  };
}

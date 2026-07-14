"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { adminTreasuryApi, adminTreasuryKeys } from "@/lib/api/admin-treasury";
import { toWireDate } from "@/lib/format";

/**
 * Finance report hook — a from/to date range that drives the P&L + cash-flow
 * report. Both bounds are optional (server defaults to all-time).
 */
export function useReport() {
  const [from, setFrom] = React.useState<Date | null>(null);
  const [to, setTo] = React.useState<Date | null>(null);

  const fromWire = from ? toWireDate(from) : undefined;
  const toWire = to ? toWireDate(to) : undefined;

  const query = useQuery({
    queryKey: adminTreasuryKeys.report(fromWire, toWire),
    queryFn: () => adminTreasuryApi.report({ from: fromWire, to: toWire }),
    placeholderData: (prev) => prev,
  });

  return { from, to, setFrom, setTo, query };
}

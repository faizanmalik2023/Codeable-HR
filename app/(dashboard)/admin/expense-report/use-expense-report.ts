"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { adminExpensesApi, aeKeys } from "@/lib/api/admin-expenses";
import { toWireDate } from "@/lib/format";

function startOfMonth(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** Date-range financial report for company expenses. */
export function useExpenseReport() {
  const [from, setFrom] = React.useState<Date | null>(startOfMonth());
  const [to, setTo] = React.useState<Date | null>(new Date());

  const fromWire = from ? toWireDate(from) : "";
  const toWire = to ? toWireDate(to) : "";
  const enabled = !!fromWire && !!toWire;

  const query = useQuery({
    queryKey: aeKeys.report(fromWire, toWire),
    queryFn: () => adminExpensesApi.report({ from: fromWire, to: toWire }),
    enabled,
    placeholderData: (prev) => prev,
  });

  return { from, to, setFrom, setTo, enabled, query, report: query.data };
}

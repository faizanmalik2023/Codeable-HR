"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  adminForecastApi,
  adminForecastKeys,
  type ForecastScenario,
} from "@/lib/api/admin-forecast";

const HORIZONS = [3, 6, 12] as const;

/** The forward projection, plus the window and scenario the screen is showing. */
export function useForecast() {
  const [months, setMonths] = React.useState<number>(6);
  const [scenario, setScenario] = React.useState<ForecastScenario>("committed");

  const forecast = useQuery({
    queryKey: adminForecastKeys.forecast(months),
    queryFn: () => adminForecastApi.get(months),
    // The projection moves only when the underlying config does, so don't refetch
    // it on every window focus — it makes the numbers look jittery.
    staleTime: 60_000,
  });

  const rows = forecast.data?.monthly ?? [];

  // Read the scenario's figures off each row without every consumer re-deriving
  // the key names.
  const pick = React.useCallback(
    (row: (typeof rows)[number]) =>
      scenario === "committed"
        ? { inflow: row.inflow_committed, net: row.net_profit_committed, cash: row.closing_cash_committed }
        : { inflow: row.inflow_expected, net: row.net_profit_expected, cash: row.closing_cash_expected },
    [scenario]
  );

  return { months, setMonths, scenario, setScenario, forecast, rows, pick, HORIZONS };
}

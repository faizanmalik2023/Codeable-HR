"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiRequestError } from "@/lib/api/client";
import {
  adminIncrementsApi,
  adminIncrementsKeys,
  nearestCycleMonth,
  type IncrementRow,
} from "@/lib/api/admin-increments";

const errMsg = (e: unknown, fallback: string) =>
  e instanceof ApiRequestError ? e.message : fallback;

/**
 * The increment-cycle review screen.
 *
 * Percentages are held locally, seeded from the server's proposed midpoints, and
 * only the rows the director has ticked are ever submitted. The server re-validates
 * every one against that person's band, so nothing here is load-bearing for
 * correctness — it just keeps the editing responsive.
 */
export function useIncrements() {
  const qc = useQueryClient();
  const [month, setMonth] = React.useState(() => nearestCycleMonth());
  const [percents, setPercents] = React.useState<Record<string, number>>({});
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  const cycle = useQuery({
    queryKey: adminIncrementsKeys.cycle(month),
    queryFn: () => adminIncrementsApi.preview(month),
  });

  // Re-seed whenever a new cycle loads: every eligible row starts at its proposed
  // midpoint and ticked, which is the common case (approve as proposed).
  const eligible = React.useMemo(() => cycle.data?.eligible ?? [], [cycle.data]);
  React.useEffect(() => {
    setPercents(
      Object.fromEntries(eligible.map((r) => [r.user_id, r.proposed_percent ?? r.band.min]))
    );
    setSelected(new Set(eligible.map((r) => r.user_id)));
  }, [eligible]);

  const setPercent = (userId: string, value: number) =>
    setPercents((prev) => ({ ...prev, [userId]: value }));

  const toggle = (userId: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });

  const toggleAll = () =>
    setSelected((prev) =>
      prev.size === eligible.length ? new Set() : new Set(eligible.map((r) => r.user_id))
    );

  /** A row's figure is only valid inside ITS band — part-timers get half. */
  const outOfBand = (row: IncrementRow) => {
    const p = percents[row.user_id];
    return p == null || p < row.band.min || p > row.band.max;
  };

  const invalidRows = eligible.filter((r) => selected.has(r.user_id) && outOfBand(r));

  const projectedCost = eligible
    .filter((r) => selected.has(r.user_id) && !outOfBand(r))
    .reduce((sum, r) => {
      const basic = r.current_basic_salary ?? 0;
      return sum + basic * ((percents[r.user_id] ?? 0) / 100);
    }, 0);

  const apply = useMutation({
    mutationFn: () =>
      adminIncrementsApi.apply({
        month,
        items: eligible
          .filter((r) => selected.has(r.user_id))
          .map((r) => ({ user_id: r.user_id, percent: percents[r.user_id] })),
      }),
    onSuccess: (res) => {
      toast.success(
        `${res.applied_count} increment${res.applied_count === 1 ? "" : "s"} applied`
      );
      qc.invalidateQueries({ queryKey: adminIncrementsKeys.all });
    },
    onError: (e) => toast.error(errMsg(e, "Couldn't apply the increments")),
  });

  return {
    month,
    setMonth,
    cycle,
    eligible,
    notEligible: cycle.data?.not_eligible ?? [],
    percents,
    setPercent,
    selected,
    toggle,
    toggleAll,
    outOfBand,
    invalidRows,
    projectedCost,
    apply,
  };
}

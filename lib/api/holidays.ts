import { api } from "@/lib/api/client";
import type { HolidayType } from "@/lib/enums";

/* ------------------------------------------------------------------ */
/* Local model interfaces (types/index.ts is off-limits here)          */
/* ------------------------------------------------------------------ */

/** A company holiday entry. */
export interface Holiday {
  id: string;
  name: string;
  type: HolidayType | string;
  date: string;
  /** Duration in days (>= 1). */
  days: number;
  image?: string | null;
  description?: string | null;
  /** Server may flag past holidays; otherwise derive from `date`. */
  isPast?: boolean;
}

/** `GET /holidays` — accepts a bare array or an `{ items }` envelope. */
export type HolidayListResponse = Holiday[] | { items: Holiday[] };

/* ------------------------------------------------------------------ */
/* Request bodies                                                      */
/* ------------------------------------------------------------------ */

export interface CreateHolidayBody {
  name: string;
  date: string;
  type: HolidayType | string;
  days: number;
  image?: string;
  description?: string;
}

/* ------------------------------------------------------------------ */
/* API surface                                                         */
/* ------------------------------------------------------------------ */

export const holidaysApi = {
  list: () => api.get<HolidayListResponse>("/holidays"),

  create: (body: CreateHolidayBody) => api.post<Holiday>("/holidays", body),
};

/** Normalise a list/`{ items }` response into a plain array. */
export function toHolidays(
  res: HolidayListResponse | null | undefined
): Holiday[] {
  if (!res) return [];
  return Array.isArray(res) ? res : res.items ?? [];
}

/* ------------------------------------------------------------------ */
/* Local query keys (keys.ts is off-limits for this feature)           */
/* ------------------------------------------------------------------ */

export const holidayKeys = {
  all: ["holidays"] as const,
  list: () => ["holidays", "list"] as const,
};

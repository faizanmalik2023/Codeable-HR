/** Money, date, and relative-time formatting helpers (see spec §3.5–3.6). */

import { CURRENCY_SYMBOL, type ExpenseCurrency } from "@/lib/enums";

/** Group thousands; keep 2 decimals only when fractional. `5600.5 → "5,600.50"`. */
export function formatAmount(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number(value.replace(/,/g, "")) : value ?? 0;
  if (!Number.isFinite(n)) return "0";
  const hasFraction = Math.round(n * 100) % 100 !== 0;
  return n.toLocaleString("en-US", {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  });
}

export function formatMoney(
  value: number | string | null | undefined,
  currency: ExpenseCurrency = "PKR"
): string {
  return `${CURRENCY_SYMBOL[currency]}${formatAmount(value)}`;
}

/** Compact money: `100k`, `5.6M`, `3B`. */
export function formatCompact(value: number | null | undefined): string {
  const n = value ?? 0;
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${(n / 1e9).toFixed(1).replace(/\.0$/, "")}B`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(1).replace(/\.0$/, "")}M`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

/** Strip commas from a grouped numeric input. */
export const parseAmount = (v: string): number => Number(v.replace(/,/g, "")) || 0;

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const ordinal = (d: number): string => {
  const s = ["th", "st", "nd", "rd"];
  const v = d % 100;
  return d + (s[(v - 20) % 10] || s[v] || s[0]);
};

/** "7th June 2026" */
export function formatOrdinalDate(input: string | Date | null | undefined): string {
  if (!input) return "—";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "—";
  return `${ordinal(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** "25th — 28th June 2026" (collapses shared month/year). */
export function formatDateRange(from?: string | null, to?: string | null): string {
  if (!from) return "—";
  if (!to || from === to) return formatOrdinalDate(from);
  const a = new Date(from);
  const b = new Date(to);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return formatOrdinalDate(from);
  if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear())
    return `${ordinal(a.getDate())} — ${ordinal(b.getDate())} ${MONTHS[a.getMonth()]} ${a.getFullYear()}`;
  return `${formatOrdinalDate(from)} — ${formatOrdinalDate(to)}`;
}

/** Wire date `YYYY-MM-DD`. */
export function toWireDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/** Wire month key `YYYY-MM`. */
export function toWireMonth(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** "5m ago" / "2d ago"; prefers a server-supplied `time_ago`. */
export function timeAgo(input: string | Date | null | undefined, serverValue?: string): string {
  if (serverValue) return serverValue;
  if (!input) return "";
  const d = new Date(input);
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return formatOrdinalDate(d);
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

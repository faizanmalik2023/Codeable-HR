"use client";

import * as React from "react";
import { CURRENCY_SYMBOL } from "@/lib/enums";
import { Input } from "@/components/ui/input";

/** Group thousands while preserving an in-progress decimal (e.g. "12,345.6"). */
export function groupAmount(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, "");
  const firstDot = cleaned.indexOf(".");
  let intPart = firstDot === -1 ? cleaned : cleaned.slice(0, firstDot);
  const decPart = firstDot === -1 ? "" : cleaned.slice(firstDot + 1).replace(/\./g, "");
  intPart = intPart.replace(/^0+(?=\d)/, "");
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (firstDot === -1) return grouped;
  return `${grouped || "0"}.${decPart.slice(0, 2)}`;
}

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
}

/** PKR amount input — shows the ₨ prefix and grouups thousands as you type. */
export function AmountInput({ value, onChange, error, disabled, placeholder = "0" }: AmountInputProps) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-foreground-muted">
        {CURRENCY_SYMBOL.PKR}
      </span>
      <Input
        inputMode="decimal"
        className="h-11 pl-8 text-base"
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(groupAmount(e.target.value))}
        error={error}
      />
    </div>
  );
}

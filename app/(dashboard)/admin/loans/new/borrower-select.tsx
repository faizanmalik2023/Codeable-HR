"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, Search } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface BorrowerOption {
  value: string;
  label: string;
  description?: string;
  avatar?: string;
}

interface BorrowerSelectProps {
  value?: string;
  onChange?: (value: string) => void;
  options: BorrowerOption[];
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

/**
 * Searchable borrower picker — themed popover with a search field and avatar
 * rows. Mirrors the design-system Select (no native control).
 */
export function BorrowerSelect({
  value,
  onChange,
  options,
  placeholder = "Select an employee",
  error,
  disabled,
  loading,
  className,
}: BorrowerSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);

  React.useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      setSearch("");
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.description?.toLowerCase().includes(q)
    );
  }, [options, search]);

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen((v) => !v)}
        disabled={disabled}
        className={cn(
          "flex h-11 w-full items-center justify-between rounded-xl border bg-transparent px-4 text-left",
          "transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary",
          "disabled:cursor-not-allowed disabled:opacity-50",
          isOpen ? "border-primary ring-2 ring-ring/20" : "border-input",
          error && "border-destructive"
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {selected ? (
          <span className="flex min-w-0 items-center gap-2.5">
            <Avatar src={selected.avatar} name={selected.label} size="xs" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-foreground">
                {selected.label}
              </span>
              {selected.description && (
                <span className="block truncate text-xs text-foreground-muted">
                  {selected.description}
                </span>
              )}
            </span>
          </span>
        ) : (
          <span className="truncate text-foreground-subtle">
            {loading ? "Loading employees…" : placeholder}
          </span>
        )}
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-foreground-muted transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-2 w-full rounded-xl border border-border bg-card p-1.5 shadow-lg"
          >
            <div className="flex items-center gap-2 rounded-lg border border-input px-3">
              <Search className="h-4 w-4 text-foreground-muted" />
              <input
                ref={inputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or code…"
                className="h-9 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-foreground-subtle"
              />
            </div>

            <ul className="mt-1.5 max-h-60 overflow-auto" role="listbox">
              {filtered.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-foreground-muted">
                  No employees found
                </li>
              ) : (
                filtered.map((option) => {
                  const active = option.value === value;
                  return (
                    <li
                      key={option.value}
                      role="option"
                      aria-selected={active}
                      onClick={() => {
                        onChange?.(option.value);
                        setIsOpen(false);
                      }}
                      className={cn(
                        "flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-2 transition-colors",
                        "hover:bg-secondary",
                        active && "bg-primary-muted"
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        <Avatar src={option.avatar} name={option.label} size="xs" />
                        <span className="min-w-0">
                          <span
                            className={cn(
                              "block truncate text-sm font-medium",
                              active ? "text-primary" : "text-foreground"
                            )}
                          >
                            {option.label}
                          </span>
                          {option.description && (
                            <span className="block truncate text-xs text-foreground-muted">
                              {option.description}
                            </span>
                          )}
                        </span>
                      </span>
                      {active && <Check className="h-4 w-4 shrink-0 text-primary" />}
                    </li>
                  );
                })
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}

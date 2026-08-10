"use client";

import * as React from "react";
import { ChevronDown, Check, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

interface SelectProps {
  value?: string;
  onChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

/** Above this many options, scrolling the list is slower than typing — show a filter. */
const SEARCH_THRESHOLD = 8;

export function Select({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  label,
  error,
  disabled,
  className,
}: SelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
  const [query, setQuery] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const searchable = options.length > SEARCH_THRESHOLD;

  // Everything below indexes `visible`, never `options` — otherwise arrow keys and
  // Enter would act on rows the filter has hidden.
  const visible = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) || (o.description ?? "").toLowerCase().includes(q)
    );
  }, [options, query]);

  // Close on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Each open starts clean: no stale filter, nothing pre-highlighted.
  React.useEffect(() => {
    if (!isOpen) return;
    setQuery("");
    setHighlightedIndex(-1);
    if (searchable) searchRef.current?.focus();
  }, [isOpen, searchable]);

  const commit = (index: number) => {
    const option = visible[index];
    if (!option) return;
    onChange?.(option.value);
    setIsOpen(false);
  };

  // Shared by the trigger and the search box, so arrows/Enter keep working once
  // focus moves into the filter input.
  const handleNavKeys = (e: React.KeyboardEvent) => {
    if (disabled) return false;
    switch (e.key) {
      case "Enter":
        e.preventDefault();
        if (isOpen && highlightedIndex >= 0) commit(highlightedIndex);
        else setIsOpen(!isOpen);
        return true;
      case "ArrowDown":
        e.preventDefault();
        if (!isOpen) setIsOpen(true);
        else setHighlightedIndex((prev) => (prev < visible.length - 1 ? prev + 1 : 0));
        return true;
      case "ArrowUp":
        e.preventDefault();
        if (!isOpen) setIsOpen(true);
        else setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : visible.length - 1));
        return true;
      case "Escape":
        setIsOpen(false);
        return true;
      default:
        return false;
    }
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (handleNavKeys(e)) return;
    if (e.key === " ") {
      e.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-foreground mb-2">
          {label}
        </label>
      )}
      <button
        type="button"
        className={cn(
          "flex h-11 w-full items-center justify-between rounded-[var(--radius)] border border-transparent bg-background-secondary px-4 text-left",
          "transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          isOpen && "ring-2 ring-ring bg-card",
          error && "ring-2 ring-destructive"
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleTriggerKeyDown}
        disabled={disabled}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className={cn(
          "truncate",
          selectedOption ? "text-foreground" : "text-foreground-subtle"
        )}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-foreground-muted transition-transform duration-200",
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
            {searchable && (
              <div className="relative mb-1.5">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground-muted" />
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setHighlightedIndex(-1);
                  }}
                  onKeyDown={handleNavKeys}
                  placeholder="Search…"
                  aria-label="Search options"
                  className="h-9 w-full rounded-lg bg-background-secondary pl-9 pr-3 text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            )}

            <ul ref={listRef} className="max-h-60 overflow-auto" role="listbox">
              {visible.map((option, index) => (
                <li
                  key={option.value}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2.5 cursor-pointer",
                    "transition-colors duration-100",
                    highlightedIndex === index && "bg-secondary",
                    value === option.value && "bg-primary-muted"
                  )}
                  onClick={() => commit(index)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  role="option"
                  aria-selected={value === option.value}
                >
                  <div>
                    <p className={cn(
                      "text-sm font-medium",
                      value === option.value ? "text-primary" : "text-foreground"
                    )}>
                      {option.label}
                    </p>
                    {option.description && (
                      <p className="text-xs text-foreground-muted mt-0.5">
                        {option.description}
                      </p>
                    )}
                  </div>
                  {value === option.value && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </li>
              ))}
              {!visible.length && (
                <li className="px-3 py-2.5 text-sm text-foreground-muted">No matches</li>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <p className="mt-2 text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}

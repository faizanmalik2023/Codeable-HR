"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Search, CornerDownLeft, Clock, X, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import {
  searchCommands,
  visibleCommands,
  commandById,
  type Command,
} from "@/lib/command-registry";

const RECENTS_KEY = "codeable:recent-commands";
const RECENTS_MAX = 6;

function loadRecents(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENTS_KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(arr) ? (arr.filter((x) => typeof x === "string") as string[]) : [];
  } catch {
    return [];
  }
}

function saveRecent(id: string) {
  if (typeof window === "undefined") return;
  const next = [id, ...loadRecents().filter((x) => x !== id)].slice(0, RECENTS_MAX);
  try {
    window.localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
  } catch {
    /* storage full / disabled — non-fatal */
  }
}

interface Section {
  label: string;
  commands: Command[];
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const [recentIds, setRecentIds] = React.useState<string[]>([]);
  const [mounted, setMounted] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Portal target only exists on the client.
  React.useEffect(() => setMounted(true), []);

  // Reset + focus whenever the palette opens; refresh recents from storage.
  React.useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      setRecentIds(loadRecents());
      const t = setTimeout(() => inputRef.current?.focus(), 20);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Lock body scroll while open.
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Build the sections + a flat list (display order) for keyboard navigation.
  const { sections, flat } = React.useMemo(() => {
    const q = query.trim();
    if (q) {
      const results = searchCommands(q, user);
      return {
        sections: results.length ? [{ label: "Results", commands: results }] : [],
        flat: results,
      };
    }
    // Empty query: recent (resolved + still-visible) then the full grouped list.
    const visible = visibleCommands(user);
    const visibleIds = new Set(visible.map((c) => c.id));
    const recent = recentIds
      .filter((id) => visibleIds.has(id))
      .map((id) => commandById(id))
      .filter((c): c is Command => Boolean(c));

    const secs: Section[] = [];
    if (recent.length) secs.push({ label: "Recent", commands: recent });

    const byGroup = new Map<string, Command[]>();
    for (const c of visible) {
      const list = byGroup.get(c.group) ?? [];
      list.push(c);
      byGroup.set(c.group, list);
    }
    for (const [label, cmds] of byGroup) secs.push({ label, commands: cmds });

    return { sections: secs, flat: secs.flatMap((s) => s.commands) };
  }, [query, user, recentIds]);

  // Keep active index in range as the list changes.
  React.useEffect(() => {
    setActive((a) => Math.min(a, Math.max(0, flat.length - 1)));
  }, [flat.length]);

  const select = React.useCallback(
    (cmd: Command | undefined) => {
      if (!cmd) return;
      saveRecent(cmd.id);
      onOpenChange(false);
      router.push(cmd.href);
    },
    [onOpenChange, router]
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (flat.length ? (a + 1) % flat.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (flat.length ? (a - 1 + flat.length) % flat.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      select(flat[active]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onOpenChange(false);
    }
  };

  // Scroll the active row into view.
  React.useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-cmd-index="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  // Flat index bookkeeping so grouped rendering can map to the nav index.
  let flatIndex = -1;

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[12vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Backdrop — dark scrim that blurs + darkens the page behind the palette */}
          <div
            className="absolute inset-0 bg-[hsl(243_50%_4%/0.68)] backdrop-blur-md"
            onClick={() => onOpenChange(false)}
          />

          {/* Panel */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Search the platform"
            className="relative w-full max-w-xl overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card shadow-[var(--shadow-lg)]"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            onKeyDown={onKeyDown}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 border-b border-border px-4">
              <Search className="h-5 w-5 shrink-0 text-foreground-muted" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                placeholder="Search pages and actions…"
                className="h-14 w-full bg-transparent text-base text-foreground placeholder:text-foreground-subtle focus:outline-none"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-md p-1 text-foreground-subtle hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-2">
              {flat.length === 0 ? (
                <div className="px-3 py-10 text-center text-sm text-foreground-muted">
                  No matches for &ldquo;{query.trim()}&rdquo;.
                </div>
              ) : (
                sections.map((section) => (
                  <div key={section.label} className="mb-1">
                    <div className="flex items-center gap-1.5 px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-foreground-subtle">
                      {section.label === "Recent" && <Clock className="h-3 w-3" />}
                      {section.label}
                    </div>
                    {section.commands.map((cmd) => {
                      flatIndex += 1;
                      const idx = flatIndex;
                      const isActive = idx === active;
                      const Icon = cmd.icon;
                      return (
                        <button
                          key={cmd.id}
                          type="button"
                          data-cmd-index={idx}
                          onClick={() => select(cmd)}
                          onMouseMove={() => setActive(idx)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-left transition-colors",
                            isActive ? "bg-primary-muted" : "hover:bg-secondary/60"
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                              isActive ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground-muted"
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-foreground">
                              {cmd.label}
                            </span>
                            {cmd.hint && (
                              <span className="block truncate text-xs text-foreground-muted">
                                {cmd.hint}
                              </span>
                            )}
                          </span>
                          {!cmd.hint && (
                            <span className="shrink-0 text-xs text-foreground-subtle">{cmd.group}</span>
                          )}
                          {isActive && (
                            <CornerDownLeft className="h-4 w-4 shrink-0 text-foreground-subtle" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer hint */}
            <div className="flex items-center justify-between border-t border-border px-4 py-2 text-[11px] text-foreground-subtle">
              <span className="flex items-center gap-2">
                <kbd className="inline-flex items-center gap-0.5 rounded border border-border bg-secondary px-1.5 py-0.5">
                  <ArrowUp className="h-3 w-3" />
                  <ArrowDown className="h-3 w-3" />
                </kbd>
                to navigate
                <kbd className="inline-flex items-center gap-0.5 rounded border border-border bg-secondary px-1.5 py-0.5">
                  <CornerDownLeft className="h-3 w-3" />
                </kbd>
                to open
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-border bg-secondary px-1.5 py-0.5">esc</kbd>
                to close
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

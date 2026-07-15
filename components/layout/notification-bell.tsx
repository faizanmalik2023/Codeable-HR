"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CheckCheck, ArrowRight } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "@/lib/api/notifications";
import { notificationVisual, routeForNotification } from "@/lib/notifications-nav";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { SkeletonList } from "@/components/ui/skeleton";
import type { NotificationModel } from "@/types";

export function NotificationBell() {
  const router = useRouter();
  const qc = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);

  const unreadQuery = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => notificationsApi.unreadCount(),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
  const unread = unreadQuery.data?.count ?? 0;

  const recentQuery = useQuery({
    queryKey: ["notifications", "bell", "recent"],
    queryFn: () => notificationsApi.list({ page: 1, limit: 8 }),
    enabled: open,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const markAllRead = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  // Close on outside click / Escape.
  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const items = recentQuery.data?.items ?? [];

  const handleItem = (n: NotificationModel) => {
    if (!n.is_read) markRead.mutate(n.id);
    const route = routeForNotification(n);
    setOpen(false);
    if (route) router.push(route);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-foreground-muted transition-colors hover:bg-secondary hover:text-foreground"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Notifications"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-full z-50 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card shadow-[var(--shadow-lg)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground">Notifications</p>
                {unread > 0 && (
                  <span className="rounded-full bg-primary-muted px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                    {unread} new
                  </span>
                )}
              </div>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={() => markAllRead.mutate()}
                  disabled={markAllRead.isPending}
                  className="flex items-center gap-1 text-xs font-medium text-primary hover:underline disabled:opacity-50"
                >
                  <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[60vh] overflow-y-auto">
              {recentQuery.isLoading ? (
                <div className="p-3">
                  <SkeletonList items={4} />
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                  <Bell className="h-8 w-8 text-foreground-subtle" />
                  <p className="text-sm text-foreground-muted">You&apos;re all caught up.</p>
                </div>
              ) : (
                items.map((n) => {
                  const { icon: Icon, className } = notificationVisual(String(n.category));
                  const actionable = Boolean(routeForNotification(n));
                  const unreadRow = !n.is_read;
                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => handleItem(n)}
                      className={cn(
                        "flex w-full items-start gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-secondary/50",
                        unreadRow && "bg-primary-muted/25"
                      )}
                    >
                      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", className)}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate text-sm font-medium text-foreground">{n.title}</span>
                          {unreadRow && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                        </span>
                        {n.body && (
                          <span className="mt-0.5 line-clamp-2 block text-xs text-foreground-muted">{n.body}</span>
                        )}
                        <span className="mt-1 flex items-center gap-2 text-[11px] text-foreground-subtle">
                          {timeAgo(n.created_at, n.time_ago)}
                          {actionable && (
                            <span className="inline-flex items-center gap-0.5 text-primary">
                              Open <ArrowRight className="h-3 w-3" />
                            </span>
                          )}
                        </span>
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                router.push("/notifications");
              }}
              className="flex w-full items-center justify-center gap-1 border-t border-border px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-secondary/50"
            >
              View all notifications
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

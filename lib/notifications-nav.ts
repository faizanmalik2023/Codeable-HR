/**
 * Shared notification presentation + deep-linking, used by both the full
 * Notifications page and the topbar notification bell.
 */
import {
  Bell,
  CalendarCheck,
  FileCheck2,
  FileText,
  MessageSquare,
  Receipt,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { NotificationModel } from "@/types";

/** Notification category → icon + tinted chip classes. */
export function notificationVisual(category: string): { icon: LucideIcon; className: string } {
  const c = (category ?? "").toLowerCase();
  if (c.includes("leave")) return { icon: CalendarCheck, className: "bg-success-muted text-success" };
  if (c.includes("eod")) return { icon: FileText, className: "bg-primary-muted text-primary" };
  if (c.includes("payslip") || c.includes("salary"))
    return { icon: Wallet, className: "bg-success-muted text-success" };
  if (c.includes("claim")) return { icon: FileCheck2, className: "bg-warning-muted text-warning" };
  if (c.includes("expense")) return { icon: Receipt, className: "bg-warning-muted text-warning" };
  if (c.includes("ticket")) return { icon: MessageSquare, className: "bg-primary-muted text-primary" };
  if (c.includes("policy")) return { icon: FileCheck2, className: "bg-secondary text-foreground-muted" };
  return { icon: Bell, className: "bg-secondary text-foreground-muted" };
}

/** Deep-link map keyed by `notification.data.target`. */
export const TARGET_ROUTES: Record<string, string> = {
  leave: "/leaves",
  eod: "/eod-reports",
  claim: "/insurance-claims",
  expense: "/expense-claims",
  ticket: "/my-issues",
  policy: "/policies",
  holiday: "/all-holidays",
  payslip: "/salary-details",
  profile: "/profile",
  security: "/settings",
};

/** Resolve the page a notification should deep-link to, if any (else undefined). */
export function routeForNotification(n: NotificationModel): string | undefined {
  const target = n.data?.target;
  return target ? TARGET_ROUTES[target] : undefined;
}

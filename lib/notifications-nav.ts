/**
 * Shared notification presentation + deep-linking, used by both the full
 * Notifications page and the topbar notification bell.
 */
import {
  Bell,
  CalendarCheck,
  Clock,
  FileCheck2,
  FileText,
  MessageSquare,
  Receipt,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { hasRole, type UserRole } from "@/stores/auth-store";
import type { NotificationModel, UserModel } from "@/types";

/** Notification category → icon + tinted chip classes. */
export function notificationVisual(category: string): { icon: LucideIcon; className: string } {
  const c = (category ?? "").toLowerCase();
  if (c.includes("attendance")) return { icon: Clock, className: "bg-warning-muted text-warning" };
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

/** Deep-link map keyed by `notification.data.target` — the audience-neutral targets.
 *  Targets whose destination depends on WHO is looking (or on an entity id in `data`)
 *  are resolved by the type switch in `routeForNotification` instead. */
export const TARGET_ROUTES: Record<string, string> = {
  attendance_checkin: "/dashboard",
  attendance_checkout: "/time",
  attendance_review: "/hr/time/reviews",
  attendance_shortfall: "/time",
  attendance: "/time",
  leave: "/leaves",
  eod: "/eod-reports",
  claim: "/insurance-claims",
  expense: "/expense-claims",
  ticket: "/my-issues",
  policy: "/policies",
  announcement: "/notifications",
  payslip: "/salary-details",
  profile: "/profile",
  security: "/settings",
};

/** Last-resort map for legacy rows written before `data.target` existed — the
 *  coarse category still names the surface the notification is about. */
const CATEGORY_ROUTES: Record<string, string> = {
  leave: "/leaves",
  eod: "/eod-reports",
  payslip: "/salary-details",
  claim: "/insurance-claims",
  expense: "/expense-claims",
  ticket: "/my-issues",
  policy: "/policies",
  attendance: "/time",
  general: "/notifications",
};

const str = (v: unknown): string | undefined =>
  typeof v === "string" && v.length > 0 ? v : undefined;

/**
 * Resolve the page a notification should deep-link to, if any (else undefined).
 *
 * Resolution order: granular `type` (the same target can mean different pages for
 * different audiences — a leave REQUEST goes to the approval queue, a leave DECISION
 * to the employee's own history), then `data.target`, then the category fallback so
 * even legacy rows without a payload still land somewhere sensible.
 */
export function routeForNotification(
  n: NotificationModel,
  user?: UserModel | null
): string | undefined {
  const role = (user?.role ?? "employee") as UserRole;
  const isHr = hasRole(role, "hr");
  const isAdmin = role === "admin";
  const d = n.data ?? {};

  switch (n.type) {
    // Recipients are dept heads + the HR/admin pool — send each to THEIR queue.
    case "leave_requested":
      return isHr ? "/hr/leaves" : "/leaves/team";
    case "leave_approved":
    case "leave_rejected":
      return "/leaves/history";

    case "eod_reminder":
      return "/eod-reports/submit";
    // Recipients are the submitter's dept heads; land on that member's reports.
    case "eod_submitted": {
      const emp = str(d.employee_id);
      return emp ? `/eod-reports/team/${emp}` : "/eod-reports/team";
    }
    case "eod_acknowledged":
      return "/eod-reports";

    case "payroll_staged":
      return "/hr/payroll";

    // Owner-facing ticket events open the owner's copy of the thread.
    case "ticket_created":
    case "ticket_resolved": {
      const t = str(d.ticket_id);
      return t ? `/my-issues/${t}` : "/my-issues";
    }
    // A reply notifies the owner OR the HR assignee — same target, different inbox.
    case "ticket_replied": {
      const t = str(d.ticket_id);
      if (isHr) return t ? `/hr/issues/${t}` : "/hr/issues";
      return t ? `/my-issues/${t}` : "/my-issues";
    }

    case "policy_published": {
      const p = str(d.policy_id);
      return p ? `/policies/view?id=${encodeURIComponent(p)}` : "/policies";
    }
    // /all-holidays is admin-only; everyone else sees holidays on the dashboard.
    case "holiday_announced":
      return isAdmin ? "/all-holidays" : "/dashboard";

    // The check-in button lives on the dashboard (remote staff).
    case "attendance_checkin_reminder":
      return "/dashboard";
    case "attendance_review_requested":
      return "/hr/time/reviews";
    // A decision is news, not an action — show the day, don't open the correction.
    case "attendance_review_approved":
    case "attendance_review_rejected":
      return "/time";

    case "expense_amount_required":
      return "/admin/expenses";
    // The mapping screen is admin-only; for HR the row is informational.
    case "device_pin_unmapped":
      return isAdmin ? "/admin/devices/unmapped" : undefined;
  }

  const target = str(d.target);
  if (target) {
    // The forgotten-checkout nudge names the day it's about. Carry it through so the
    // attendance page can jump to that month and open the correction straight away.
    if (target === "attendance_checkout") {
      const date = str(d.date);
      return date ? `/time?adjust=${encodeURIComponent(date)}` : "/time";
    }
    const route = TARGET_ROUTES[target];
    if (route) return route;
  }

  return CATEGORY_ROUTES[String(n.category ?? "").toLowerCase()];
}

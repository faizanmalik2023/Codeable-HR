/**
 * Global command registry — the searchable index behind the topbar search /
 * command palette (⌘K). Every reachable page and sub-operation lives here so the
 * user can jump anywhere by name or synonym.
 *
 * Visibility mirrors the sidebar's role gating (roles / minRole / managerOnly),
 * so the palette only ever offers pages the user can actually open.
 */

import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertCircle,
  Award,
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  Calendar,
  CalendarPlus,
  ClipboardCheck,
  Clock,
  Coins,
  CreditCard,
  Fingerprint,
  FileBarChart,
  FileText,
  HandCoins,
  History,
  Landmark,
  LayoutDashboard,
  LayoutTemplate,
  Megaphone,
  MessageSquare,
  MessageSquarePlus,
  Palmtree,
  PieChart,
  PlusCircle,
  Receipt,
  ReceiptText,
  Settings,
  Shield,
  ShieldPlus,
  TrendingUp,
  User,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { hasRole, hasAnyRole, isManagerUser, type UserRole } from "@/stores/auth-store";
import type { UserModel } from "@/types";

export interface Command {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  /** Section heading in the palette. */
  group: string;
  /** Synonyms so e.g. "pto" or "time off" both find "Apply for leave". */
  keywords?: string[];
  /** Optional one-line hint shown under the label. */
  hint?: string;
  // Role gating (same semantics as the sidebar):
  roles?: UserRole[];
  minRole?: UserRole;
  managerOnly?: boolean;
}

export const commands: Command[] = [
  // ── Overview ─────────────────────────────────────────────
  { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, group: "Overview", keywords: ["home", "overview", "start"] },
  { id: "notifications", label: "Notifications", href: "/notifications", icon: Bell, group: "Overview", keywords: ["alerts", "inbox", "updates"] },
  { id: "recent-activity", label: "Recent activity", href: "/recent-activity", icon: Activity, group: "Overview", keywords: ["history", "feed", "timeline"] },

  // ── EOD ──────────────────────────────────────────────────
  { id: "eod-submit", label: "Submit EOD report", href: "/eod-reports/submit", icon: FileText, group: "EOD reports", keywords: ["eod", "end of day", "daily report", "log day", "new eod"], hint: "Log today's work" },
  { id: "eod-list", label: "My EOD reports", href: "/eod-reports", icon: FileText, group: "EOD reports", keywords: ["eod", "end of day", "reports", "history"] },
  { id: "eod-team", label: "Team EODs", href: "/eod-reports/team", icon: ClipboardCheck, group: "EOD reports", keywords: ["eod", "team", "reports", "reviews"], managerOnly: true },

  // ── Leaves ───────────────────────────────────────────────
  { id: "leave-apply", label: "Apply for leave", href: "/leaves/apply", icon: CalendarPlus, group: "Leaves", keywords: ["leave", "vacation", "time off", "pto", "absence", "holiday", "sick", "add leave", "request leave"], hint: "Request time off" },
  { id: "leave-list", label: "My leaves", href: "/leaves", icon: Calendar, group: "Leaves", keywords: ["leave", "balance", "quota", "time off"] },
  { id: "leave-history", label: "Leave history", href: "/leaves/history", icon: History, group: "Leaves", keywords: ["leave", "past", "history", "record"] },
  { id: "leave-team", label: "Team leaves", href: "/leaves/team", icon: UserCheck, group: "Leaves", keywords: ["leave", "team", "approve", "requests"], managerOnly: true },

  // ── Attendance ───────────────────────────────────────────
  { id: "attendance-me", label: "My attendance", href: "/time", icon: Clock, group: "Attendance", keywords: ["attendance", "time", "clock", "check in", "hours", "logs", "view attendance"], hint: "Your clock-ins & hours" },

  // ── Salary ───────────────────────────────────────────────
  { id: "salary", label: "View salary", href: "/salary-details", icon: Wallet, group: "Salary", keywords: ["salary", "pay", "payslip", "payslips", "compensation", "wage", "breakdown", "revisions", "slips"], hint: "Breakdown, slips & revisions" },

  // ── Claims ───────────────────────────────────────────────
  { id: "insurance-submit", label: "Submit insurance claim", href: "/insurance-claims/submit", icon: ShieldPlus, group: "Claims", keywords: ["insurance", "claim", "medical", "reimburse", "new claim"], hint: "New medical/insurance claim" },
  { id: "insurance-list", label: "Insurance claims", href: "/insurance-claims", icon: Shield, group: "Claims", keywords: ["insurance", "claims", "medical", "reimburse"] },
  { id: "expense-submit", label: "Submit expense claim", href: "/expense-claims/submit", icon: ReceiptText, group: "Claims", keywords: ["expense", "claim", "reimburse", "receipt", "new claim"], hint: "Claim a work expense" },
  { id: "expense-list", label: "Expense claims", href: "/expense-claims", icon: Receipt, group: "Claims", keywords: ["expense", "claims", "reimburse", "receipt"] },

  // ── Support ──────────────────────────────────────────────
  { id: "issue-new", label: "Raise an issue", href: "/my-issues/new", icon: MessageSquarePlus, group: "HR Help", keywords: ["hr help", "issue", "ticket", "complaint", "support", "ask hr", "new ticket"], hint: "Ask HR / report a problem" },
  { id: "issue-list", label: "My issues", href: "/my-issues", icon: MessageSquare, group: "HR Help", keywords: ["hr help", "issues", "tickets", "support"] },
  { id: "policies", label: "Company policies", href: "/policies", icon: BookOpen, group: "HR Help", keywords: ["policy", "policies", "handbook", "rules", "documents"] },

  // ── Organization (HR+) ───────────────────────────────────
  { id: "people", label: "People", href: "/people", icon: Users, group: "Organization", keywords: ["people", "employees", "staff", "directory", "team"], minRole: "hr" },
  { id: "people-add", label: "Add employee", href: "/people/add", icon: UserPlus, group: "Organization", keywords: ["add", "new employee", "onboard", "hire", "create employee"], minRole: "hr" },
  { id: "departments", label: "Departments", href: "/departments", icon: Building2, group: "Organization", keywords: ["department", "teams", "org", "structure", "managers"], minRole: "hr" },
  { id: "hr-leaves", label: "Leave requests", href: "/hr/leaves", icon: Calendar, group: "Organization", keywords: ["leave", "requests", "approve", "reject", "pending"], minRole: "hr" },
  { id: "hr-time", label: "Attendance logs", href: "/hr/time", icon: BarChart3, group: "Organization", keywords: ["attendance", "logs", "company", "hours", "timesheet"], minRole: "hr" },
  { id: "hr-projects", label: "Projects", href: "/hr/projects", icon: Award, group: "Organization", keywords: ["projects", "tasks", "milestones", "delivery"], minRole: "hr" },
  { id: "hr-issues", label: "HR issues", href: "/hr/issues", icon: AlertCircle, group: "Organization", keywords: ["issues", "tickets", "complaints", "support queue"], minRole: "hr" },
  { id: "hr-payroll", label: "Payroll", href: "/hr/payroll", icon: Wallet, group: "Organization", keywords: ["payroll", "payslips", "generate", "release", "salaries"], minRole: "hr" },
  { id: "hr-announcement", label: "Post announcement", href: "/hr/announcement", icon: Megaphone, group: "Organization", keywords: ["announcement", "broadcast", "notify", "notice"], minRole: "hr" },

  // ── Admin ────────────────────────────────────────────────
  { id: "promotions", label: "Promotions", href: "/admin/promotions", icon: TrendingUp, group: "Admin", keywords: ["promotion", "increment", "raise", "salary revision"], roles: ["admin"] },
  { id: "company-expenses", label: "Company expenses", href: "/admin/expenses", icon: CreditCard, group: "Admin", keywords: ["expenses", "company", "spend", "ledger", "costs"], roles: ["admin"] },
  { id: "expense-add", label: "Add company expense", href: "/admin/add-expense", icon: PlusCircle, group: "Admin", keywords: ["add expense", "new expense", "record spend"], roles: ["admin"] },
  { id: "expense-templates", label: "Expense templates", href: "/admin/expense-templates", icon: LayoutTemplate, group: "Admin", keywords: ["templates", "recurring", "expenses"], roles: ["admin"] },
  { id: "expense-analytics", label: "Expense analytics", href: "/admin/expense-analytics", icon: BarChart3, group: "Admin", keywords: ["analytics", "expenses", "trends", "insights"], roles: ["admin"] },
  { id: "expense-report", label: "Expense report", href: "/admin/expense-report", icon: FileBarChart, group: "Admin", keywords: ["report", "expenses", "pl", "summary"], roles: ["admin"] },
  { id: "project-income", label: "Project income", href: "/admin/project-income", icon: Coins, group: "Admin", keywords: ["income", "revenue", "projects", "earnings"], roles: ["admin"] },
  { id: "project-income-new", label: "Add project income", href: "/admin/project-income/new", icon: PlusCircle, group: "Admin", keywords: ["add income", "record income", "revenue"], roles: ["admin"] },
  { id: "loans", label: "Loans", href: "/admin/loans", icon: HandCoins, group: "Admin", keywords: ["loans", "advance", "borrow", "repayment"], roles: ["admin"] },
  { id: "loans-new", label: "New loan", href: "/admin/loans/new", icon: PlusCircle, group: "Admin", keywords: ["add loan", "issue loan", "advance"], roles: ["admin"] },
  { id: "treasury", label: "Treasury", href: "/admin/treasury", icon: Landmark, group: "Admin", keywords: ["treasury", "cash", "balance", "finance"], roles: ["admin"] },
  { id: "treasury-report", label: "Treasury report", href: "/admin/treasury/report", icon: FileBarChart, group: "Admin", keywords: ["treasury", "report", "pl", "cash flow"], roles: ["admin"] },
  { id: "equity", label: "Equity", href: "/admin/equity", icon: PieChart, group: "Admin", keywords: ["equity", "shares", "cap table", "distributions"], roles: ["admin"] },
  { id: "equity-beneficiaries", label: "Equity beneficiaries", href: "/admin/equity/beneficiaries", icon: Users, group: "Admin", keywords: ["equity", "beneficiaries", "shareholders"], roles: ["admin"] },
  { id: "equity-distributions", label: "Equity distributions", href: "/admin/equity/distributions", icon: Coins, group: "Admin", keywords: ["equity", "distributions", "payout", "dividend"], roles: ["admin"] },
  { id: "devices", label: "Devices", href: "/admin/devices", icon: Fingerprint, group: "Admin", keywords: ["devices", "biometric", "attendance machine", "zkteco"], roles: ["admin"] },
  { id: "holidays", label: "Holidays", href: "/all-holidays", icon: Palmtree, group: "Admin", keywords: ["holidays", "calendar", "public holidays"], roles: ["admin"] },

  // ── Account ──────────────────────────────────────────────
  { id: "profile", label: "My profile", href: "/profile", icon: User, group: "Account", keywords: ["profile", "me", "account", "personal"] },
  { id: "settings", label: "Settings", href: "/settings", icon: Settings, group: "Account", keywords: ["settings", "preferences", "language", "theme", "account"] },
];

/** Commands the given user is allowed to see (role-gated like the sidebar). */
export function visibleCommands(user: UserModel | null): Command[] {
  const role = (user?.role as UserRole) ?? "employee";
  const manager = isManagerUser(user);
  return commands.filter((c) => {
    if (c.managerOnly) return manager;
    if (c.roles) return hasAnyRole(role, c.roles);
    if (c.minRole) return hasRole(role, c.minRole);
    return true;
  });
}

function haystack(c: Command): string {
  return [c.label, c.group, c.hint ?? "", ...(c.keywords ?? [])].join(" ").toLowerCase();
}

/**
 * Rank the visible commands against a query. Every whitespace-separated term
 * must appear somewhere in the command's searchable text; exact/prefix label
 * matches rank highest. Empty query returns all visible commands (registry order).
 */
export function searchCommands(query: string, user: UserModel | null): Command[] {
  const list = visibleCommands(user);
  const q = query.trim().toLowerCase();
  if (!q) return list;
  const terms = q.split(/\s+/).filter(Boolean);
  return list
    .map((c) => ({ c, score: scoreCommand(c, terms, q) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.c);
}

function scoreCommand(c: Command, terms: string[], q: string): number {
  const label = c.label.toLowerCase();
  const hay = haystack(c);
  if (!terms.every((t) => hay.includes(t))) return 0;
  let score = 1;
  if (label === q) score += 100;
  else if (label.startsWith(q)) score += 60;
  else if (label.includes(q)) score += 30;
  if ((c.keywords ?? []).some((k) => k.toLowerCase() === q)) score += 40;
  if ((c.keywords ?? []).some((k) => k.toLowerCase().startsWith(q))) score += 15;
  return score;
}

export function commandById(id: string): Command | undefined {
  return commands.find((c) => c.id === id);
}

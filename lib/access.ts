/**
 * Route-level access control — the single source of truth for which roles may
 * open which pages. Mirrors the sidebar's nav gating so the visible nav and the
 * enforced routes never drift. The backend independently enforces access on every
 * request; this is the client-side redaction so users don't even see pages they
 * can't use.
 */
import { hasRole, hasAnyRole, isManagerUser, type UserRole } from "@/stores/auth-store";
import type { UserModel } from "@/types";

interface AccessRule {
  /** Route prefix this rule governs (matches the path or any sub-path). */
  prefix: string;
  roles?: UserRole[];
  minRole?: UserRole;
  managerOnly?: boolean;
}

/**
 * Longest-prefix wins, so `/leaves/team` (managerOnly) is checked before the
 * employee-level `/leaves`. Anything not listed here is employee-level (any
 * authenticated user).
 */
const RULES: AccessRule[] = [
  { prefix: "/admin", roles: ["admin"] },
  { prefix: "/all-holidays", roles: ["admin"] },
  { prefix: "/hr", minRole: "hr" },
  { prefix: "/people", minRole: "hr" },
  { prefix: "/departments", minRole: "hr" },
  { prefix: "/eod-reports/team", managerOnly: true },
  { prefix: "/leaves/team", managerOnly: true },
];

function ruleFor(pathname: string): AccessRule | undefined {
  return RULES.filter(
    (r) => pathname === r.prefix || pathname.startsWith(r.prefix + "/")
  ).sort((a, b) => b.prefix.length - a.prefix.length)[0];
}

/** Whether `user` may open `pathname`. Unknown/employee-level routes are allowed. */
export function canAccessRoute(pathname: string, user: UserModel | null): boolean {
  if (!user) return true; // auth flow handles the unauthenticated case
  const rule = ruleFor(pathname);
  if (!rule) return true;
  const role = (user.role ?? "employee") as UserRole;
  if (rule.managerOnly) return isManagerUser(user);
  if (rule.roles) return hasAnyRole(role, rule.roles);
  if (rule.minRole) return hasRole(role, rule.minRole);
  return true;
}

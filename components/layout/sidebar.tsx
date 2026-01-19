"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  FileText,
  Calendar,
  TrendingUp,
  AlertCircle,
  LayoutDashboard,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ClipboardCheck,
  UserCheck,
  Building2,
  Shield,
  BarChart3,
  Award,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuthStore, UserRole, hasRole, hasAnyRole } from "@/stores/auth-store";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  // Role requirements - item shows if user has any of these roles
  roles?: UserRole[];
  // Or require minimum role level
  minRole?: UserRole;
  // Section divider before this item
  divider?: string;
}

// Navigation items with role-based visibility
const navItems: NavItem[] = [
  // Everyone sees these
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "EOD Reports",
    href: "/eod-reports",
    icon: FileText,
  },
  {
    title: "Leaves",
    href: "/leaves",
    icon: Calendar,
  },
  {
    title: "Policies",
    href: "/policies",
    icon: BookOpen,
  },

  // Manager only - HR manages all personnel, not a specific team
  {
    title: "Team EODs",
    href: "/team/eods",
    icon: ClipboardCheck,
    roles: ["manager"],
    divider: "Team",
  },
  {
    title: "Leave Approvals",
    href: "/team/approvals",
    icon: UserCheck,
    roles: ["manager"],
  },

  // HR+ sees these
  {
    title: "People",
    href: "/people",
    icon: Users,
    minRole: "hr",
    divider: "Organization",
  },
  {
    title: "Leave Management",
    href: "/hr/leaves",
    icon: Calendar,
    minRole: "hr",
  },
  {
    title: "HR Issues",
    href: "/hr/issues",
    icon: AlertCircle,
    minRole: "hr",
  },
  {
    title: "Departments",
    href: "/departments",
    icon: Building2,
    minRole: "hr",
  },
  {
    title: "Promotions",
    href: "/hr/promotions",
    icon: Award,
    minRole: "hr",
  },
  {
    title: "Policy Library",
    href: "/hr/policies",
    icon: BookOpen,
    minRole: "hr",
  },

  // Admin only
  {
    title: "Admin",
    href: "/admin",
    icon: Shield,
    roles: ["admin"],
    divider: "System",
  },
];

const bottomNavItems: NavItem[] = [
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const userRole = user?.role || "employee";

  // Filter nav items based on user role
  const visibleNavItems = navItems.filter((item) => {
    if (item.roles) {
      return hasAnyRole(userRole, item.roles);
    }
    if (item.minRole) {
      return hasRole(userRole, item.minRole);
    }
    return true; // No role requirement, show to all
  });

  // Group items by divider
  const groupedItems: { divider?: string; items: NavItem[] }[] = [];
  let currentGroup: NavItem[] = [];

  visibleNavItems.forEach((item) => {
    if (item.divider) {
      if (currentGroup.length > 0) {
        groupedItems.push({ items: currentGroup });
      }
      currentGroup = [item];
    } else {
      currentGroup.push(item);
    }
  });
  if (currentGroup.length > 0) {
    groupedItems.push({
      divider: currentGroup[0]?.divider,
      items: currentGroup
    });
  }

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 72 : 240 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className={cn(
        "fixed left-0 top-0 z-40 h-screen flex flex-col",
        "bg-sidebar border-r border-sidebar-border"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="font-semibold text-sidebar-foreground"
              >
                CodeableHR
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {groupedItems.map((group, groupIndex) => (
          <div key={groupIndex} className={cn(groupIndex > 0 && "mt-4")}>
            {/* Section Divider */}
            {group.items[0]?.divider && !isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-3 py-2"
              >
                <span className="text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted">
                  {group.items[0].divider}
                </span>
              </motion.div>
            )}
            {group.items[0]?.divider && isCollapsed && (
              <div className="my-2 mx-3 border-t border-sidebar-border" />
            )}
            <ul className="space-y-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  isActive={pathname.startsWith(item.href)}
                  isCollapsed={isCollapsed}
                />
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom Navigation */}
      <div className="border-t border-sidebar-border py-4 px-3">
        <ul className="space-y-1">
          {bottomNavItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isActive={pathname.startsWith(item.href)}
              isCollapsed={isCollapsed}
            />
          ))}
        </ul>

        {/* Collapse Toggle */}
        <Button
          variant="ghost"
          size={isCollapsed ? "icon" : "default"}
          onClick={onToggle}
          className={cn(
            "mt-2 w-full text-sidebar-muted hover:text-sidebar-foreground",
            isCollapsed && "justify-center"
          )}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Collapse</span>
            </>
          )}
        </Button>
      </div>
    </motion.aside>
  );
}

interface NavLinkProps {
  item: NavItem;
  isActive: boolean;
  isCollapsed: boolean;
}

function NavLink({ item, isActive, isCollapsed }: NavLinkProps) {
  const Icon = item.icon;

  return (
    <li>
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-[var(--radius)] px-3 py-2 text-sm font-medium transition-all duration-200",
          "hover:bg-sidebar-accent",
          isActive
            ? "bg-sidebar-accent text-primary"
            : "text-sidebar-muted hover:text-sidebar-foreground",
          isCollapsed && "justify-center px-2"
        )}
        title={isCollapsed ? item.title : undefined}
      >
        <Icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary")} />
        <AnimatePresence>
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="flex-1"
            >
              {item.title}
            </motion.span>
          )}
        </AnimatePresence>
        {!isCollapsed && item.badge && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground"
          >
            {item.badge}
          </motion.span>
        )}
      </Link>
    </li>
  );
}

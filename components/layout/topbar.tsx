"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import {
  Bell,
  Search,
  Sun,
  Moon,
  Menu,
  Plus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { LogOut, User as UserIcon, Settings } from "lucide-react";
import { cn, getGreeting } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { CommandPalette } from "@/components/layout/command-palette";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/stores/auth-store";
import { authApi } from "@/lib/api/auth";
import { ROLE_LABELS } from "@/lib/enums";

interface TopbarProps {
  onMobileMenuToggle: () => void;
  sidebarCollapsed: boolean;
}

export function Topbar({ onMobileMenuToggle, sidebarCollapsed }: TopbarProps) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const authUser = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);

  // Global ⌘K / Ctrl+K opens the command palette (Stripe-style search).
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const user = {
    name: authUser?.full_name ?? "Guest",
    role: authUser?.employment?.designation ?? ROLE_LABELS[authUser?.role ?? "employee"],
    avatar: authUser?.avatar ?? undefined,
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      /* best-effort — clear locally regardless */
    }
    clear();
    router.replace("/login");
  };

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/80 backdrop-blur-sm px-4 md:px-6 transition-all duration-200",
        sidebarCollapsed ? "left-[72px]" : "left-0 md:left-[240px]"
      )}
    >
      {/* Mobile Menu Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onMobileMenuToggle}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Greeting - Hidden on mobile */}
      <div className="hidden md:block">
        <h2 className="text-lg font-semibold text-foreground">
          {getGreeting()}, {user.name.split(" ")[0]}
        </h2>
        <p className="text-sm text-foreground-muted">
          Welcome back! Here&apos;s what&apos;s happening today.
        </p>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search — opens the command palette */}
      <button
        type="button"
        onClick={() => setPaletteOpen(true)}
        className="hidden lg:flex h-9 w-72 items-center gap-2 rounded-[var(--radius)] border border-border bg-secondary/50 px-3 text-sm text-foreground-muted transition-colors hover:border-border-hover hover:bg-secondary"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">Search pages and actions…</span>
        <kbd className="rounded border border-border bg-card px-1.5 py-0.5 text-[10px] font-medium text-foreground-subtle">
          ⌘K
        </kbd>
      </button>

      {/* Quick Actions */}
      <div className="flex items-center gap-2">
        {/* Mobile / tablet search icon */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-foreground-muted hover:text-foreground"
          onClick={() => setPaletteOpen(true)}
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </Button>

        {/* Quick Add Button — also opens the palette */}
        <Button
          variant="outline"
          size="sm"
          className="hidden sm:flex gap-2"
          onClick={() => setPaletteOpen(true)}
        >
          <Plus className="h-4 w-4" />
          <span>Quick Action</span>
        </Button>

        {/* Theme Toggle */}
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-foreground-muted hover:text-foreground"
          >
            <motion.div
              initial={false}
              animate={{ rotate: theme === "dark" ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {theme === "dark" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </motion.div>
          </Button>
        )}

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative text-foreground-muted hover:text-foreground"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
        </Button>

        {/* User menu */}
        <div className="ml-2 border-l border-border pl-2">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <button type="button" className="flex items-center gap-3">
                <Avatar name={user.name} src={user.avatar} size="sm" status="online" className="cursor-pointer" />
                <div className="hidden text-left md:block">
                  <p className="text-sm font-medium text-foreground">{user.name}</p>
                  <p className="text-xs text-foreground-muted">{user.role}</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{authUser?.email ?? "Account"}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/profile")}>
                <UserIcon className="h-4 w-4" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                <Settings className="h-4 w-4" /> Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive onClick={handleLogout}>
                <LogOut className="h-4 w-4" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </header>
  );
}

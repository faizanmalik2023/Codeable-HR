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
import { cn, getGreeting } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";

interface TopbarProps {
  onMobileMenuToggle: () => void;
  sidebarCollapsed: boolean;
}

export function Topbar({ onMobileMenuToggle, sidebarCollapsed }: TopbarProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Mock user data - replace with real data
  const user = {
    name: "John Doe",
    role: "Software Engineer",
    avatar: undefined,
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

      {/* Search */}
      <div className="hidden lg:block w-64">
        <Input
          placeholder="Search..."
          icon={<Search className="h-4 w-4" />}
          className="bg-secondary/50"
        />
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-2">
        {/* Quick Add Button */}
        <Button variant="outline" size="sm" className="hidden sm:flex gap-2">
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

        {/* User Avatar */}
        <div className="flex items-center gap-3 pl-2 border-l border-border ml-2">
          <Avatar
            name={user.name}
            src={user.avatar}
            size="sm"
            status="online"
            className="cursor-pointer"
          />
          <div className="hidden md:block">
            <p className="text-sm font-medium text-foreground">{user.name}</p>
            <p className="text-xs text-foreground-muted">{user.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Search,
  Shield,
  Users,
  UserCog,
  Crown,
  User,
  Settings,
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { StaggerContainer, StaggerItem } from "@/components/animations/fade-in";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Types
interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean; // System roles can't be deleted
  userCount: number;
  color: string;
  icon: React.ReactNode;
  permissions: string[];
}

// Mock data
const mockRoles: Role[] = [
  {
    id: "employee",
    name: "Employee",
    description: "Standard access for all team members",
    isSystem: true,
    userCount: 42,
    color: "text-primary",
    icon: <User className="h-5 w-5" />,
    permissions: ["View dashboard", "Submit EOD", "Apply for leave", "View policies"],
  },
  {
    id: "manager",
    name: "Manager",
    description: "Team leads who approve leaves and review EODs",
    isSystem: true,
    userCount: 8,
    color: "text-accent",
    icon: <UserCog className="h-5 w-5" />,
    permissions: ["Approve leaves", "Review team EODs", "View team hours", "Access team reports"],
  },
  {
    id: "hr",
    name: "HR",
    description: "Human resources with people operations access",
    isSystem: true,
    userCount: 3,
    color: "text-warning",
    icon: <Users className="h-5 w-5" />,
    permissions: ["Manage employees", "Handle HR issues", "Manage policies", "View company hours"],
  },
  {
    id: "admin",
    name: "Admin",
    description: "Full system access including settings and roles",
    isSystem: true,
    userCount: 2,
    color: "text-destructive",
    icon: <Crown className="h-5 w-5" />,
    permissions: ["Full access", "Manage roles", "System settings", "View audit logs"],
  },
  {
    id: "finance",
    name: "Finance",
    description: "Access to payroll and financial reports",
    isSystem: false,
    userCount: 2,
    color: "text-success",
    icon: <Shield className="h-5 w-5" />,
    permissions: ["View payroll", "Export reports", "Access financial data"],
  },
];

export default function RolesPage() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [roles, setRoles] = React.useState<Role[]>(mockRoles);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeMenu, setActiveMenu] = React.useState<string | null>(null);
  const [deleteModal, setDeleteModal] = React.useState<Role | null>(null);

  // Simulate loading
  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  // Filter roles
  const filteredRoles = roles.filter((role) =>
    role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    role.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort: system roles first, then by user count
  const sortedRoles = [...filteredRoles].sort((a, b) => {
    if (a.isSystem !== b.isSystem) return a.isSystem ? -1 : 1;
    return b.userCount - a.userCount;
  });

  const totalUsers = roles.reduce((sum, r) => sum + r.userCount, 0);

  const handleDuplicate = (role: Role) => {
    const newRole: Role = {
      ...role,
      id: `${role.id}-copy-${Date.now()}`,
      name: `${role.name} (Copy)`,
      isSystem: false,
      userCount: 0,
    };
    setRoles([...roles, newRole]);
    setActiveMenu(null);
  };

  const handleDelete = (role: Role) => {
    setRoles(roles.filter((r) => r.id !== role.id));
    setDeleteModal(null);
    setActiveMenu(null);
  };

  return (
    <StaggerContainer className="space-y-6">
      {/* Header */}
      <StaggerItem>
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-bold text-foreground">
              Roles & Permissions
            </h1>
            <p className="text-sm text-foreground-muted">
              Define who can see and do what in your organization
            </p>
          </div>
          <Link href="/admin/roles/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Create Role</span>
              <span className="sm:hidden">New</span>
            </Button>
          </Link>
        </div>
      </StaggerItem>

      {/* Stats */}
      <StaggerItem>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-foreground-muted mb-1">
                <Shield className="h-4 w-4" />
                <span className="text-sm">Total Roles</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{roles.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-foreground-muted mb-1">
                <Users className="h-4 w-4" />
                <span className="text-sm">Users Assigned</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{totalUsers}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-foreground-muted mb-1">
                <Settings className="h-4 w-4" />
                <span className="text-sm">System Roles</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {roles.filter((r) => r.isSystem).length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-foreground-muted mb-1">
                <UserCog className="h-4 w-4" />
                <span className="text-sm">Custom Roles</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {roles.filter((r) => !r.isSystem).length}
              </p>
            </CardContent>
          </Card>
        </div>
      </StaggerItem>

      {/* Search */}
      <StaggerItem>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
          <Input
            placeholder="Search roles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </StaggerItem>

      {/* Roles List */}
      <div className="space-y-3">
        {isLoading ? (
          <StaggerItem>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4 rounded-xl border border-border bg-card">
                  <div className="flex items-start gap-4">
                    <Skeleton variant="default" className="h-12 w-12 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton variant="text" className="h-5 w-32" />
                      <Skeleton variant="text" className="h-4 w-64" />
                      <div className="flex gap-2">
                        <Skeleton variant="default" className="h-5 w-20 rounded-full" />
                        <Skeleton variant="default" className="h-5 w-24 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </StaggerItem>
        ) : sortedRoles.length === 0 ? (
          <StaggerItem>
            <div className="text-center py-12">
              <div className="inline-flex p-4 rounded-full bg-secondary mb-4">
                <Shield className="h-8 w-8 text-foreground-muted" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">
                {searchQuery ? "No roles found" : "No roles yet"}
              </h3>
              <p className="text-sm text-foreground-muted mb-4">
                {searchQuery
                  ? "Try a different search term"
                  : "Create your first role to get started"}
              </p>
              {!searchQuery && (
                <Link href="/admin/roles/new">
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Role
                  </Button>
                </Link>
              )}
            </div>
          </StaggerItem>
        ) : (
          sortedRoles.map((role, index) => (
            <StaggerItem key={role.id} index={index}>
              <Card className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={cn(
                      "p-3 rounded-xl bg-secondary shrink-0",
                      role.color
                    )}>
                      {role.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">
                          {role.name}
                        </h3>
                        {role.isSystem && (
                          <Badge variant="muted" className="text-xs">
                            System
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-foreground-muted mb-3">
                        {role.description}
                      </p>

                      {/* Permissions preview */}
                      <div className="flex flex-wrap gap-1.5">
                        {role.permissions.slice(0, 3).map((perm, i) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-0.5 rounded-full bg-primary-muted/30 text-primary"
                          >
                            {perm}
                          </span>
                        ))}
                        {role.permissions.length > 3 && (
                          <span className="text-xs text-foreground-muted">
                            +{role.permissions.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* User count */}
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-foreground">
                        {role.userCount}
                      </p>
                      <p className="text-xs text-foreground-muted">
                        {role.userCount === 1 ? "user" : "users"}
                      </p>
                    </div>

                    {/* Actions Menu */}
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full"
                        onClick={() => setActiveMenu(activeMenu === role.id ? null : role.id)}
                      >
                        <MoreHorizontal className="h-5 w-5" />
                      </Button>

                      <AnimatePresence>
                        {activeMenu === role.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-lg py-1 min-w-[160px] z-10"
                          >
                            <Link href={`/admin/roles/${role.id}`}>
                              <button className="w-full px-3 py-2 text-left text-sm hover:bg-secondary transition-colors flex items-center gap-2">
                                <Pencil className="h-4 w-4 text-foreground-muted" />
                                Edit Role
                              </button>
                            </Link>
                            <button
                              onClick={() => handleDuplicate(role)}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-secondary transition-colors flex items-center gap-2"
                            >
                              <Copy className="h-4 w-4 text-foreground-muted" />
                              Duplicate
                            </button>
                            {!role.isSystem && (
                              <button
                                onClick={() => {
                                  setDeleteModal(role);
                                  setActiveMenu(null);
                                }}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-destructive-muted transition-colors flex items-center gap-2 text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </button>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setDeleteModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-xl"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-destructive-muted">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    Delete Role
                  </h3>
                  <p className="text-sm text-foreground-muted mb-4">
                    Are you sure you want to delete the <strong>{deleteModal.name}</strong> role?
                    {deleteModal.userCount > 0 && (
                      <span className="block mt-2 text-warning">
                        {deleteModal.userCount} {deleteModal.userCount === 1 ? "user has" : "users have"} this role assigned.
                      </span>
                    )}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setDeleteModal(null)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleDelete(deleteModal)}
                      className="flex-1"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close menu */}
      {activeMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setActiveMenu(null)}
        />
      )}
    </StaggerContainer>
  );
}

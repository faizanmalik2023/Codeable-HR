"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Save,
  Shield,
  LayoutDashboard,
  FileText,
  Calendar,
  MessageSquare,
  Users,
  Award,
  BookOpen,
  Clock,
  BarChart3,
  Settings,
  ChevronDown,
  Check,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { StaggerContainer, StaggerItem } from "@/components/animations/fade-in";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Permission domains with their capabilities
interface PermissionDomain {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  permissions: {
    id: string;
    name: string;
    description: string;
    level: "read" | "write" | "manage";
  }[];
}

const permissionDomains: PermissionDomain[] = [
  {
    id: "dashboard",
    name: "Dashboard",
    description: "Access to dashboard widgets and overview",
    icon: <LayoutDashboard className="h-5 w-5" />,
    permissions: [
      { id: "dashboard.view", name: "View dashboard", description: "See the main dashboard", level: "read" },
      { id: "dashboard.widgets", name: "Customize widgets", description: "Add or remove dashboard widgets", level: "write" },
    ],
  },
  {
    id: "eod",
    name: "EOD Reports",
    description: "End of day reporting system",
    icon: <FileText className="h-5 w-5" />,
    permissions: [
      { id: "eod.view_own", name: "View own EODs", description: "See their own submitted reports", level: "read" },
      { id: "eod.submit", name: "Submit EODs", description: "Create and submit daily reports", level: "write" },
      { id: "eod.view_team", name: "View team EODs", description: "See reports from team members", level: "read" },
      { id: "eod.manage", name: "Manage all EODs", description: "View and manage company-wide reports", level: "manage" },
    ],
  },
  {
    id: "leaves",
    name: "Leaves",
    description: "Leave requests and approvals",
    icon: <Calendar className="h-5 w-5" />,
    permissions: [
      { id: "leaves.view_own", name: "View own leaves", description: "See their own leave history", level: "read" },
      { id: "leaves.apply", name: "Apply for leave", description: "Submit leave requests", level: "write" },
      { id: "leaves.approve_team", name: "Approve team leaves", description: "Approve or reject team requests", level: "write" },
      { id: "leaves.manage", name: "Manage all leaves", description: "Handle company-wide leave management", level: "manage" },
    ],
  },
  {
    id: "hr_issues",
    name: "HR Issues",
    description: "Employee concerns and HR communications",
    icon: <MessageSquare className="h-5 w-5" />,
    permissions: [
      { id: "hr_issues.create", name: "Raise issues", description: "Submit concerns to HR", level: "write" },
      { id: "hr_issues.view_own", name: "View own issues", description: "See their own submitted issues", level: "read" },
      { id: "hr_issues.respond", name: "Respond to issues", description: "Reply to employee concerns", level: "write" },
      { id: "hr_issues.manage", name: "Manage all issues", description: "Full access to all HR issues", level: "manage" },
    ],
  },
  {
    id: "employees",
    name: "Employees",
    description: "Employee profiles and directory",
    icon: <Users className="h-5 w-5" />,
    permissions: [
      { id: "employees.view_directory", name: "View directory", description: "See employee directory", level: "read" },
      { id: "employees.view_profiles", name: "View profiles", description: "See detailed employee profiles", level: "read" },
      { id: "employees.edit", name: "Edit employees", description: "Update employee information", level: "write" },
      { id: "employees.manage", name: "Manage employees", description: "Add, archive, and fully manage employees", level: "manage" },
    ],
  },
  {
    id: "promotions",
    name: "Promotions",
    description: "Career growth and role changes",
    icon: <Award className="h-5 w-5" />,
    permissions: [
      { id: "promotions.view_own", name: "View own history", description: "See their own career history", level: "read" },
      { id: "promotions.view_all", name: "View all promotions", description: "See company-wide promotions", level: "read" },
      { id: "promotions.manage", name: "Manage promotions", description: "Add and edit promotion records", level: "manage" },
    ],
  },
  {
    id: "documents",
    name: "Documents & Policies",
    description: "Company policies and documents",
    icon: <BookOpen className="h-5 w-5" />,
    permissions: [
      { id: "documents.view", name: "View policies", description: "Read company policies", level: "read" },
      { id: "documents.manage", name: "Manage policies", description: "Create, edit, and manage policies", level: "manage" },
    ],
  },
  {
    id: "time",
    name: "Time Tracking",
    description: "Clock in/out and hours overview",
    icon: <Clock className="h-5 w-5" />,
    permissions: [
      { id: "time.track_own", name: "Track own time", description: "Clock in/out and view own hours", level: "write" },
      { id: "time.view_team", name: "View team hours", description: "See team time tracking data", level: "read" },
      { id: "time.view_company", name: "View company hours", description: "See company-wide time data", level: "read" },
    ],
  },
  {
    id: "analytics",
    name: "Analytics",
    description: "Reports and insights",
    icon: <BarChart3 className="h-5 w-5" />,
    permissions: [
      { id: "analytics.view_team", name: "View team analytics", description: "Access team-level reports", level: "read" },
      { id: "analytics.view_company", name: "View company analytics", description: "Access company-wide insights", level: "read" },
      { id: "analytics.export", name: "Export reports", description: "Download data exports", level: "write" },
    ],
  },
  {
    id: "settings",
    name: "Settings & Administration",
    description: "System configuration and admin tools",
    icon: <Settings className="h-5 w-5" />,
    permissions: [
      { id: "settings.view", name: "View settings", description: "See system settings", level: "read" },
      { id: "settings.edit", name: "Edit settings", description: "Modify system configuration", level: "write" },
      { id: "roles.manage", name: "Manage roles", description: "Create and edit roles", level: "manage" },
      { id: "audit.view", name: "View audit logs", description: "Access system audit trail", level: "read" },
    ],
  },
];

// Mock existing role data
const mockRoles: Record<string, { name: string; description: string; permissions: string[]; isSystem: boolean }> = {
  employee: {
    name: "Employee",
    description: "Standard access for all team members",
    permissions: ["dashboard.view", "eod.view_own", "eod.submit", "leaves.view_own", "leaves.apply", "hr_issues.create", "hr_issues.view_own", "employees.view_directory", "promotions.view_own", "documents.view", "time.track_own"],
    isSystem: true,
  },
  manager: {
    name: "Manager",
    description: "Team leads who approve leaves and review EODs",
    permissions: ["dashboard.view", "dashboard.widgets", "eod.view_own", "eod.submit", "eod.view_team", "leaves.view_own", "leaves.apply", "leaves.approve_team", "hr_issues.create", "hr_issues.view_own", "employees.view_directory", "employees.view_profiles", "promotions.view_own", "documents.view", "time.track_own", "time.view_team", "analytics.view_team"],
    isSystem: true,
  },
  hr: {
    name: "HR",
    description: "Human resources with people operations access",
    permissions: ["dashboard.view", "dashboard.widgets", "eod.view_own", "eod.submit", "eod.manage", "leaves.view_own", "leaves.apply", "leaves.manage", "hr_issues.create", "hr_issues.view_own", "hr_issues.respond", "hr_issues.manage", "employees.view_directory", "employees.view_profiles", "employees.edit", "employees.manage", "promotions.view_own", "promotions.view_all", "promotions.manage", "documents.view", "documents.manage", "time.track_own", "time.view_company", "analytics.view_company", "analytics.export"],
    isSystem: true,
  },
  admin: {
    name: "Admin",
    description: "Full system access including settings and roles",
    permissions: permissionDomains.flatMap((d) => d.permissions.map((p) => p.id)),
    isSystem: true,
  },
};

export default function RoleEditorPage() {
  const params = useParams();
  const router = useRouter();
  const isNew = params.id === "new";

  const [isLoading, setIsLoading] = React.useState(!isNew);
  const [isSaving, setIsSaving] = React.useState(false);
  const [expandedDomains, setExpandedDomains] = React.useState<string[]>(
    isNew ? ["dashboard", "eod", "leaves"] : []
  );

  // Form state
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [selectedPermissions, setSelectedPermissions] = React.useState<Set<string>>(new Set());
  const [isSystem, setIsSystem] = React.useState(false);

  // Load existing role
  React.useEffect(() => {
    if (isNew) return;

    const timer = setTimeout(() => {
      const roleId = params.id as string;
      const existingRole = mockRoles[roleId];
      if (existingRole) {
        setName(existingRole.name);
        setDescription(existingRole.description);
        setSelectedPermissions(new Set(existingRole.permissions));
        setIsSystem(existingRole.isSystem);
        // Expand domains that have selected permissions
        const domainsWithSelections = permissionDomains
          .filter((d) => d.permissions.some((p) => existingRole.permissions.includes(p.id)))
          .map((d) => d.id);
        setExpandedDomains(domainsWithSelections);
      }
      setIsLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [isNew, params.id]);

  const toggleDomain = (domainId: string) => {
    setExpandedDomains((prev) =>
      prev.includes(domainId)
        ? prev.filter((id) => id !== domainId)
        : [...prev, domainId]
    );
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(permissionId)) {
        next.delete(permissionId);
      } else {
        next.add(permissionId);
      }
      return next;
    });
  };

  const toggleAllInDomain = (domain: PermissionDomain) => {
    const domainPermIds = domain.permissions.map((p) => p.id);
    const allSelected = domainPermIds.every((id) => selectedPermissions.has(id));

    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        domainPermIds.forEach((id) => next.delete(id));
      } else {
        domainPermIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    router.push("/admin/roles");
  };

  // Generate summary of what this role can do
  const generateSummary = () => {
    const abilities: string[] = [];

    if (selectedPermissions.has("leaves.approve_team")) abilities.push("Approve team leaves");
    if (selectedPermissions.has("leaves.manage")) abilities.push("Manage all leaves");
    if (selectedPermissions.has("eod.view_team")) abilities.push("Review team EODs");
    if (selectedPermissions.has("eod.manage")) abilities.push("Manage all EODs");
    if (selectedPermissions.has("employees.view_profiles")) abilities.push("View employee profiles");
    if (selectedPermissions.has("employees.manage")) abilities.push("Manage employees");
    if (selectedPermissions.has("hr_issues.respond")) abilities.push("Handle HR issues");
    if (selectedPermissions.has("documents.manage")) abilities.push("Manage policies");
    if (selectedPermissions.has("time.view_company")) abilities.push("View company hours");
    if (selectedPermissions.has("roles.manage")) abilities.push("Manage roles");
    if (selectedPermissions.has("analytics.export")) abilities.push("Export reports");

    return abilities.slice(0, 5);
  };

  const summary = generateSummary();
  const canSave = name.trim().length >= 2 && selectedPermissions.size > 0;

  if (isLoading) {
    return (
      <StaggerContainer className="space-y-6 max-w-4xl mx-auto">
        <StaggerItem>
          <div className="flex items-center gap-4">
            <Skeleton variant="circular" className="h-10 w-10" />
            <div className="space-y-2">
              <Skeleton variant="text" className="h-6 w-48" />
              <Skeleton variant="text" className="h-4 w-32" />
            </div>
          </div>
        </StaggerItem>
        <StaggerItem>
          <Skeleton variant="default" className="h-32 w-full rounded-xl" />
        </StaggerItem>
        <StaggerItem>
          <Skeleton variant="default" className="h-64 w-full rounded-xl" />
        </StaggerItem>
      </StaggerContainer>
    );
  }

  return (
    <StaggerContainer className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <StaggerItem>
        <div className="flex items-center gap-4">
          <Link href="/admin/roles">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-bold text-foreground">
              {isNew ? "Create Role" : `Edit ${name}`}
            </h1>
            <p className="text-sm text-foreground-muted">
              {isNew ? "Define what this role can access" : "Modify role permissions"}
            </p>
          </div>
          <Button
            onClick={handleSave}
            disabled={!canSave || isSaving}
            className="gap-2"
          >
            {isSaving ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Save className="h-4 w-4" />
                </motion.div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Role
              </>
            )}
          </Button>
        </div>
      </StaggerItem>

      {/* System role warning */}
      {isSystem && (
        <StaggerItem>
          <div className="flex items-start gap-3 p-4 rounded-xl bg-warning-muted/30 border border-warning/20">
            <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">
                System Role
              </p>
              <p className="text-sm text-foreground-muted">
                This is a core system role. Changes may affect how the application works.
              </p>
            </div>
          </div>
        </StaggerItem>
      )}

      {/* Basic Info */}
      <StaggerItem>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-foreground-muted" />
              Role Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Role Name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Team Lead, Finance, Recruiter..."
                disabled={isSystem}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Description
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this role responsible for?"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>
      </StaggerItem>

      {/* Live Summary */}
      {summary.length > 0 && (
        <StaggerItem>
          <Card className="bg-primary-muted/20 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary-muted">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    This role can:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {summary.map((ability, i) => (
                      <Badge key={i} variant="default" className="text-xs">
                        {ability}
                      </Badge>
                    ))}
                    {selectedPermissions.size > 5 && (
                      <span className="text-xs text-foreground-muted">
                        +{selectedPermissions.size - summary.length} more permissions
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>
      )}

      {/* Permissions */}
      <StaggerItem>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Permissions</CardTitle>
            <p className="text-sm text-foreground-muted">
              Choose what this role can access and do
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {permissionDomains.map((domain) => {
              const isExpanded = expandedDomains.includes(domain.id);
              const domainPermIds = domain.permissions.map((p) => p.id);
              const selectedCount = domainPermIds.filter((id) => selectedPermissions.has(id)).length;
              const allSelected = selectedCount === domain.permissions.length;
              const someSelected = selectedCount > 0 && !allSelected;

              return (
                <div
                  key={domain.id}
                  className="border border-border rounded-xl overflow-hidden"
                >
                  {/* Domain Header */}
                  <button
                    onClick={() => toggleDomain(domain.id)}
                    className="w-full flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors"
                  >
                    <span className="text-foreground-muted">{domain.icon}</span>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-foreground">{domain.name}</p>
                      <p className="text-sm text-foreground-muted">{domain.description}</p>
                    </div>
                    {selectedCount > 0 && (
                      <Badge variant="default" className="text-xs">
                        {selectedCount}/{domain.permissions.length}
                      </Badge>
                    )}
                    <ChevronDown className={cn(
                      "h-5 w-5 text-foreground-muted transition-transform",
                      isExpanded && "rotate-180"
                    )} />
                  </button>

                  {/* Permissions List */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="px-4 pb-4 pt-2 border-t border-border bg-secondary/20">
                          {/* Select All */}
                          <button
                            onClick={() => toggleAllInDomain(domain)}
                            className="flex items-center gap-2 mb-3 text-sm text-primary hover:underline"
                          >
                            {allSelected ? "Deselect all" : "Select all"}
                          </button>

                          <div className="space-y-2">
                            {domain.permissions.map((permission) => {
                              const isSelected = selectedPermissions.has(permission.id);
                              return (
                                <button
                                  key={permission.id}
                                  onClick={() => togglePermission(permission.id)}
                                  className={cn(
                                    "w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left",
                                    isSelected
                                      ? "bg-primary-muted/30 border border-primary/30"
                                      : "bg-card border border-border hover:border-primary/20"
                                  )}
                                >
                                  <div className={cn(
                                    "h-5 w-5 rounded border-2 flex items-center justify-center transition-colors",
                                    isSelected
                                      ? "bg-primary border-primary"
                                      : "border-border"
                                  )}>
                                    {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                                  </div>
                                  <div className="flex-1">
                                    <p className={cn(
                                      "font-medium",
                                      isSelected ? "text-foreground" : "text-foreground-muted"
                                    )}>
                                      {permission.name}
                                    </p>
                                    <p className="text-xs text-foreground-muted">
                                      {permission.description}
                                    </p>
                                  </div>
                                  <Badge
                                    variant="muted"
                                    className={cn(
                                      "text-xs capitalize",
                                      permission.level === "manage" && "text-warning",
                                      permission.level === "write" && "text-primary",
                                      permission.level === "read" && "text-foreground-muted"
                                    )}
                                  >
                                    {permission.level}
                                  </Badge>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </StaggerItem>

      {/* Footer */}
      <StaggerItem>
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <p className="text-sm text-foreground-muted">
            {selectedPermissions.size} permission{selectedPermissions.size !== 1 ? "s" : ""} selected
          </p>
          <div className="flex gap-2">
            <Link href="/admin/roles">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button
              onClick={handleSave}
              disabled={!canSave || isSaving}
              className="gap-2"
            >
              {isSaving ? "Saving..." : "Save Role"}
            </Button>
          </div>
        </div>
      </StaggerItem>
    </StaggerContainer>
  );
}

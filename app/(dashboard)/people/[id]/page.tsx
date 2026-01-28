"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building2,
  User,
  Palmtree,
  Stethoscope,
  Coffee,
  TrendingUp,
  MessageSquare,
  Edit,
  Plus,
  ChevronRight,
  Pencil,
  Trash2,
  Sparkles,
  Award,
  Shield,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal, ConfirmModal } from "@/components/ui/modal";
import { StaggerContainer, StaggerItem } from "@/components/animations/fade-in";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, cn } from "@/lib/utils";

// Types
type TabId = "overview" | "leaves" | "promotions" | "notes" | "issues";

interface LeaveBalance {
  type: string;
  remaining: number;
  total: number;
  icon: React.ReactNode;
  color: string;
}

interface LeaveHistory {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  status: "approved" | "pending" | "rejected";
}

interface Promotion {
  id: string;
  fromRole: string;
  toRole: string;
  date: string;
  notes?: string;
  addedBy: string;
  addedAt: string;
}

interface HRNote {
  id: string;
  content: string;
  author: string;
  createdAt: string;
  isPrivate: boolean;
}

// Mock employee data
const mockEmployee = {
  id: "emp1",
  name: "Alice Cooper",
  email: "alice.cooper@codeable.com",
  phone: "+1 234 567 8901",
  role: "Senior Developer",
  department: "Engineering",
  location: "San Francisco",
  status: "active" as const,
  joinDate: "2021-03-15",
  manager: "Sarah Manager",
  bio: "Passionate about building great software. 5+ years of experience in full-stack development.",
};

const leaveBalances: LeaveBalance[] = [
  { type: "Annual", remaining: 15, total: 21, icon: <Palmtree className="h-5 w-5" />, color: "primary" },
  { type: "Sick", remaining: 8, total: 10, icon: <Stethoscope className="h-5 w-5" />, color: "warning" },
  { type: "Casual", remaining: 3, total: 5, icon: <Coffee className="h-5 w-5" />, color: "accent" },
];

const leaveHistory: LeaveHistory[] = [
  { id: "l1", type: "Annual", startDate: "2024-01-10", endDate: "2024-01-12", days: 3, status: "approved" },
  { id: "l2", type: "Sick", startDate: "2023-12-05", endDate: "2023-12-05", days: 1, status: "approved" },
  { id: "l3", type: "Annual", startDate: "2023-11-20", endDate: "2023-11-24", days: 5, status: "approved" },
];

const initialPromotions: Promotion[] = [
  {
    id: "p1",
    fromRole: "Developer",
    toRole: "Senior Developer",
    date: "2023-06-01",
    notes: "Excellent performance and leadership qualities. Has been mentoring junior developers and taking on more responsibilities.",
    addedBy: "Emily HR",
    addedAt: "2023-06-01T10:00:00",
  },
  {
    id: "p2",
    fromRole: "Junior Developer",
    toRole: "Developer",
    date: "2022-01-15",
    notes: "Consistently exceeded expectations and demonstrated strong technical skills.",
    addedBy: "Sarah Manager",
    addedAt: "2022-01-15T09:00:00",
  },
];

const hrNotes: HRNote[] = [
  { id: "n1", content: "Discussed career growth path. Interested in tech lead position.", author: "Emily HR", createdAt: "2024-01-15T10:00:00", isPrivate: true },
  { id: "n2", content: "Completed annual review. Performance rating: Exceeds Expectations", author: "Sarah Manager", createdAt: "2023-12-20T14:00:00", isPrivate: false },
];

const relatedIssues = [
  { id: "i1", title: "Equipment request", status: "resolved", date: "2023-10-15" },
];

// Available roles for assignment
interface AvailableRole {
  id: string;
  name: string;
  description: string;
  color: string;
}

const availableRoles: AvailableRole[] = [
  { id: "employee", name: "Employee", description: "Standard access for all team members", color: "text-primary" },
  { id: "manager", name: "Manager", description: "Team leads who approve leaves and review EODs", color: "text-accent" },
  { id: "hr", name: "HR", description: "Human resources with people operations access", color: "text-warning" },
  { id: "admin", name: "Admin", description: "Full system access including settings and roles", color: "text-destructive" },
  { id: "finance", name: "Finance", description: "Access to payroll and financial reports", color: "text-success" },
];

// Employee's current roles
const initialEmployeeRoles = ["employee"];

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <User className="h-4 w-4" /> },
  { id: "leaves", label: "Leaves", icon: <Calendar className="h-4 w-4" /> },
  { id: "promotions", label: "Promotions", icon: <TrendingUp className="h-4 w-4" /> },
  { id: "notes", label: "Notes", icon: <MessageSquare className="h-4 w-4" /> },
  { id: "issues", label: "Issues", icon: <MessageSquare className="h-4 w-4" /> },
];

const statusConfig = {
  active: { label: "Active", color: "text-success", bg: "bg-success" },
  on_leave: { label: "On Leave", color: "text-warning", bg: "bg-warning" },
  remote: { label: "Remote", color: "text-primary", bg: "bg-primary" },
};

export default function EmployeeProfilePage() {
  const params = useParams();
  const [activeTab, setActiveTab] = React.useState<TabId>("overview");
  const employee = mockEmployee;

  // Promotions state
  const [promotions, setPromotions] = React.useState<Promotion[]>(initialPromotions);
  const [isAddPromotionOpen, setIsAddPromotionOpen] = React.useState(false);
  const [editingPromotion, setEditingPromotion] = React.useState<Promotion | null>(null);
  const [deletingPromotion, setDeletingPromotion] = React.useState<Promotion | null>(null);

  // Roles state (for admin role assignment)
  const [employeeRoles, setEmployeeRoles] = React.useState<string[]>(initialEmployeeRoles);
  const [isRoleModalOpen, setIsRoleModalOpen] = React.useState(false);
  const [pendingRoles, setPendingRoles] = React.useState<string[]>([]);
  const [isSavingRoles, setIsSavingRoles] = React.useState(false);

  // Form state
  const [formDesignation, setFormDesignation] = React.useState("");
  const [formDate, setFormDate] = React.useState("");
  const [formNotes, setFormNotes] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState("");

  // Reset form
  const resetForm = () => {
    setFormDesignation("");
    setFormDate("");
    setFormNotes("");
    setFormError("");
  };

  // Open add modal
  const openAddModal = () => {
    resetForm();
    setIsAddPromotionOpen(true);
  };

  // Open edit modal
  const openEditModal = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setFormDesignation(promotion.toRole);
    setFormDate(promotion.date);
    setFormNotes(promotion.notes || "");
    setFormError("");
  };

  // Close modals
  const closeAddModal = () => {
    setIsAddPromotionOpen(false);
    resetForm();
  };

  const closeEditModal = () => {
    setEditingPromotion(null);
    resetForm();
  };

  // Add promotion
  const handleAddPromotion = async () => {
    if (!formDesignation.trim()) {
      setFormError("New designation is required");
      return;
    }
    if (!formDate) {
      setFormError("Effective date is required");
      return;
    }

    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));

    const currentRole = promotions.length > 0 ? promotions[0].toRole : employee.role;

    const newPromotion: Promotion = {
      id: `p${Date.now()}`,
      fromRole: currentRole,
      toRole: formDesignation.trim(),
      date: formDate,
      notes: formNotes.trim() || undefined,
      addedBy: "HR Manager",
      addedAt: new Date().toISOString(),
    };

    setPromotions((prev) => [newPromotion, ...prev]);
    setIsSubmitting(false);
    closeAddModal();
  };

  // Edit promotion
  const handleEditPromotion = async () => {
    if (!editingPromotion) return;
    if (!formDesignation.trim()) {
      setFormError("New designation is required");
      return;
    }
    if (!formDate) {
      setFormError("Effective date is required");
      return;
    }

    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));

    setPromotions((prev) =>
      prev.map((p) =>
        p.id === editingPromotion.id
          ? {
              ...p,
              toRole: formDesignation.trim(),
              date: formDate,
              notes: formNotes.trim() || undefined,
            }
          : p
      )
    );

    setIsSubmitting(false);
    closeEditModal();
  };

  // Delete promotion
  const handleDeletePromotion = async () => {
    if (!deletingPromotion) return;
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));

    setPromotions((prev) => prev.filter((p) => p.id !== deletingPromotion.id));
    setIsSubmitting(false);
    setDeletingPromotion(null);
  };

  // Get current role for context
  const currentRole = promotions.length > 0 ? promotions[0].toRole : employee.role;

  // Role management functions
  const openRoleModal = () => {
    setPendingRoles([...employeeRoles]);
    setIsRoleModalOpen(true);
  };

  const closeRoleModal = () => {
    setIsRoleModalOpen(false);
    setPendingRoles([]);
  };

  const togglePendingRole = (roleId: string) => {
    setPendingRoles((prev) =>
      prev.includes(roleId) ? prev.filter((r) => r !== roleId) : [...prev, roleId]
    );
  };

  const handleSaveRoles = async () => {
    setIsSavingRoles(true);
    await new Promise((r) => setTimeout(r, 800));
    setEmployeeRoles(pendingRoles);
    setIsSavingRoles(false);
    closeRoleModal();
  };

  return (
    <StaggerContainer className="space-y-6">
      {/* Header */}
      <StaggerItem>
        <div className="flex items-center gap-4">
          <Link href="/people">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-bold text-foreground">
              Employee Profile
            </h1>
          </div>
          <Button variant="outline" className="gap-2">
            <Edit className="h-4 w-4" />
            Edit Profile
          </Button>
        </div>
      </StaggerItem>

      {/* Profile Header */}
      <StaggerItem>
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar & Basic Info */}
              <div className="flex flex-col items-center md:items-start gap-4">
                <div className="relative">
                  <Avatar name={employee.name} size="xl" className="w-24 h-24 text-2xl" />
                  <span
                    className={cn(
                      "absolute bottom-1 right-1 h-5 w-5 rounded-full border-3 border-card",
                      statusConfig[employee.status].bg
                    )}
                  />
                </div>
              </div>

              {/* Details */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                  <h2 className="text-2xl font-bold text-foreground">{employee.name}</h2>
                  <Badge className={cn(statusConfig[employee.status].color, `${statusConfig[employee.status].bg}/20`)}>
                    {statusConfig[employee.status].label}
                  </Badge>
                </div>
                <p className="text-lg text-foreground-muted mb-4">{currentRole}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <Building2 className="h-4 w-4 text-foreground-muted" />
                    <span>{employee.department}</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <Mail className="h-4 w-4 text-foreground-muted" />
                    <span>{employee.email}</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <MapPin className="h-4 w-4 text-foreground-muted" />
                    <span>{employee.location}</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <Calendar className="h-4 w-4 text-foreground-muted" />
                    <span>Joined {formatDate(new Date(employee.joinDate))}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </StaggerItem>

      {/* Tabs */}
      <StaggerItem>
        <div className="flex gap-2 border-b border-border overflow-x-auto pb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap",
                "border-b-2 -mb-px",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-foreground-muted hover:text-foreground"
              )}
            >
              {tab.icon}
              {tab.label}
              {tab.id === "promotions" && promotions.length > 0 && (
                <span className="ml-1 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                  {promotions.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </StaggerItem>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <StaggerItem>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground-muted">{employee.bio}</p>
                  {employee.manager && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-sm text-foreground-muted">Reports to</p>
                      <p className="font-medium text-foreground">{employee.manager}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Leave Balance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {leaveBalances.map((balance) => (
                    <div key={balance.type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-${balance.color}`}>{balance.icon}</span>
                        <span className="text-sm">{balance.type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{balance.remaining}</span>
                        <span className="text-foreground-muted">/ {balance.total} days</span>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="w-full mt-4 gap-2">
                    <Plus className="h-4 w-4" />
                    Adjust Balance
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Roles & Access Section (Admin Only) */}
            <Card className="mt-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-foreground-muted" />
                  <CardTitle className="text-base">Roles & Access</CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={openRoleModal} className="gap-2">
                  <Edit className="h-4 w-4" />
                  Manage Roles
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground-muted mb-4">
                  Roles determine what this person can see and do in the system.
                </p>
                {employeeRoles.length === 0 ? (
                  <p className="text-sm text-foreground-muted italic">No roles assigned yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {employeeRoles.map((roleId) => {
                      const role = availableRoles.find((r) => r.id === roleId);
                      if (!role) return null;
                      return (
                        <div
                          key={role.id}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 border border-border",
                            role.color
                          )}
                        >
                          <Shield className="h-4 w-4" />
                          <div>
                            <p className="text-sm font-medium text-foreground">{role.name}</p>
                            <p className="text-xs text-foreground-muted">{role.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Impact Summary */}
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs font-medium text-foreground-muted mb-2">This person can:</p>
                  <div className="flex flex-wrap gap-1">
                    {employeeRoles.includes("employee") && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary-muted/30 text-primary">Submit EODs</span>
                    )}
                    {employeeRoles.includes("employee") && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary-muted/30 text-primary">Apply for leave</span>
                    )}
                    {employeeRoles.includes("manager") && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-accent-muted/30 text-accent">Approve team leaves</span>
                    )}
                    {employeeRoles.includes("hr") && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-warning-muted/30 text-warning">Manage employees</span>
                    )}
                    {employeeRoles.includes("admin") && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-destructive-muted/30 text-destructive">Full access</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
        )}

        {/* Leaves Tab */}
        {activeTab === "leaves" && (
          <StaggerItem>
            <div className="space-y-6">
              {/* Balance Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {leaveBalances.map((balance) => (
                  <div
                    key={balance.type}
                    className={cn(
                      "p-4 rounded-xl border",
                      `bg-${balance.color}-muted/30 border-${balance.color}/10`
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-${balance.color}`}>{balance.icon}</span>
                      <span className="text-sm text-foreground-muted">{balance.type} Leave</span>
                    </div>
                    <p className="text-2xl font-bold">
                      <span className={`text-${balance.color}`}>{balance.remaining}</span>
                      <span className="text-foreground-muted text-base font-normal"> / {balance.total}</span>
                    </p>
                  </div>
                ))}
              </div>

              {/* Leave History */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Leave History</CardTitle>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Leave
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {leaveHistory.map((leave) => (
                      <div
                        key={leave.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
                      >
                        <div>
                          <p className="font-medium text-foreground">{leave.type} Leave</p>
                          <p className="text-sm text-foreground-muted">
                            {formatDate(new Date(leave.startDate))}
                            {leave.startDate !== leave.endDate && (
                              <> - {formatDate(new Date(leave.endDate))}</>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="muted">{leave.days}d</Badge>
                          <Badge
                            className={cn(
                              leave.status === "approved" && "bg-success-muted text-success",
                              leave.status === "pending" && "bg-warning-muted text-warning",
                              leave.status === "rejected" && "bg-destructive-muted text-destructive"
                            )}
                          >
                            {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </StaggerItem>
        )}

        {/* Promotions Tab - Enhanced */}
        {activeTab === "promotions" && (
          <StaggerItem>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    Career Journey
                  </CardTitle>
                  <p className="text-sm text-foreground-muted mt-1">
                    {employee.name}'s growth and milestones
                  </p>
                </div>
                <Button className="gap-2" onClick={openAddModal}>
                  <Plus className="h-4 w-4" />
                  Add Promotion
                </Button>
              </CardHeader>
              <CardContent>
                {promotions.length > 0 ? (
                  <div className="space-y-0">
                    {promotions.map((promo, index) => (
                      <div key={promo.id} className="relative pl-8 pb-8 last:pb-0 group">
                        {/* Timeline line */}
                        {index < promotions.length - 1 && (
                          <div className="absolute left-[11px] top-8 bottom-0 w-0.5 bg-gradient-to-b from-success/50 to-border" />
                        )}
                        {/* Timeline dot with sparkle effect */}
                        <div className="absolute left-0 top-1 flex items-center justify-center">
                          <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center">
                            <Sparkles className="h-3.5 w-3.5 text-success" />
                          </div>
                        </div>

                        <div className="p-4 rounded-xl bg-gradient-to-br from-success-muted/30 to-transparent border border-success/10 hover:border-success/20 transition-colors">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              {/* Role transition */}
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className="text-sm text-foreground-muted">
                                  {promo.fromRole}
                                </span>
                                <TrendingUp className="h-4 w-4 text-success shrink-0" />
                                <span className="font-semibold text-foreground">
                                  {promo.toRole}
                                </span>
                              </div>

                              {/* Date */}
                              <p className="text-sm text-foreground-muted mb-3">
                                <Calendar className="h-3.5 w-3.5 inline mr-1" />
                                {formatDate(new Date(promo.date))}
                              </p>

                              {/* Notes */}
                              {promo.notes && (
                                <p className="text-sm text-foreground bg-background/50 p-3 rounded-lg border border-border/50">
                                  {promo.notes}
                                </p>
                              )}

                              {/* Added by */}
                              <p className="text-xs text-foreground-subtle mt-3">
                                Added by {promo.addedBy}
                              </p>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => openEditModal(promo)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="text-destructive hover:text-destructive hover:bg-destructive-muted"
                                onClick={() => setDeletingPromotion(promo)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Starting point */}
                    <div className="relative pl-8">
                      <div className="absolute left-0 top-1 flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center">
                          <User className="h-3.5 w-3.5 text-foreground-muted" />
                        </div>
                      </div>
                      <div className="p-4 rounded-xl bg-secondary/30">
                        <p className="text-sm text-foreground-muted">
                          Joined as <span className="font-medium text-foreground">{promotions[promotions.length - 1]?.fromRole || "Team Member"}</span>
                        </p>
                        <p className="text-xs text-foreground-subtle mt-1">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {formatDate(new Date(employee.joinDate))}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    icon={TrendingUp}
                    title="No promotions recorded yet"
                    description={`Record ${employee.name}'s career milestones and growth here.`}
                    action={{
                      label: "Add First Promotion",
                      onClick: openAddModal,
                    }}
                  />
                )}
              </CardContent>
            </Card>
          </StaggerItem>
        )}

        {/* Notes Tab */}
        {activeTab === "notes" && (
          <StaggerItem>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">HR Notes</CardTitle>
                <Button variant="outline" size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Note
                </Button>
              </CardHeader>
              <CardContent>
                {hrNotes.length > 0 ? (
                  <div className="space-y-4">
                    {hrNotes.map((note) => (
                      <div
                        key={note.id}
                        className={cn(
                          "p-4 rounded-lg",
                          note.isPrivate ? "bg-warning-muted/20 border border-warning/10" : "bg-secondary/30"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">{note.author}</span>
                            {note.isPrivate && (
                              <Badge variant="outline" className="text-xs text-warning">
                                Private
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-foreground-subtle">
                            {formatDate(new Date(note.createdAt))}
                          </span>
                        </div>
                        <p className="text-sm text-foreground">{note.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-foreground-muted">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No notes yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </StaggerItem>
        )}

        {/* Issues Tab */}
        {activeTab === "issues" && (
          <StaggerItem>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Related HR Issues</CardTitle>
                <Button variant="outline" size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Open Issue
                </Button>
              </CardHeader>
              <CardContent>
                {relatedIssues.length > 0 ? (
                  <div className="space-y-3">
                    {relatedIssues.map((issue) => (
                      <Link key={issue.id} href={`/hr/issues/${issue.id}`}>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer">
                          <div>
                            <p className="font-medium text-foreground">{issue.title}</p>
                            <p className="text-sm text-foreground-muted">
                              {formatDate(new Date(issue.date))}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              className={cn(
                                issue.status === "resolved"
                                  ? "bg-success-muted text-success"
                                  : "bg-warning-muted text-warning"
                              )}
                            >
                              {issue.status.charAt(0).toUpperCase() + issue.status.slice(1)}
                            </Badge>
                            <ChevronRight className="h-4 w-4 text-foreground-subtle" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-foreground-muted">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No related issues</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </StaggerItem>
        )}
      </div>

      {/* Add Promotion Modal */}
      <Modal
        open={isAddPromotionOpen}
        onClose={closeAddModal}
        title="Add Promotion"
        description={`Record a career milestone for ${employee.name}`}
        size="md"
      >
        <div className="space-y-4">
          {/* Current role context */}
          <div className="p-3 rounded-lg bg-secondary/50 border border-border">
            <p className="text-sm text-foreground-muted">Current Role</p>
            <p className="font-medium text-foreground">{currentRole}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              New Designation <span className="text-destructive">*</span>
            </label>
            <Input
              value={formDesignation}
              onChange={(e) => {
                setFormDesignation(e.target.value);
                setFormError("");
              }}
              placeholder="e.g., Tech Lead"
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Effective Date <span className="text-destructive">*</span>
            </label>
            <Input
              type="date"
              value={formDate}
              onChange={(e) => {
                setFormDate(e.target.value);
                setFormError("");
              }}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Notes
            </label>
            <Textarea
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="What led to this promotion? Any context worth noting..."
              className="min-h-[100px] resize-none"
            />
            <p className="text-xs text-foreground-subtle mt-1">
              Share the story behind this milestone
            </p>
          </div>

          {formError && (
            <p className="text-sm text-destructive">{formError}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={closeAddModal}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={handleAddPromotion}
              isLoading={isSubmitting}
            >
              {!isSubmitting && (
                <>
                  <Sparkles className="h-4 w-4" />
                  Save Promotion
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Promotion Modal */}
      <Modal
        open={!!editingPromotion}
        onClose={closeEditModal}
        title="Edit Promotion"
        description="Update promotion details"
        size="md"
      >
        <div className="space-y-4">
          {/* Previous role context */}
          {editingPromotion && (
            <div className="p-3 rounded-lg bg-secondary/50 border border-border">
              <p className="text-sm text-foreground-muted">Previous Role</p>
              <p className="font-medium text-foreground">{editingPromotion.fromRole}</p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              New Designation <span className="text-destructive">*</span>
            </label>
            <Input
              value={formDesignation}
              onChange={(e) => {
                setFormDesignation(e.target.value);
                setFormError("");
              }}
              placeholder="e.g., Tech Lead"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Effective Date <span className="text-destructive">*</span>
            </label>
            <Input
              type="date"
              value={formDate}
              onChange={(e) => {
                setFormDate(e.target.value);
                setFormError("");
              }}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Notes
            </label>
            <Textarea
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="What led to this promotion? Any context worth noting..."
              className="min-h-[100px] resize-none"
            />
          </div>

          {formError && (
            <p className="text-sm text-destructive">{formError}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={closeEditModal}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleEditPromotion}
              isLoading={isSubmitting}
            >
              {!isSubmitting && "Save Changes"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={!!deletingPromotion}
        onClose={() => setDeletingPromotion(null)}
        onConfirm={handleDeletePromotion}
        title="Delete Promotion Record?"
        description={`This will remove the promotion to "${deletingPromotion?.toRole}" from ${employee.name}'s career history.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={isSubmitting}
      />

      {/* Role Assignment Modal */}
      <Modal
        open={isRoleModalOpen}
        onClose={closeRoleModal}
        title="Manage Roles"
        description={`Select roles for ${employee.name}`}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-foreground-muted">
            A person can have multiple roles. Changes take effect immediately after saving.
          </p>

          {/* Role Selection */}
          <div className="space-y-2">
            {availableRoles.map((role) => {
              const isSelected = pendingRoles.includes(role.id);
              return (
                <button
                  key={role.id}
                  onClick={() => togglePendingRole(role.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                    isSelected
                      ? "bg-primary-muted/30 border-primary/30"
                      : "bg-secondary/30 border-border hover:border-primary/20"
                  )}
                >
                  <div className={cn(
                    "h-5 w-5 rounded border-2 flex items-center justify-center transition-colors shrink-0",
                    isSelected ? "bg-primary border-primary" : "border-border"
                  )}>
                    {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                  <div className={cn("flex-1", role.color)}>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <p className="font-medium text-foreground">{role.name}</p>
                    </div>
                    <p className="text-xs text-foreground-muted">{role.description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Changes Summary */}
          {JSON.stringify(pendingRoles.sort()) !== JSON.stringify(employeeRoles.sort()) && (
            <div className="p-3 rounded-lg bg-warning-muted/20 border border-warning/10">
              <p className="text-sm text-foreground">
                <span className="font-medium">Changes:</span>{" "}
                {pendingRoles.length > employeeRoles.length
                  ? `Adding ${pendingRoles.filter((r) => !employeeRoles.includes(r)).map((r) => availableRoles.find((ar) => ar.id === r)?.name).join(", ")}`
                  : pendingRoles.length < employeeRoles.length
                  ? `Removing ${employeeRoles.filter((r) => !pendingRoles.includes(r)).map((r) => availableRoles.find((ar) => ar.id === r)?.name).join(", ")}`
                  : "Role changes"}
              </p>
            </div>
          )}

          {pendingRoles.length === 0 && (
            <p className="text-sm text-destructive">
              At least one role must be selected.
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={closeRoleModal}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSaveRoles}
              disabled={pendingRoles.length === 0 || isSavingRoles}
            >
              {isSavingRoles ? "Saving..." : "Save Roles"}
            </Button>
          </div>
        </div>
      </Modal>
    </StaggerContainer>
  );
}

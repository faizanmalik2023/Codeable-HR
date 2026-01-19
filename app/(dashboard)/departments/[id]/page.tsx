"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Users,
  User,
  Pencil,
  Archive,
  UserCog,
  MapPin,
  Mail,
  MoreHorizontal,
  UserMinus,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal, ConfirmModal } from "@/components/ui/modal";
import { StaggerContainer, StaggerItem } from "@/components/animations/fade-in";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

// Types
type EmployeeStatus = "active" | "on_leave" | "remote";

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  status: EmployeeStatus;
  location: string;
  avatar?: string;
}

interface Department {
  id: string;
  name: string;
  description?: string;
  head?: Employee;
  employees: Employee[];
  isArchived: boolean;
  createdAt: string;
}

// Mock data
const mockDepartments: Record<string, Department> = {
  dept1: {
    id: "dept1",
    name: "Engineering",
    description: "Building and maintaining our core product and infrastructure",
    head: {
      id: "emp1",
      name: "Alice Cooper",
      email: "alice.cooper@codeable.com",
      role: "Engineering Lead",
      status: "active",
      location: "San Francisco",
    },
    employees: [
      { id: "emp1", name: "Alice Cooper", email: "alice.cooper@codeable.com", role: "Engineering Lead", status: "active", location: "San Francisco" },
      { id: "emp2", name: "Bob Smith", email: "bob.smith@codeable.com", role: "Senior Developer", status: "remote", location: "Remote" },
      { id: "emp4", name: "David Brown", email: "david.brown@codeable.com", role: "Developer", status: "on_leave", location: "San Francisco" },
      { id: "emp6", name: "Frank Miller", email: "frank.miller@codeable.com", role: "Developer", status: "active", location: "San Francisco" },
      { id: "emp8", name: "Henry Chen", email: "henry.chen@codeable.com", role: "DevOps Engineer", status: "remote", location: "Remote" },
    ],
    isArchived: false,
    createdAt: "2023-01-15",
  },
  dept2: {
    id: "dept2",
    name: "Design",
    description: "Creating beautiful and intuitive user experiences",
    head: {
      id: "emp3",
      name: "Carol White",
      email: "carol.white@codeable.com",
      role: "Lead Designer",
      status: "active",
      location: "New York",
    },
    employees: [
      { id: "emp3", name: "Carol White", email: "carol.white@codeable.com", role: "Lead Designer", status: "active", location: "New York" },
      { id: "emp9", name: "Ivy Zhang", email: "ivy.zhang@codeable.com", role: "UI Designer", status: "active", location: "New York" },
      { id: "emp10", name: "Jack Wilson", email: "jack.wilson@codeable.com", role: "UX Researcher", status: "remote", location: "Remote" },
    ],
    isArchived: false,
    createdAt: "2023-01-15",
  },
  dept3: {
    id: "dept3",
    name: "Product",
    description: "Defining product strategy and roadmap",
    head: {
      id: "emp7",
      name: "Grace Lee",
      email: "grace.lee@codeable.com",
      role: "Product Manager",
      status: "active",
      location: "New York",
    },
    employees: [
      { id: "emp7", name: "Grace Lee", email: "grace.lee@codeable.com", role: "Product Manager", status: "active", location: "New York" },
      { id: "emp11", name: "Kevin Park", email: "kevin.park@codeable.com", role: "Associate PM", status: "active", location: "San Francisco" },
    ],
    isArchived: false,
    createdAt: "2023-02-01",
  },
  dept4: {
    id: "dept4",
    name: "Quality Assurance",
    description: "Ensuring product quality and reliability",
    head: {
      id: "emp5",
      name: "Emma Wilson",
      email: "emma.wilson@codeable.com",
      role: "QA Lead",
      status: "remote",
      location: "Remote",
    },
    employees: [
      { id: "emp5", name: "Emma Wilson", email: "emma.wilson@codeable.com", role: "QA Lead", status: "remote", location: "Remote" },
      { id: "emp12", name: "Lisa Chen", email: "lisa.chen@codeable.com", role: "QA Engineer", status: "active", location: "San Francisco" },
    ],
    isArchived: false,
    createdAt: "2023-03-10",
  },
  dept5: {
    id: "dept5",
    name: "Human Resources",
    description: "Supporting our people and culture",
    employees: [
      { id: "emp13", name: "Maria Garcia", email: "maria.garcia@codeable.com", role: "HR Manager", status: "active", location: "San Francisco" },
      { id: "emp14", name: "Nina Patel", email: "nina.patel@codeable.com", role: "HR Coordinator", status: "active", location: "San Francisco" },
    ],
    isArchived: false,
    createdAt: "2023-01-15",
  },
};

const statusConfig: Record<EmployeeStatus, { label: string; color: string; bg: string }> = {
  active: { label: "Active", color: "text-success", bg: "bg-success" },
  on_leave: { label: "On Leave", color: "text-warning", bg: "bg-warning" },
  remote: { label: "Remote", color: "text-primary", bg: "bg-primary" },
};

export default function DepartmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const departmentId = params.id as string;

  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);
  const [department, setDepartment] = React.useState<Department | null>(null);

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isChangeHeadModalOpen, setIsChangeHeadModalOpen] = React.useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = React.useState(false);
  const [activeDropdown, setActiveDropdown] = React.useState<string | null>(null);

  // Form states
  const [formName, setFormName] = React.useState("");
  const [formDescription, setFormDescription] = React.useState("");
  const [selectedHeadId, setSelectedHeadId] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState("");

  // Load department data
  React.useEffect(() => {
    const timer = setTimeout(() => {
      const dept = mockDepartments[departmentId];
      if (dept) {
        setDepartment(dept);
      } else {
        setHasError(true);
      }
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [departmentId]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    if (activeDropdown) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [activeDropdown]);

  // Open edit modal
  const openEditModal = () => {
    if (!department) return;
    setFormName(department.name);
    setFormDescription(department.description || "");
    setFormError("");
    setIsEditModalOpen(true);
  };

  // Open change head modal
  const openChangeHeadModal = () => {
    if (!department) return;
    setSelectedHeadId(department.head?.id || "");
    setIsChangeHeadModalOpen(true);
  };

  // Handle edit
  const handleEdit = async () => {
    if (!department) return;
    if (!formName.trim()) {
      setFormError("Department name is required");
      return;
    }

    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));

    setDepartment({
      ...department,
      name: formName.trim(),
      description: formDescription.trim() || undefined,
    });

    setIsSubmitting(false);
    setIsEditModalOpen(false);
  };

  // Handle change head
  const handleChangeHead = async () => {
    if (!department) return;

    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));

    const newHead = selectedHeadId
      ? department.employees.find((e) => e.id === selectedHeadId)
      : undefined;

    setDepartment({
      ...department,
      head: newHead,
    });

    setIsSubmitting(false);
    setIsChangeHeadModalOpen(false);
  };

  // Handle archive
  const handleArchive = async () => {
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsSubmitting(false);
    setIsArchiveModalOpen(false);
    router.push("/departments");
  };

  // Retry on error
  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    setTimeout(() => {
      const dept = mockDepartments[departmentId];
      if (dept) {
        setDepartment(dept);
      } else {
        setHasError(true);
      }
      setIsLoading(false);
    }, 500);
  };

  if (hasError) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <ErrorState
          title="Department not found"
          message="We couldn't find this department. It may have been removed or you don't have access."
          onRetry={handleRetry}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <StaggerContainer className="space-y-6">
        <StaggerItem>
          <div className="flex items-center gap-4">
            <Skeleton variant="circular" className="h-10 w-10" />
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" className="h-6 w-48" />
              <Skeleton variant="text" className="h-4 w-32" />
            </div>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="p-6 rounded-xl border border-border bg-card space-y-4">
            <Skeleton variant="text" className="h-5 w-24" />
            <Skeleton variant="text" className="h-4 w-full" />
            <Skeleton variant="text" className="h-4 w-3/4" />
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 rounded-xl border border-border bg-card">
                <div className="flex items-center gap-4">
                  <Skeleton variant="circular" className="h-10 w-10" />
                  <div className="flex-1 space-y-2">
                    <Skeleton variant="text" className="h-5 w-32" />
                    <Skeleton variant="text" className="h-4 w-48" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </StaggerItem>
      </StaggerContainer>
    );
  }

  if (!department) return null;

  return (
    <StaggerContainer className="space-y-6">
      {/* Header */}
      <StaggerItem>
        <div className="flex items-center gap-4">
          <Link href="/departments">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-muted">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-foreground">
                  {department.name}
                </h1>
                <p className="text-sm text-foreground-muted">
                  {department.employees.length} team {department.employees.length === 1 ? "member" : "members"}
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={openEditModal}>
              <Pencil className="h-4 w-4" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
            <Button
              variant="outline"
              className="gap-2 text-destructive hover:text-destructive hover:bg-destructive-muted"
              onClick={() => setIsArchiveModalOpen(true)}
            >
              <Archive className="h-4 w-4" />
              <span className="hidden sm:inline">Archive</span>
            </Button>
          </div>
        </div>
      </StaggerItem>

      {/* Department Info Card */}
      <StaggerItem>
        <Card>
          <CardContent className="p-6 space-y-4">
            {department.description && (
              <div>
                <h3 className="text-sm font-medium text-foreground-muted mb-2">About</h3>
                <p className="text-foreground">{department.description}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2">
              {/* Department Head */}
              <div className="flex-1">
                <h3 className="text-sm font-medium text-foreground-muted mb-2">Department Head</h3>
                {department.head ? (
                  <div className="flex items-center gap-3">
                    <Avatar name={department.head.name} size="md" />
                    <div>
                      <p className="font-medium text-foreground">{department.head.name}</p>
                      <p className="text-sm text-foreground-muted">{department.head.role}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-foreground-muted italic">No head assigned</p>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="gap-2 self-start"
                onClick={openChangeHeadModal}
              >
                <UserCog className="h-4 w-4" />
                {department.head ? "Change Head" : "Assign Head"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </StaggerItem>

      {/* Team Members Section */}
      <StaggerItem>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Team Members</h2>
          <Badge variant="muted" className="gap-1">
            <Users className="h-3 w-3" />
            {department.employees.length}
          </Badge>
        </div>
      </StaggerItem>

      {department.employees.length === 0 ? (
        <StaggerItem>
          <EmptyState
            icon={Users}
            title="No team members yet"
            description="People will appear here when they're added to this department."
          />
        </StaggerItem>
      ) : (
        <div className="space-y-2">
          {department.employees.map((employee, index) => (
            <StaggerItem key={employee.id} index={index}>
              <Card className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Avatar with status indicator */}
                    <div className="relative">
                      <Avatar name={employee.name} size="md" />
                      <span
                        className={cn(
                          "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card",
                          statusConfig[employee.status].bg
                        )}
                      />
                    </div>

                    {/* Employee Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-foreground">{employee.name}</h3>
                        {department.head?.id === employee.id && (
                          <Badge variant="muted" className="text-xs gap-1">
                            <User className="h-3 w-3" />
                            Head
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-foreground-muted">{employee.role}</p>
                    </div>

                    {/* Meta info - hidden on mobile */}
                    <div className="hidden md:flex items-center gap-6 text-sm text-foreground-muted">
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {employee.email}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {employee.location}
                      </div>
                      <Badge
                        className={cn(
                          "text-xs",
                          statusConfig[employee.status].color,
                          `${statusConfig[employee.status].bg}/20`
                        )}
                      >
                        {statusConfig[employee.status].label}
                      </Badge>
                    </div>

                    {/* Actions */}
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdown(activeDropdown === employee.id ? null : employee.id);
                        }}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>

                      {activeDropdown === employee.id && (
                        <div
                          className="absolute right-0 top-full mt-1 z-10 w-44 rounded-lg border border-border bg-card shadow-lg py-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link
                            href={`/people/${employee.id}`}
                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary transition-colors"
                          >
                            <ChevronRight className="h-4 w-4" />
                            View Profile
                          </Link>
                          {department.head?.id !== employee.id && (
                            <button
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-secondary transition-colors"
                              onClick={() => {
                                setSelectedHeadId(employee.id);
                                setIsChangeHeadModalOpen(true);
                                setActiveDropdown(null);
                              }}
                            >
                              <UserCog className="h-4 w-4" />
                              Make Head
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mobile meta info */}
                  <div className="flex flex-wrap items-center gap-2 mt-3 md:hidden">
                    <Badge
                      className={cn(
                        "text-xs",
                        statusConfig[employee.status].color,
                        `${statusConfig[employee.status].bg}/20`
                      )}
                    >
                      {statusConfig[employee.status].label}
                    </Badge>
                    <span className="text-xs text-foreground-subtle flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {employee.location}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </div>
      )}

      {/* Edit Department Modal */}
      <Modal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Department"
        description="Update department details"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Department Name <span className="text-destructive">*</span>
            </label>
            <Input
              value={formName}
              onChange={(e) => {
                setFormName(e.target.value);
                setFormError("");
              }}
              placeholder="e.g., Marketing"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Description
            </label>
            <Textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="What does this team do?"
              className="min-h-[80px] resize-none"
            />
          </div>

          {formError && (
            <p className="text-sm text-destructive">{formError}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleEdit}
              isLoading={isSubmitting}
            >
              {!isSubmitting && "Save Changes"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Change Head Modal */}
      <Modal
        open={isChangeHeadModalOpen}
        onClose={() => setIsChangeHeadModalOpen(false)}
        title="Change Department Head"
        description="Select a team member to lead this department"
        size="sm"
      >
        <div className="space-y-4">
          <div className="space-y-2 max-h-64 overflow-y-auto">
            <label
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                !selectedHeadId
                  ? "border-primary bg-primary-muted/30"
                  : "border-border hover:border-primary/30"
              )}
            >
              <input
                type="radio"
                name="head"
                value=""
                checked={!selectedHeadId}
                onChange={() => setSelectedHeadId("")}
                className="sr-only"
              />
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                <User className="h-5 w-5 text-foreground-muted" />
              </div>
              <div>
                <p className="font-medium text-foreground">No Head</p>
                <p className="text-sm text-foreground-muted">Remove current head</p>
              </div>
            </label>

            {department.employees.map((employee) => (
              <label
                key={employee.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                  selectedHeadId === employee.id
                    ? "border-primary bg-primary-muted/30"
                    : "border-border hover:border-primary/30"
                )}
              >
                <input
                  type="radio"
                  name="head"
                  value={employee.id}
                  checked={selectedHeadId === employee.id}
                  onChange={() => setSelectedHeadId(employee.id)}
                  className="sr-only"
                />
                <Avatar name={employee.name} size="md" />
                <div className="flex-1">
                  <p className="font-medium text-foreground">{employee.name}</p>
                  <p className="text-sm text-foreground-muted">{employee.role}</p>
                </div>
                {department.head?.id === employee.id && (
                  <Badge variant="muted" className="text-xs">Current</Badge>
                )}
              </label>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsChangeHeadModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleChangeHead}
              isLoading={isSubmitting}
            >
              {!isSubmitting && "Update Head"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Archive Confirmation Modal */}
      <ConfirmModal
        open={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        onConfirm={handleArchive}
        title={`Archive ${department.name}?`}
        description="This department will be hidden from the list. Team members won't be affected and you can restore it later."
        confirmLabel="Archive Department"
        variant="destructive"
        isLoading={isSubmitting}
      />
    </StaggerContainer>
  );
}

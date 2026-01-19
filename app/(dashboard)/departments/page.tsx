"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Building2,
  Users,
  User,
  Plus,
  MoreHorizontal,
  Pencil,
  Archive,
  ArrowUpDown,
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
interface Employee {
  id: string;
  name: string;
  role: string;
  avatar?: string;
}

interface Department {
  id: string;
  name: string;
  description?: string;
  head?: Employee;
  employeeCount: number;
  isArchived: boolean;
  createdAt: string;
}

// Mock data - employees for department head selection
const allEmployees: Employee[] = [
  { id: "emp1", name: "Alice Cooper", role: "Senior Developer" },
  { id: "emp2", name: "Bob Smith", role: "Developer" },
  { id: "emp3", name: "Carol White", role: "Lead Designer" },
  { id: "emp4", name: "David Brown", role: "Developer" },
  { id: "emp5", name: "Emma Wilson", role: "QA Engineer" },
  { id: "emp6", name: "Frank Miller", role: "Developer" },
  { id: "emp7", name: "Grace Lee", role: "Product Manager" },
  { id: "emp8", name: "Henry Chen", role: "DevOps Engineer" },
];

// Mock departments data
const initialDepartments: Department[] = [
  {
    id: "dept1",
    name: "Engineering",
    description: "Building and maintaining our core product and infrastructure",
    head: { id: "emp1", name: "Alice Cooper", role: "Senior Developer" },
    employeeCount: 12,
    isArchived: false,
    createdAt: "2023-01-15",
  },
  {
    id: "dept2",
    name: "Design",
    description: "Creating beautiful and intuitive user experiences",
    head: { id: "emp3", name: "Carol White", role: "Lead Designer" },
    employeeCount: 5,
    isArchived: false,
    createdAt: "2023-01-15",
  },
  {
    id: "dept3",
    name: "Product",
    description: "Defining product strategy and roadmap",
    head: { id: "emp7", name: "Grace Lee", role: "Product Manager" },
    employeeCount: 3,
    isArchived: false,
    createdAt: "2023-02-01",
  },
  {
    id: "dept4",
    name: "Quality Assurance",
    description: "Ensuring product quality and reliability",
    head: { id: "emp5", name: "Emma Wilson", role: "QA Engineer" },
    employeeCount: 4,
    isArchived: false,
    createdAt: "2023-03-10",
  },
  {
    id: "dept5",
    name: "Human Resources",
    description: "Supporting our people and culture",
    employeeCount: 2,
    isArchived: false,
    createdAt: "2023-01-15",
  },
];

type SortOption = "name" | "size";

export default function DepartmentsPage() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);
  const [departments, setDepartments] = React.useState<Department[]>(initialDepartments);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortBy, setSortBy] = React.useState<SortOption>("name");

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [editingDepartment, setEditingDepartment] = React.useState<Department | null>(null);
  const [archivingDepartment, setArchivingDepartment] = React.useState<Department | null>(null);
  const [activeDropdown, setActiveDropdown] = React.useState<string | null>(null);

  // Form states
  const [formName, setFormName] = React.useState("");
  const [formDescription, setFormDescription] = React.useState("");
  const [formHeadId, setFormHeadId] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState("");

  // Simulate initial loading
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    if (activeDropdown) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [activeDropdown]);

  // Filter and sort departments
  const activeDepartments = departments.filter((d) => !d.isArchived);

  const filteredDepartments = activeDepartments
    .filter((dept) =>
      dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dept.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      return b.employeeCount - a.employeeCount;
    });

  // Reset form
  const resetForm = () => {
    setFormName("");
    setFormDescription("");
    setFormHeadId("");
    setFormError("");
  };

  // Open edit modal
  const openEditModal = (dept: Department) => {
    setEditingDepartment(dept);
    setFormName(dept.name);
    setFormDescription(dept.description || "");
    setFormHeadId(dept.head?.id || "");
    setFormError("");
  };

  // Close modals
  const closeAddModal = () => {
    setIsAddModalOpen(false);
    resetForm();
  };

  const closeEditModal = () => {
    setEditingDepartment(null);
    resetForm();
  };

  // Validate unique name
  const isNameUnique = (name: string, excludeId?: string) => {
    return !departments.some(
      (d) => d.name.toLowerCase() === name.toLowerCase() && d.id !== excludeId && !d.isArchived
    );
  };

  // Add department
  const handleAddDepartment = async () => {
    if (!formName.trim()) {
      setFormError("Department name is required");
      return;
    }
    if (!isNameUnique(formName.trim())) {
      setFormError("A department with this name already exists");
      return;
    }

    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));

    const head = formHeadId ? allEmployees.find((e) => e.id === formHeadId) : undefined;

    const newDept: Department = {
      id: `dept${Date.now()}`,
      name: formName.trim(),
      description: formDescription.trim() || undefined,
      head,
      employeeCount: 0,
      isArchived: false,
      createdAt: new Date().toISOString(),
    };

    setDepartments((prev) => [...prev, newDept]);
    setIsSubmitting(false);
    closeAddModal();
  };

  // Edit department
  const handleEditDepartment = async () => {
    if (!editingDepartment) return;
    if (!formName.trim()) {
      setFormError("Department name is required");
      return;
    }
    if (!isNameUnique(formName.trim(), editingDepartment.id)) {
      setFormError("A department with this name already exists");
      return;
    }

    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));

    const head = formHeadId ? allEmployees.find((e) => e.id === formHeadId) : undefined;

    setDepartments((prev) =>
      prev.map((d) =>
        d.id === editingDepartment.id
          ? {
              ...d,
              name: formName.trim(),
              description: formDescription.trim() || undefined,
              head,
            }
          : d
      )
    );

    setIsSubmitting(false);
    closeEditModal();
  };

  // Archive department
  const handleArchiveDepartment = async () => {
    if (!archivingDepartment) return;
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));

    setDepartments((prev) =>
      prev.map((d) =>
        d.id === archivingDepartment.id ? { ...d, isArchived: true } : d
      )
    );

    setIsSubmitting(false);
    setArchivingDepartment(null);
  };

  // Retry on error
  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 500);
  };

  // Toggle sort
  const toggleSort = () => {
    setSortBy((prev) => (prev === "name" ? "size" : "name"));
  };

  if (hasError) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <ErrorState
          title="Couldn't load departments"
          message="We had trouble loading the departments list. Please try again."
          onRetry={handleRetry}
        />
      </div>
    );
  }

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
              Departments
            </h1>
            <p className="text-sm text-foreground-muted">
              Organize your teams and structure
            </p>
          </div>
          <Button className="gap-2" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Department</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </StaggerItem>

      {/* Stats Overview */}
      <StaggerItem>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-primary-muted/30 border border-primary/10">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-4 w-4 text-primary" />
              <span className="text-sm text-foreground-muted">Departments</span>
            </div>
            <p className="text-2xl font-bold text-primary">{activeDepartments.length}</p>
          </div>
          <div className="p-4 rounded-xl bg-accent-muted/30 border border-accent/10">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-accent" />
              <span className="text-sm text-foreground-muted">Total People</span>
            </div>
            <p className="text-2xl font-bold text-accent">
              {activeDepartments.reduce((sum, d) => sum + d.employeeCount, 0)}
            </p>
          </div>
        </div>
      </StaggerItem>

      {/* Search and Sort */}
      <StaggerItem>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
            <Input
              placeholder="Search departments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            className="gap-2 shrink-0"
            onClick={toggleSort}
          >
            <ArrowUpDown className="h-4 w-4" />
            <span className="hidden sm:inline">
              {sortBy === "name" ? "Name" : "Size"}
            </span>
          </Button>
        </div>
      </StaggerItem>

      {/* Departments List */}
      {isLoading ? (
        <StaggerItem>
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="p-5 rounded-[var(--radius-lg)] border border-border bg-card"
              >
                <div className="flex items-start gap-4">
                  <Skeleton variant="default" className="h-12 w-12 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton variant="text" className="h-5 w-32" />
                    <Skeleton variant="text" className="h-4 w-full" />
                    <div className="flex gap-2 pt-2">
                      <Skeleton variant="default" className="h-6 w-20 rounded-full" />
                      <Skeleton variant="default" className="h-6 w-24 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </StaggerItem>
      ) : filteredDepartments.length === 0 ? (
        <StaggerItem>
          {searchQuery ? (
            <EmptyState
              icon={Search}
              title="No departments found"
              description="Try a different search term to find what you're looking for."
              variant="search"
            />
          ) : (
            <EmptyState
              icon={Building2}
              title="No departments yet"
              description="Create your first team to start organizing your people."
              action={{
                label: "Add Department",
                onClick: () => setIsAddModalOpen(true),
              }}
            />
          )}
        </StaggerItem>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredDepartments.map((dept, index) => (
            <StaggerItem key={dept.id} index={index}>
              <Card className="hover:border-primary/30 transition-colors h-full">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Department Icon */}
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-muted">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/departments/${dept.id}`}
                          className="group flex-1"
                        >
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {dept.name}
                          </h3>
                        </Link>

                        {/* Actions dropdown */}
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdown(activeDropdown === dept.id ? null : dept.id);
                            }}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>

                          {activeDropdown === dept.id && (
                            <div
                              className="absolute right-0 top-full mt-1 z-10 w-40 rounded-lg border border-border bg-card shadow-lg py-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Link
                                href={`/departments/${dept.id}`}
                                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary transition-colors"
                              >
                                <ChevronRight className="h-4 w-4" />
                                View Details
                              </Link>
                              <button
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-secondary transition-colors"
                                onClick={() => {
                                  openEditModal(dept);
                                  setActiveDropdown(null);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                                Edit
                              </button>
                              <button
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive-muted transition-colors"
                                onClick={() => {
                                  setArchivingDepartment(dept);
                                  setActiveDropdown(null);
                                }}
                              >
                                <Archive className="h-4 w-4" />
                                Archive
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {dept.description && (
                        <p className="text-sm text-foreground-muted mt-1 line-clamp-2">
                          {dept.description}
                        </p>
                      )}

                      {/* Meta info */}
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <Badge variant="muted" className="gap-1">
                          <Users className="h-3 w-3" />
                          {dept.employeeCount} {dept.employeeCount === 1 ? "person" : "people"}
                        </Badge>
                        {dept.head && (
                          <div className="flex items-center gap-1.5 text-xs text-foreground-muted">
                            <Avatar name={dept.head.name} size="xs" />
                            <span>{dept.head.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </div>
      )}

      {/* Add Department Modal */}
      <Modal
        open={isAddModalOpen}
        onClose={closeAddModal}
        title="Add Department"
        description="Create a new team for your organization"
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
              autoFocus
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

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Department Head
            </label>
            <select
              value={formHeadId}
              onChange={(e) => setFormHeadId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">No head assigned</option>
              {allEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} — {emp.role}
                </option>
              ))}
            </select>
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
              className="flex-1"
              onClick={handleAddDepartment}
              isLoading={isSubmitting}
            >
              {!isSubmitting && "Create Department"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Department Modal */}
      <Modal
        open={!!editingDepartment}
        onClose={closeEditModal}
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

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Department Head
            </label>
            <select
              value={formHeadId}
              onChange={(e) => setFormHeadId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">No head assigned</option>
              {allEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} — {emp.role}
                </option>
              ))}
            </select>
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
              onClick={handleEditDepartment}
              isLoading={isSubmitting}
            >
              {!isSubmitting && "Save Changes"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Archive Confirmation Modal */}
      <ConfirmModal
        open={!!archivingDepartment}
        onClose={() => setArchivingDepartment(null)}
        onConfirm={handleArchiveDepartment}
        title={`Archive ${archivingDepartment?.name}?`}
        description="This department will be hidden from the list. You can restore it later if needed. Team members won't be affected."
        confirmLabel="Archive"
        variant="destructive"
        isLoading={isSubmitting}
      />
    </StaggerContainer>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  FileText,
  Plus,
  MoreHorizontal,
  Pencil,
  Archive,
  Upload,
  Eye,
  Calendar,
  Users,
  Lock,
  ChevronRight,
  BookOpen,
  Shield,
  Briefcase,
  Building2,
  Download,
  File,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal, ConfirmModal } from "@/components/ui/modal";
import { StaggerContainer, StaggerItem } from "@/components/animations/fade-in";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { formatDate, cn } from "@/lib/utils";

// Types
type PolicyCategory = "HR" | "Security" | "Finance" | "General" | "Operations";
type PolicyVisibility = "all" | "restricted";

interface PolicyVersion {
  version: string;
  uploadedBy: string;
  uploadedAt: string;
  fileName: string;
  fileSize: string;
}

interface Policy {
  id: string;
  title: string;
  description?: string;
  category: PolicyCategory;
  visibility: PolicyVisibility;
  currentVersion: string;
  lastUpdated: string;
  updatedBy: string;
  fileName: string;
  fileSize: string;
  versions: PolicyVersion[];
  isArchived: boolean;
}

// Mock data
const initialPolicies: Policy[] = [
  {
    id: "pol1",
    title: "Employee Handbook",
    description: "Comprehensive guide covering company culture, expectations, benefits, and workplace policies.",
    category: "HR",
    visibility: "all",
    currentVersion: "3.2",
    lastUpdated: "2024-01-10",
    updatedBy: "Emily HR",
    fileName: "employee-handbook-v3.2.pdf",
    fileSize: "2.4 MB",
    versions: [
      { version: "3.2", uploadedBy: "Emily HR", uploadedAt: "2024-01-10", fileName: "employee-handbook-v3.2.pdf", fileSize: "2.4 MB" },
      { version: "3.1", uploadedBy: "Emily HR", uploadedAt: "2023-09-15", fileName: "employee-handbook-v3.1.pdf", fileSize: "2.3 MB" },
      { version: "3.0", uploadedBy: "Sarah Manager", uploadedAt: "2023-06-01", fileName: "employee-handbook-v3.0.pdf", fileSize: "2.2 MB" },
    ],
    isArchived: false,
  },
  {
    id: "pol2",
    title: "Remote Work Policy",
    description: "Guidelines for working remotely, including expectations, equipment, and communication standards.",
    category: "HR",
    visibility: "all",
    currentVersion: "2.0",
    lastUpdated: "2024-01-05",
    updatedBy: "Emily HR",
    fileName: "remote-work-policy-v2.0.pdf",
    fileSize: "845 KB",
    versions: [
      { version: "2.0", uploadedBy: "Emily HR", uploadedAt: "2024-01-05", fileName: "remote-work-policy-v2.0.pdf", fileSize: "845 KB" },
      { version: "1.0", uploadedBy: "Emily HR", uploadedAt: "2023-03-15", fileName: "remote-work-policy-v1.0.pdf", fileSize: "720 KB" },
    ],
    isArchived: false,
  },
  {
    id: "pol3",
    title: "Information Security Policy",
    description: "Security protocols, data handling procedures, and incident reporting guidelines.",
    category: "Security",
    visibility: "all",
    currentVersion: "4.1",
    lastUpdated: "2023-12-20",
    updatedBy: "IT Security",
    fileName: "security-policy-v4.1.pdf",
    fileSize: "1.8 MB",
    versions: [
      { version: "4.1", uploadedBy: "IT Security", uploadedAt: "2023-12-20", fileName: "security-policy-v4.1.pdf", fileSize: "1.8 MB" },
    ],
    isArchived: false,
  },
  {
    id: "pol4",
    title: "Expense Reimbursement Guide",
    description: "Process for submitting expenses, approved categories, and reimbursement timelines.",
    category: "Finance",
    visibility: "all",
    currentVersion: "1.3",
    lastUpdated: "2023-11-15",
    updatedBy: "Finance Team",
    fileName: "expense-guide-v1.3.pdf",
    fileSize: "520 KB",
    versions: [
      { version: "1.3", uploadedBy: "Finance Team", uploadedAt: "2023-11-15", fileName: "expense-guide-v1.3.pdf", fileSize: "520 KB" },
    ],
    isArchived: false,
  },
  {
    id: "pol5",
    title: "Code of Conduct",
    description: "Expected behavior, ethics guidelines, and professional standards for all employees.",
    category: "General",
    visibility: "all",
    currentVersion: "2.1",
    lastUpdated: "2023-10-01",
    updatedBy: "Emily HR",
    fileName: "code-of-conduct-v2.1.pdf",
    fileSize: "680 KB",
    versions: [
      { version: "2.1", uploadedBy: "Emily HR", uploadedAt: "2023-10-01", fileName: "code-of-conduct-v2.1.pdf", fileSize: "680 KB" },
    ],
    isArchived: false,
  },
  {
    id: "pol6",
    title: "Executive Compensation Structure",
    description: "Detailed compensation framework for executive-level positions.",
    category: "Finance",
    visibility: "restricted",
    currentVersion: "1.0",
    lastUpdated: "2023-08-20",
    updatedBy: "Finance Team",
    fileName: "exec-compensation-v1.0.pdf",
    fileSize: "340 KB",
    versions: [
      { version: "1.0", uploadedBy: "Finance Team", uploadedAt: "2023-08-20", fileName: "exec-compensation-v1.0.pdf", fileSize: "340 KB" },
    ],
    isArchived: false,
  },
];

const categories: PolicyCategory[] = ["HR", "Security", "Finance", "General", "Operations"];

const categoryConfig: Record<PolicyCategory, { icon: React.ReactNode; color: string; bg: string }> = {
  HR: { icon: <Users className="h-4 w-4" />, color: "text-primary", bg: "bg-primary-muted" },
  Security: { icon: <Shield className="h-4 w-4" />, color: "text-warning", bg: "bg-warning-muted" },
  Finance: { icon: <Briefcase className="h-4 w-4" />, color: "text-success", bg: "bg-success-muted" },
  General: { icon: <BookOpen className="h-4 w-4" />, color: "text-accent", bg: "bg-accent-muted" },
  Operations: { icon: <Building2 className="h-4 w-4" />, color: "text-foreground-muted", bg: "bg-secondary" },
};

export default function HRPoliciesPage() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);
  const [policies, setPolicies] = React.useState<Policy[]>(initialPolicies);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<PolicyCategory | "All">("All");

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [editingPolicy, setEditingPolicy] = React.useState<Policy | null>(null);
  const [uploadingVersionPolicy, setUploadingVersionPolicy] = React.useState<Policy | null>(null);
  const [archivingPolicy, setArchivingPolicy] = React.useState<Policy | null>(null);
  const [activeDropdown, setActiveDropdown] = React.useState<string | null>(null);

  // Form states
  const [formTitle, setFormTitle] = React.useState("");
  const [formDescription, setFormDescription] = React.useState("");
  const [formCategory, setFormCategory] = React.useState<PolicyCategory>("General");
  const [formVisibility, setFormVisibility] = React.useState<PolicyVisibility>("all");
  const [formFile, setFormFile] = React.useState<File | null>(null);
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

  // Filter policies
  const activePolicies = policies.filter((p) => !p.isArchived);
  const filteredPolicies = activePolicies
    .filter((policy) => {
      const matchesSearch =
        policy.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        policy.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "All" || policy.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());

  // Reset form
  const resetForm = () => {
    setFormTitle("");
    setFormDescription("");
    setFormCategory("General");
    setFormVisibility("all");
    setFormFile(null);
    setFormError("");
  };

  // Open edit modal
  const openEditModal = (policy: Policy) => {
    setEditingPolicy(policy);
    setFormTitle(policy.title);
    setFormDescription(policy.description || "");
    setFormCategory(policy.category);
    setFormVisibility(policy.visibility);
    setFormFile(null);
    setFormError("");
  };

  // Close modals
  const closeAddModal = () => {
    setIsAddModalOpen(false);
    resetForm();
  };

  const closeEditModal = () => {
    setEditingPolicy(null);
    resetForm();
  };

  const closeUploadModal = () => {
    setUploadingVersionPolicy(null);
    setFormFile(null);
    setFormError("");
  };

  // Add policy
  const handleAddPolicy = async () => {
    if (!formTitle.trim()) {
      setFormError("Title is required");
      return;
    }
    if (!formFile) {
      setFormError("Please upload a document");
      return;
    }

    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1000));

    const newPolicy: Policy = {
      id: `pol${Date.now()}`,
      title: formTitle.trim(),
      description: formDescription.trim() || undefined,
      category: formCategory,
      visibility: formVisibility,
      currentVersion: "1.0",
      lastUpdated: new Date().toISOString().split("T")[0],
      updatedBy: "HR Manager",
      fileName: formFile.name,
      fileSize: `${(formFile.size / 1024).toFixed(0)} KB`,
      versions: [
        {
          version: "1.0",
          uploadedBy: "HR Manager",
          uploadedAt: new Date().toISOString().split("T")[0],
          fileName: formFile.name,
          fileSize: `${(formFile.size / 1024).toFixed(0)} KB`,
        },
      ],
      isArchived: false,
    };

    setPolicies((prev) => [newPolicy, ...prev]);
    setIsSubmitting(false);
    closeAddModal();
  };

  // Edit policy metadata
  const handleEditPolicy = async () => {
    if (!editingPolicy) return;
    if (!formTitle.trim()) {
      setFormError("Title is required");
      return;
    }

    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));

    setPolicies((prev) =>
      prev.map((p) =>
        p.id === editingPolicy.id
          ? {
              ...p,
              title: formTitle.trim(),
              description: formDescription.trim() || undefined,
              category: formCategory,
              visibility: formVisibility,
            }
          : p
      )
    );

    setIsSubmitting(false);
    closeEditModal();
  };

  // Upload new version
  const handleUploadVersion = async () => {
    if (!uploadingVersionPolicy || !formFile) {
      setFormError("Please select a file to upload");
      return;
    }

    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1000));

    const currentVersionNum = parseFloat(uploadingVersionPolicy.currentVersion);
    const newVersion = (currentVersionNum + 0.1).toFixed(1);

    const newVersionEntry: PolicyVersion = {
      version: newVersion,
      uploadedBy: "HR Manager",
      uploadedAt: new Date().toISOString().split("T")[0],
      fileName: formFile.name,
      fileSize: `${(formFile.size / 1024).toFixed(0)} KB`,
    };

    setPolicies((prev) =>
      prev.map((p) =>
        p.id === uploadingVersionPolicy.id
          ? {
              ...p,
              currentVersion: newVersion,
              lastUpdated: new Date().toISOString().split("T")[0],
              updatedBy: "HR Manager",
              fileName: formFile.name,
              fileSize: `${(formFile.size / 1024).toFixed(0)} KB`,
              versions: [newVersionEntry, ...p.versions],
            }
          : p
      )
    );

    setIsSubmitting(false);
    closeUploadModal();
  };

  // Archive policy
  const handleArchivePolicy = async () => {
    if (!archivingPolicy) return;
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));

    setPolicies((prev) =>
      prev.map((p) => (p.id === archivingPolicy.id ? { ...p, isArchived: true } : p))
    );

    setIsSubmitting(false);
    setArchivingPolicy(null);
  };

  // Retry on error
  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 500);
  };

  // Stats
  const stats = {
    total: activePolicies.length,
    public: activePolicies.filter((p) => p.visibility === "all").length,
    restricted: activePolicies.filter((p) => p.visibility === "restricted").length,
  };

  if (hasError) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <ErrorState
          title="Couldn't load policies"
          message="We had trouble loading the policy documents. Please try again."
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
            <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              Policy Library
            </h1>
            <p className="text-sm text-foreground-muted">
              Manage company policies and documents
            </p>
          </div>
          <Button className="gap-2" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Policy</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </StaggerItem>

      {/* Stats Overview */}
      <StaggerItem>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-primary-muted/30 border border-primary/10">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-sm text-foreground-muted">Total Policies</span>
            </div>
            <p className="text-2xl font-bold text-primary">{stats.total}</p>
          </div>
          <div className="p-4 rounded-xl bg-success-muted/30 border border-success/10">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-success" />
              <span className="text-sm text-foreground-muted">All Employees</span>
            </div>
            <p className="text-2xl font-bold text-success">{stats.public}</p>
          </div>
          <div className="p-4 rounded-xl bg-warning-muted/30 border border-warning/10">
            <div className="flex items-center gap-2 mb-1">
              <Lock className="h-4 w-4 text-warning" />
              <span className="text-sm text-foreground-muted">Restricted</span>
            </div>
            <p className="text-2xl font-bold text-warning">{stats.restricted}</p>
          </div>
        </div>
      </StaggerItem>

      {/* Search and Filter */}
      <StaggerItem>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
            <Input
              placeholder="Search policies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as PolicyCategory | "All")}
            className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="All">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </StaggerItem>

      {/* Policies List */}
      {isLoading ? (
        <StaggerItem>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-5 rounded-xl border border-border bg-card">
                <div className="flex items-start gap-4">
                  <Skeleton variant="default" className="h-12 w-12 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton variant="text" className="h-5 w-48" />
                    <Skeleton variant="text" className="h-4 w-full" />
                    <div className="flex gap-2">
                      <Skeleton variant="default" className="h-5 w-16 rounded-full" />
                      <Skeleton variant="default" className="h-5 w-20 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </StaggerItem>
      ) : filteredPolicies.length === 0 ? (
        <StaggerItem>
          {searchQuery || categoryFilter !== "All" ? (
            <EmptyState
              icon={Search}
              title="No policies found"
              description="Try adjusting your search or filter to find what you're looking for."
              variant="search"
            />
          ) : (
            <EmptyState
              icon={BookOpen}
              title="No policies yet"
              description="Add your first company document to build your policy library."
              action={{
                label: "Add Policy",
                onClick: () => setIsAddModalOpen(true),
              }}
            />
          )}
        </StaggerItem>
      ) : (
        <div className="space-y-3">
          {filteredPolicies.map((policy, index) => (
            <StaggerItem key={policy.id} index={index}>
              <Card className="hover:border-primary/30 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Category Icon */}
                    <div
                      className={cn(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                        categoryConfig[policy.category].bg
                      )}
                    >
                      <span className={categoryConfig[policy.category].color}>
                        {categoryConfig[policy.category].icon}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/hr/policies/${policy.id}`}
                          className="group flex-1"
                        >
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {policy.title}
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
                              setActiveDropdown(activeDropdown === policy.id ? null : policy.id);
                            }}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>

                          {activeDropdown === policy.id && (
                            <div
                              className="absolute right-0 top-full mt-1 z-10 w-44 rounded-lg border border-border bg-card shadow-lg py-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Link
                                href={`/hr/policies/${policy.id}`}
                                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary transition-colors"
                              >
                                <Eye className="h-4 w-4" />
                                View Details
                              </Link>
                              <button
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-secondary transition-colors"
                                onClick={() => {
                                  openEditModal(policy);
                                  setActiveDropdown(null);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                                Edit
                              </button>
                              <button
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-secondary transition-colors"
                                onClick={() => {
                                  setUploadingVersionPolicy(policy);
                                  setActiveDropdown(null);
                                }}
                              >
                                <Upload className="h-4 w-4" />
                                Upload New Version
                              </button>
                              <button
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive-muted transition-colors"
                                onClick={() => {
                                  setArchivingPolicy(policy);
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

                      {policy.description && (
                        <p className="text-sm text-foreground-muted mt-1 line-clamp-2">
                          {policy.description}
                        </p>
                      )}

                      {/* Meta info */}
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <Badge variant="muted" className="gap-1">
                          {categoryConfig[policy.category].icon}
                          {policy.category}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          v{policy.currentVersion}
                        </Badge>
                        {policy.visibility === "restricted" && (
                          <Badge className="gap-1 bg-warning-muted text-warning text-xs">
                            <Lock className="h-3 w-3" />
                            Restricted
                          </Badge>
                        )}
                        <span className="text-xs text-foreground-subtle flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Updated {formatDate(new Date(policy.lastUpdated))}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </div>
      )}

      {/* Add Policy Modal */}
      <Modal
        open={isAddModalOpen}
        onClose={closeAddModal}
        title="Add Policy"
        description="Upload a new policy document"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Title <span className="text-destructive">*</span>
            </label>
            <Input
              value={formTitle}
              onChange={(e) => {
                setFormTitle(e.target.value);
                setFormError("");
              }}
              placeholder="e.g., Remote Work Policy"
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
              placeholder="Brief description of this policy..."
              className="min-h-[80px] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Category
              </label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as PolicyCategory)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Visibility
              </label>
              <select
                value={formVisibility}
                onChange={(e) => setFormVisibility(e.target.value as PolicyVisibility)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">All Employees</option>
                <option value="restricted">Restricted</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Document <span className="text-destructive">*</span>
            </label>
            <div
              className={cn(
                "border-2 border-dashed rounded-xl p-6 text-center transition-colors",
                formFile
                  ? "border-success bg-success-muted/20"
                  : "border-border hover:border-primary/50"
              )}
            >
              {formFile ? (
                <div className="flex items-center justify-center gap-3">
                  <File className="h-8 w-8 text-success" />
                  <div className="text-left">
                    <p className="font-medium text-foreground">{formFile.name}</p>
                    <p className="text-xs text-foreground-muted">
                      {(formFile.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFormFile(null)}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-foreground-muted mx-auto mb-2" />
                  <p className="text-sm text-foreground-muted mb-2">
                    Drag and drop or click to upload
                  </p>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    id="file-upload"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setFormFile(file);
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById("file-upload")?.click()}
                  >
                    Choose File
                  </Button>
                  <p className="text-xs text-foreground-subtle mt-2">
                    PDF or Word documents up to 10MB
                  </p>
                </>
              )}
            </div>
          </div>

          {formError && <p className="text-sm text-destructive">{formError}</p>}

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
              onClick={handleAddPolicy}
              isLoading={isSubmitting}
            >
              {!isSubmitting && "Add Policy"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Policy Modal */}
      <Modal
        open={!!editingPolicy}
        onClose={closeEditModal}
        title="Edit Policy"
        description="Update policy details"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Title <span className="text-destructive">*</span>
            </label>
            <Input
              value={formTitle}
              onChange={(e) => {
                setFormTitle(e.target.value);
                setFormError("");
              }}
              placeholder="e.g., Remote Work Policy"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Description
            </label>
            <Textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Brief description of this policy..."
              className="min-h-[80px] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Category
              </label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as PolicyCategory)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Visibility
              </label>
              <select
                value={formVisibility}
                onChange={(e) => setFormVisibility(e.target.value as PolicyVisibility)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">All Employees</option>
                <option value="restricted">Restricted</option>
              </select>
            </div>
          </div>

          {formError && <p className="text-sm text-destructive">{formError}</p>}

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
              onClick={handleEditPolicy}
              isLoading={isSubmitting}
            >
              {!isSubmitting && "Save Changes"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Upload New Version Modal */}
      <Modal
        open={!!uploadingVersionPolicy}
        onClose={closeUploadModal}
        title="Upload New Version"
        description={uploadingVersionPolicy ? `Update "${uploadingVersionPolicy.title}"` : ""}
        size="md"
      >
        {uploadingVersionPolicy && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-secondary/50 border border-border">
              <p className="text-sm text-foreground-muted">Current Version</p>
              <p className="font-medium text-foreground">
                v{uploadingVersionPolicy.currentVersion} — {uploadingVersionPolicy.fileName}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                New Document <span className="text-destructive">*</span>
              </label>
              <div
                className={cn(
                  "border-2 border-dashed rounded-xl p-6 text-center transition-colors",
                  formFile
                    ? "border-success bg-success-muted/20"
                    : "border-border hover:border-primary/50"
                )}
              >
                {formFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <File className="h-8 w-8 text-success" />
                    <div className="text-left">
                      <p className="font-medium text-foreground">{formFile.name}</p>
                      <p className="text-xs text-foreground-muted">
                        {(formFile.size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormFile(null)}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-foreground-muted mx-auto mb-2" />
                    <p className="text-sm text-foreground-muted mb-2">
                      Upload the updated document
                    </p>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      id="version-upload"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setFormFile(file);
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById("version-upload")?.click()}
                    >
                      Choose File
                    </Button>
                  </>
                )}
              </div>
              <p className="text-xs text-foreground-subtle mt-2">
                This will create version v
                {(parseFloat(uploadingVersionPolicy.currentVersion) + 0.1).toFixed(1)}
              </p>
            </div>

            {formError && <p className="text-sm text-destructive">{formError}</p>}

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={closeUploadModal}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={handleUploadVersion}
                isLoading={isSubmitting}
              >
                {!isSubmitting && (
                  <>
                    <Upload className="h-4 w-4" />
                    Upload Version
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Archive Confirmation Modal */}
      <ConfirmModal
        open={!!archivingPolicy}
        onClose={() => setArchivingPolicy(null)}
        onConfirm={handleArchivePolicy}
        title={`Archive "${archivingPolicy?.title}"?`}
        description="This policy will be hidden from the library. Employees will no longer be able to access it."
        confirmLabel="Archive"
        variant="destructive"
        isLoading={isSubmitting}
      />
    </StaggerContainer>
  );
}

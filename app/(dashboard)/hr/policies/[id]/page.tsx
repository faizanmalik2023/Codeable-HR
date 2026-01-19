"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  Calendar,
  Users,
  Lock,
  Download,
  Upload,
  Pencil,
  Archive,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Shield,
  Briefcase,
  Building2,
  File,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal, ConfirmModal } from "@/components/ui/modal";
import { StaggerContainer, StaggerItem } from "@/components/animations/fade-in";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/empty-state";
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
const mockPolicies: Record<string, Policy> = {
  pol1: {
    id: "pol1",
    title: "Employee Handbook",
    description: "Comprehensive guide covering company culture, expectations, benefits, and workplace policies. This document is the primary reference for all employees regarding company standards and practices.",
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
      { version: "2.5", uploadedBy: "Emily HR", uploadedAt: "2023-01-15", fileName: "employee-handbook-v2.5.pdf", fileSize: "2.0 MB" },
      { version: "2.0", uploadedBy: "Emily HR", uploadedAt: "2022-06-01", fileName: "employee-handbook-v2.0.pdf", fileSize: "1.8 MB" },
    ],
    isArchived: false,
  },
  pol2: {
    id: "pol2",
    title: "Remote Work Policy",
    description: "Guidelines for working remotely, including expectations, equipment, and communication standards. Covers eligibility, scheduling, and home office requirements.",
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
  pol3: {
    id: "pol3",
    title: "Information Security Policy",
    description: "Security protocols, data handling procedures, and incident reporting guidelines. All employees must read and acknowledge this policy.",
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
  pol4: {
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
  pol5: {
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
  pol6: {
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
};

const categories: PolicyCategory[] = ["HR", "Security", "Finance", "General", "Operations"];

const categoryConfig: Record<PolicyCategory, { icon: React.ReactNode; color: string; bg: string }> = {
  HR: { icon: <Users className="h-5 w-5" />, color: "text-primary", bg: "bg-primary-muted" },
  Security: { icon: <Shield className="h-5 w-5" />, color: "text-warning", bg: "bg-warning-muted" },
  Finance: { icon: <Briefcase className="h-5 w-5" />, color: "text-success", bg: "bg-success-muted" },
  General: { icon: <BookOpen className="h-5 w-5" />, color: "text-accent", bg: "bg-accent-muted" },
  Operations: { icon: <Building2 className="h-5 w-5" />, color: "text-foreground-muted", bg: "bg-secondary" },
};

export default function PolicyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const policyId = params.id as string;

  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);
  const [policy, setPolicy] = React.useState<Policy | null>(null);
  const [showAllVersions, setShowAllVersions] = React.useState(false);

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = React.useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = React.useState(false);

  // Form states
  const [formTitle, setFormTitle] = React.useState("");
  const [formDescription, setFormDescription] = React.useState("");
  const [formCategory, setFormCategory] = React.useState<PolicyCategory>("General");
  const [formVisibility, setFormVisibility] = React.useState<PolicyVisibility>("all");
  const [formFile, setFormFile] = React.useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState("");

  // Load policy data
  React.useEffect(() => {
    const timer = setTimeout(() => {
      const pol = mockPolicies[policyId];
      if (pol) {
        setPolicy(pol);
      } else {
        setHasError(true);
      }
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [policyId]);

  // Open edit modal
  const openEditModal = () => {
    if (!policy) return;
    setFormTitle(policy.title);
    setFormDescription(policy.description || "");
    setFormCategory(policy.category);
    setFormVisibility(policy.visibility);
    setFormError("");
    setIsEditModalOpen(true);
  };

  // Handle edit
  const handleEdit = async () => {
    if (!policy) return;
    if (!formTitle.trim()) {
      setFormError("Title is required");
      return;
    }

    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));

    setPolicy({
      ...policy,
      title: formTitle.trim(),
      description: formDescription.trim() || undefined,
      category: formCategory,
      visibility: formVisibility,
    });

    setIsSubmitting(false);
    setIsEditModalOpen(false);
  };

  // Handle upload new version
  const handleUploadVersion = async () => {
    if (!policy || !formFile) {
      setFormError("Please select a file to upload");
      return;
    }

    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1000));

    const currentVersionNum = parseFloat(policy.currentVersion);
    const newVersion = (currentVersionNum + 0.1).toFixed(1);

    const newVersionEntry: PolicyVersion = {
      version: newVersion,
      uploadedBy: "HR Manager",
      uploadedAt: new Date().toISOString().split("T")[0],
      fileName: formFile.name,
      fileSize: `${(formFile.size / 1024).toFixed(0)} KB`,
    };

    setPolicy({
      ...policy,
      currentVersion: newVersion,
      lastUpdated: new Date().toISOString().split("T")[0],
      updatedBy: "HR Manager",
      fileName: formFile.name,
      fileSize: `${(formFile.size / 1024).toFixed(0)} KB`,
      versions: [newVersionEntry, ...policy.versions],
    });

    setIsSubmitting(false);
    setIsUploadModalOpen(false);
    setFormFile(null);
  };

  // Handle archive
  const handleArchive = async () => {
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsSubmitting(false);
    setIsArchiveModalOpen(false);
    router.push("/hr/policies");
  };

  // Retry on error
  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    setTimeout(() => {
      const pol = mockPolicies[policyId];
      if (pol) {
        setPolicy(pol);
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
          title="Policy not found"
          message="We couldn't find this policy. It may have been archived or you don't have access."
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
              <Skeleton variant="text" className="h-6 w-64" />
              <Skeleton variant="text" className="h-4 w-32" />
            </div>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="p-6 rounded-xl border border-border bg-card space-y-4">
            <Skeleton variant="text" className="h-5 w-full" />
            <Skeleton variant="text" className="h-5 w-3/4" />
            <div className="flex gap-2 pt-4">
              <Skeleton variant="default" className="h-10 w-32" />
              <Skeleton variant="default" className="h-10 w-32" />
            </div>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 rounded-xl border border-border bg-card">
                <div className="flex items-center gap-4">
                  <Skeleton variant="default" className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton variant="text" className="h-4 w-32" />
                    <Skeleton variant="text" className="h-3 w-48" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </StaggerItem>
      </StaggerContainer>
    );
  }

  if (!policy) return null;

  const visibleVersions = showAllVersions ? policy.versions : policy.versions.slice(0, 3);

  return (
    <StaggerContainer className="space-y-6">
      {/* Header */}
      <StaggerItem>
        <div className="flex items-center gap-4">
          <Link href="/hr/policies">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl shrink-0",
                  categoryConfig[policy.category].bg
                )}
              >
                <span className={categoryConfig[policy.category].color}>
                  {categoryConfig[policy.category].icon}
                </span>
              </div>
              <div className="min-w-0">
                <h1 className="text-xl md:text-2xl font-bold text-foreground truncate">
                  {policy.title}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge variant="muted">{policy.category}</Badge>
                  <Badge variant="outline">v{policy.currentVersion}</Badge>
                  {policy.visibility === "restricted" && (
                    <Badge className="gap-1 bg-warning-muted text-warning">
                      <Lock className="h-3 w-3" />
                      Restricted
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
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

      {/* Policy Info Card */}
      <StaggerItem>
        <Card>
          <CardContent className="p-6">
            {policy.description && (
              <p className="text-foreground mb-6">{policy.description}</p>
            )}

            {/* Current Document */}
            <div className="p-4 rounded-xl bg-primary-muted/30 border border-primary/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{policy.fileName}</p>
                    <p className="text-sm text-foreground-muted">
                      {policy.fileSize} • Version {policy.currentVersion}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="gap-2">
                    <ExternalLink className="h-4 w-4" />
                    View
                  </Button>
                  <Button className="gap-2">
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
            </div>

            {/* Meta info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border">
              <div>
                <p className="text-sm text-foreground-muted mb-1">Category</p>
                <div className="flex items-center gap-1.5">
                  <span className={categoryConfig[policy.category].color}>
                    {categoryConfig[policy.category].icon}
                  </span>
                  <span className="font-medium text-foreground">{policy.category}</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-foreground-muted mb-1">Visibility</p>
                <div className="flex items-center gap-1.5">
                  {policy.visibility === "all" ? (
                    <>
                      <Users className="h-4 w-4 text-success" />
                      <span className="font-medium text-foreground">All Employees</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 text-warning" />
                      <span className="font-medium text-foreground">Restricted</span>
                    </>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm text-foreground-muted mb-1">Last Updated</p>
                <p className="font-medium text-foreground">
                  {formatDate(new Date(policy.lastUpdated))}
                </p>
              </div>
              <div>
                <p className="text-sm text-foreground-muted mb-1">Updated By</p>
                <p className="font-medium text-foreground">{policy.updatedBy}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </StaggerItem>

      {/* Version History */}
      <StaggerItem>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-5 w-5 text-foreground-muted" />
                Version History
              </CardTitle>
              <p className="text-sm text-foreground-muted mt-1">
                {policy.versions.length} version{policy.versions.length !== 1 ? "s" : ""} available
              </p>
            </div>
            <Button
              className="gap-2"
              onClick={() => {
                setFormFile(null);
                setFormError("");
                setIsUploadModalOpen(true);
              }}
            >
              <Upload className="h-4 w-4" />
              Upload New Version
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {visibleVersions.map((version, index) => (
                <div
                  key={version.version}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl transition-colors",
                    index === 0
                      ? "bg-primary-muted/30 border border-primary/10"
                      : "bg-secondary/30 hover:bg-secondary/50"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg shrink-0",
                      index === 0 ? "bg-primary/10" : "bg-secondary"
                    )}
                  >
                    <File className={cn("h-5 w-5", index === 0 ? "text-primary" : "text-foreground-muted")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">
                        Version {version.version}
                      </p>
                      {index === 0 && (
                        <Badge className="text-xs bg-primary/10 text-primary">Current</Badge>
                      )}
                    </div>
                    <p className="text-sm text-foreground-muted">
                      {version.fileName} • {version.fileSize}
                    </p>
                    <p className="text-xs text-foreground-subtle mt-1">
                      Uploaded by {version.uploadedBy} on {formatDate(new Date(version.uploadedAt))}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="gap-1 shrink-0">
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Download</span>
                  </Button>
                </div>
              ))}
            </div>

            {policy.versions.length > 3 && (
              <Button
                variant="ghost"
                className="w-full mt-4 gap-2"
                onClick={() => setShowAllVersions(!showAllVersions)}
              >
                {showAllVersions ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Show {policy.versions.length - 3} More Versions
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </StaggerItem>

      {/* Edit Policy Modal */}
      <Modal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
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

      {/* Upload New Version Modal */}
      <Modal
        open={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setFormFile(null);
          setFormError("");
        }}
        title="Upload New Version"
        description={`Update "${policy.title}"`}
        size="md"
      >
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-secondary/50 border border-border">
            <p className="text-sm text-foreground-muted">Current Version</p>
            <p className="font-medium text-foreground">
              v{policy.currentVersion} — {policy.fileName}
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
                    id="detail-version-upload"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setFormFile(file);
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById("detail-version-upload")?.click()}
                  >
                    Choose File
                  </Button>
                </>
              )}
            </div>
            <p className="text-xs text-foreground-subtle mt-2">
              This will create version v{(parseFloat(policy.currentVersion) + 0.1).toFixed(1)}
            </p>
          </div>

          {formError && <p className="text-sm text-destructive">{formError}</p>}

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setIsUploadModalOpen(false);
                setFormFile(null);
                setFormError("");
              }}
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
      </Modal>

      {/* Archive Confirmation Modal */}
      <ConfirmModal
        open={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        onConfirm={handleArchive}
        title={`Archive "${policy.title}"?`}
        description="This policy will be hidden from the library. Employees will no longer be able to access it."
        confirmLabel="Archive Policy"
        variant="destructive"
        isLoading={isSubmitting}
      />
    </StaggerContainer>
  );
}

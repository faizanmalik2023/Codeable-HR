// User & Employee Types
export type UserRole = "employee" | "manager" | "hr" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  departmentId: string;
  designationId: string;
  managerId?: string;
  joinDate: string;
  status: "active" | "inactive" | "on-leave";
}

export interface Employee extends User {
  phone?: string;
  address?: string;
  emergencyContact?: string;
  skills?: string[];
  bio?: string;
}

// Department & Designation
export interface Department {
  id: string;
  name: string;
  description?: string;
  headId?: string;
  createdAt: string;
}

export interface Designation {
  id: string;
  name: string;
  level: number;
  departmentId?: string;
}

// EOD Reports
export interface EODReport {
  id: string;
  employeeId: string;
  date: string;
  summary: string;
  projectId?: string;
  hoursWorked: number;
  blockers?: string;
  tomorrowPlan?: string;
  status: "draft" | "submitted";
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Leave Management
export type LeaveType = "annual" | "sick" | "casual" | "unpaid" | "maternity" | "paternity" | "bereavement";

export interface LeaveBalance {
  type: LeaveType;
  total: number;
  used: number;
  remaining: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  approverId?: string;
  approverComment?: string;
  createdAt: string;
  updatedAt: string;
}

// Projects
export interface Project {
  id: string;
  name: string;
  description?: string;
  status: "active" | "completed" | "on-hold";
  startDate?: string;
  endDate?: string;
  teamIds?: string[];
}

// Promotions & Notes
export interface Promotion {
  id: string;
  employeeId: string;
  fromDesignationId: string;
  toDesignationId: string;
  effectiveDate: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface PerformanceNote {
  id: string;
  employeeId: string;
  authorId: string;
  content: string;
  type: "positive" | "constructive" | "neutral";
  isPrivate: boolean;
  createdAt: string;
}

// HR Issues
export interface HRIssue {
  id: string;
  raisedBy: string;
  title: string;
  description: string;
  category: "workplace" | "compensation" | "harassment" | "policy" | "other";
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in-progress" | "resolved" | "closed";
  isPrivate: boolean;
  assignedTo?: string;
  resolution?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IssueComment {
  id: string;
  issueId: string;
  authorId: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
}

// Settings & Policies
export interface Policy {
  id: string;
  title: string;
  content: string;
  category: string;
  version: string;
  effectiveDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyDocument {
  id: string;
  name: string;
  fileUrl: string;
  fileType: string;
  category: string;
  uploadedBy: string;
  createdAt: string;
}

// Navigation
export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  children?: NavItem[];
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

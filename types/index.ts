/**
 * Domain models — mirror the backend API shapes from the CodeableHR specs.
 * snake_case keys match the wire format so mappers stay thin.
 */

import type {
  AttendanceReportStatus,
  CheckInStatus,
  ClaimReason,
  ClaimStatus,
  EmploymentType,
  EodStatus,
  ExpenseCategory,
  ExpenseCurrency,
  ExpenseStatus,
  HalfDayPeriod,
  HolidayType,
  IssueCategory,
  IssuePriority,
  IssueStatus,
  Language,
  LeaveDuration,
  LeaveStatus,
  LeaveType,
  NotificationCategory,
  SalaryRevisionType,
  SalarySlipStatus,
  UserRole,
} from "@/lib/enums";

/* ------------------------------------------------------------------ */
/* Auth & user                                                         */
/* ------------------------------------------------------------------ */
export interface AuthTokens {
  token: string;
  refresh_token: string;
}

export interface EmployeeRef {
  id?: string;
  employee_code?: string;
  full_name?: string;
  name?: string;
  avatar?: string;
  department?: string;
  designation?: string;
}

export interface Employment {
  designation?: string;
  department?: string;
  joined_at?: string;
  employment_type?: EmploymentType;
}

export interface EmergencyContact {
  name?: string;
  phone?: string;
  relation?: string;
}

export interface UserModel {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar?: string | null;
  status?: string;
  employee_code?: string;
  is_manager?: boolean;
  employment?: Employment;
  phone?: string;
  dob?: string;
  cnic?: string;
  emergency_contact?: EmergencyContact;
}

/* ------------------------------------------------------------------ */
/* Envelope & pagination                                               */
/* ------------------------------------------------------------------ */
export interface ApiError {
  code: string;
  message: string;
  timestamp?: string;
  details?: { field: string; reason: string }[];
}

export interface ApiEnvelope<T> {
  statusCode: number;
  data: T | null;
  error: ApiError | null;
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

export interface Paginated<T> {
  items: T[];
  pagination: Pagination;
  counts?: Record<string, number>;
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */
export interface LeaveBalance {
  leave_type: LeaveType | string;
  name: string;
  total: number;
  used: number;
  remaining: number;
}

export interface UpcomingHoliday {
  id: string;
  name: string;
  date: string;
  daysUntil?: number;
}

export interface Birthday {
  employee_code: string;
  name: string;
  birthday: string;
  avatar?: string | null;
}

export interface ActivityItemModel {
  id: string;
  title: string;
  subtitle?: string;
  type: string;
  timestamp: string;
  time_ago?: string;
}

export interface DashboardModel {
  greeting: string;
  current_date?: string;
  eod_pending: boolean;
  at_a_glance?: {
    total_hours_worked?: number;
    attendance_status?: CheckInStatus;
    next_salary?: number | string;
    next_holiday?: string;
    attendance_percentage?: number;
  };
  leave_balance?: LeaveBalance[];
  upcoming_holidays?: UpcomingHoliday[];
  birthdays?: Birthday[];
  recent_activity?: ActivityItemModel[];
  team_eod_updates?: TeamMemberModel[];
  team_leave_requests?: LeaveModel[];
  on_leave_today?: EmployeeRef[];
  open_tickets?: IssueModel[];
  pending_leaves?: LeaveModel[];
  org_stats?: {
    totalEmployees?: number;
    activeEmployees?: number;
    onLeaveToday?: number;
    birthdays?: number;
  };
  department_distribution?: { departmentName: string; employeeCount: number }[];
}

/* ------------------------------------------------------------------ */
/* Leaves                                                              */
/* ------------------------------------------------------------------ */
export interface LeaveModel {
  id: string;
  date_from: string;
  date_to: string;
  status: LeaveStatus;
  leave_type: LeaveType | string;
  leave_type_name?: string;
  total_days?: number;
  paid_days?: number;
  unpaid_days?: number;
  duration?: LeaveDuration;
  is_half_day?: boolean;
  half_day?: HalfDayPeriod | null;
  reason?: string;
  applied_date?: string;
  approver?: EmployeeRef;
  response_date?: string;
  response_note?: string;
  employee?: EmployeeRef;
}

export interface LeaveTypeModel {
  leave_type_id: string;
  name: string;
  kind: "accrued" | "special";
  paid?: boolean;
  eligible?: boolean;
  quota?: number;
  used?: number;
  remaining?: number;
  entitlement_days?: number;
  max_occurrences?: number;
  occurrences_used?: number;
  occurrences_remaining?: number;
  gender?: string | null;
  qualifying_months?: number;
  ineligible_reason?: string | null;
}

export interface LeaveBalanceModel {
  leave_type_id: string;
  name: string;
  quota: number;
  used: number;
  remaining: number;
}

/* ------------------------------------------------------------------ */
/* EOD                                                                 */
/* ------------------------------------------------------------------ */
export interface EodReportModel {
  id: string;
  date: string;
  status: EodStatus;
  summary: string;
  portal?: string;
  project_id?: string;
  project_name?: string;
  hours?: number;
  blockers?: string;
  tomorrow_plan?: string;
  is_read?: boolean;
  can_edit?: boolean;
  can_delete?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TeamMemberModel {
  id: string;
  employee_code?: string;
  full_name: string;
  avatar?: string | null;
  designation?: string;
  unread_count?: number;
  pending_count?: number;
}

/* ------------------------------------------------------------------ */
/* Attendance                                                          */
/* ------------------------------------------------------------------ */
export interface AttendanceSession {
  check_in?: string;
  check_out?: string;
  hours_worked?: number;
}

export interface AttendanceDay {
  date: string;
  status: AttendanceReportStatus;
  check_in?: string;
  check_out?: string;
  hours_worked?: number;
  holiday_name?: string;
  sessions?: AttendanceSession[];
}

export interface AttendanceMonthModel {
  summary: {
    present_days?: number;
    absent_days?: number;
    leave_days?: number;
    late_days?: number;
    total_hours?: number;
    avgDailyHours?: number;
  };
  items: AttendanceDay[];
}

/* ------------------------------------------------------------------ */
/* Claims                                                              */
/* ------------------------------------------------------------------ */
export interface Attachment {
  key?: string;
  url: string;
  name?: string;
}

export interface InsuranceClaimModel {
  id: string;
  date?: string;
  status: ClaimStatus;
  reason: ClaimReason | string;
  reason_display?: string;
  amount: number;
  note?: string;
  attachments?: Attachment[];
  applied_date?: string;
  reviewed_by?: EmployeeRef;
  response_date?: string;
  response_note?: string;
  employee?: EmployeeRef;
}

export interface ExpenseClaimModel {
  id: string;
  date?: string;
  status: ExpenseStatus;
  category: ExpenseCategory | string;
  category_display?: string;
  amount: number;
  description?: string;
  applied_date?: string;
  attachments?: Attachment[];
  reviewed_by?: EmployeeRef;
  response_date?: string;
  response_note?: string;
  employee?: EmployeeRef;
}

/* ------------------------------------------------------------------ */
/* Tickets (HR Help)                                                   */
/* ------------------------------------------------------------------ */
export type MessageSender = "user" | "hr" | "system";
export type MessageDeliveryStatus = "sending" | "sent" | "failed";

export interface IssueMessage {
  id?: string;
  sender: MessageSender;
  content: string;
  created_at?: string;
  sender_name?: string;
  sender_avatar?: string | null;
  delivery?: MessageDeliveryStatus;
}

export interface IssueModel {
  id: string;
  title: string;
  description?: string;
  category: IssueCategory | string;
  status: IssueStatus;
  priority: IssuePriority;
  is_anonymous?: boolean;
  assigned_to?: EmployeeRef | string;
  created_at?: string;
  messages?: IssueMessage[];
}

/* ------------------------------------------------------------------ */
/* Salary                                                              */
/* ------------------------------------------------------------------ */
export interface SalaryLineItem {
  label: string;
  amount: number;
}

export interface SalaryBreakdownModel {
  basic?: number;
  allowances?: SalaryLineItem[];
  deductions?: SalaryLineItem[];
  tax?: number;
  provident_fund?: number;
  net?: number;
  gross?: number;
  configured?: boolean;
}

export interface SalaryRevisionModel {
  id: string;
  type: SalaryRevisionType;
  effective_date: string;
  amount?: number;
  designation?: string;
  note?: string;
}

export interface SalarySlipModel {
  id: string;
  month: number | string;
  year: number;
  status: SalarySlipStatus;
  gross?: number;
  net?: number;
  basic_salary?: number;
  earnings?: SalaryLineItem[];
  deductions?: SalaryLineItem[];
}

/* ------------------------------------------------------------------ */
/* Policies / notifications / profile                                  */
/* ------------------------------------------------------------------ */
export interface PolicyModel {
  id: string;
  title: string;
  description?: string;
  document_url: string;
  effective_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface NotificationModel {
  id: string;
  title: string;
  body?: string;
  category: NotificationCategory | string;
  type?: string;
  data?: { target?: string; entity_id?: string; [k: string]: unknown };
  created_at?: string;
  is_read?: boolean;
  time_ago?: string;
}

export interface LoanModel {
  id?: string;
  title: string;
  totalAmount: number;
  remainingAmount: number;
  totalInstallments?: number;
  paidInstallments?: number;
  startDate?: string;
  monthlyDeduction?: number;
}

export interface PerkModel {
  title: string;
  description?: string;
  status: "active" | "upcoming" | "expired";
}

export interface ProfileModel {
  employeeCode?: string;
  name: string;
  email: string;
  position?: string;
  department?: string;
  manager?: string;
  salary?: number;
  dateOfJoining?: string;
  birthday?: string;
  phone?: string;
  avatar?: string | null;
  cnic?: string;
  emergencyContact?: EmergencyContact;
  employmentType?: EmploymentType;
  loans?: LoanModel[];
  perks?: PerkModel[];
}

export interface NotificationPreferences {
  notifications_enabled: boolean;
  language: Language;
}

export interface HolidayModel {
  id: string;
  name: string;
  type: HolidayType;
  date: string;
  days?: number;
  image?: string | null;
  description?: string;
  endDate?: string;
  daysLeft?: number;
  isPast?: boolean;
}

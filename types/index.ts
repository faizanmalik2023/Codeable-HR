/**
 * Domain models — mirror the backend API wire shapes exactly.
 * The API client (`lib/api/client.ts`) returns the envelope's `data` verbatim
 * with NO case transform, so every field here is snake_case and matches what the
 * backend `wireKeys` serializer emits (`_id` → `id`, camelCase → snake_case).
 * Nested refs (employee, department, employment) are objects, not flat strings.
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

/** `formatDepartmentRef` output — a department reference is an OBJECT, not a string. */
export interface DepartmentRef {
  id?: string;
  name?: string;
  image_url?: string | null;
}

/** `formatEmployeeRef` output. `department` is a nested {@link DepartmentRef}. */
export interface EmployeeRef {
  id?: string;
  employee_code?: string;
  full_name?: string;
  name?: string;
  avatar?: string | null;
  department?: DepartmentRef;
  designation?: string;
}

export interface Employment {
  designation?: string;
  department?: DepartmentRef;
  manager?: string | null;
  manager_id?: string | null;
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

/** Wire shape from `buildPagination` after snake_casing. */
export interface Pagination {
  current_page: number;
  total_pages: number;
  total_items: number;
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
  quota: number;
  used: number;
  remaining: number;
}

export interface UpcomingHoliday {
  id: string;
  name: string;
  date: string;
  days_left?: number;
}

/** Dashboard birthday item — the employee is nested. */
export interface Birthday {
  employee: EmployeeRef;
  date: string;
  is_today?: boolean;
}

export interface ActivityItemModel {
  id: string;
  title: string;
  /** Standalone `/activity` uses `subtitle`; the dashboard section uses `body`. */
  subtitle?: string;
  body?: string;
  type: string;
  category?: string;
  timestamp?: string;
  time_ago?: string;
}

/** `at_a_glance.total_hours_worked` is an object, not a number. */
export interface GlanceHours {
  hours?: number;
  minutes?: number;
}

export interface GlanceNextSalary {
  date?: string;
  days_left?: number;
}

export interface GlanceNextHoliday {
  name?: string;
  date?: string;
  image?: string | null;
}

/** Dashboard/HR "on leave today" item — the employee is nested. */
export interface OnLeaveTodayModel {
  employee: EmployeeRef;
  return_date?: string;
  leave_type?: string;
}

export interface DashboardModel {
  greeting: string;
  current_date?: string;
  eod_pending: boolean;
  /** Today's EOD status (null = none filed / admin). Drives the EOD banner state. */
  eod_status?: EodStatus | null;
  at_a_glance?: {
    total_hours_worked?: GlanceHours;
    attendance_status?: CheckInStatus;
    next_salary?: GlanceNextSalary;
    next_holiday?: GlanceNextHoliday;
  };
  leave_balance?: LeaveBalance[];
  upcoming_holidays?: UpcomingHoliday[];
  birthdays?: Birthday[];
  recent_activity?: ActivityItemModel[];
  team_eod_updates?: TeamMemberModel[];
  team_leave_requests?: LeaveModel[];
  on_leave_today?: OnLeaveTodayModel[];
  open_tickets?: IssueModel[];
  pending_leaves?: LeaveModel[];
  org_stats?: {
    total_employees?: number;
    present_today?: number;
    on_leave?: number;
    birthdays?: number;
  };
  department_distribution?: { department_name?: string; employee_count?: number }[];
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
  /** Dashboard `pending_leaves` items use `days` rather than `total_days`. */
  days?: number;
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
  /** The project's name is emitted as `portal` (there is no `project_name`). */
  portal?: string;
  project_id?: string;
  hours?: number;
  blockers?: string;
  tomorrow_plan?: string;
  is_read?: boolean;
  can_edit?: boolean;
  can_delete?: boolean;
  created_at?: string;
  updated_at?: string;
}

/** Team roster item (EOD team + leave team) — the employee is nested. */
export interface TeamMemberModel {
  employee: EmployeeRef;
  unread_eod_count?: number;
  pending_count?: number;
}

/* ------------------------------------------------------------------ */
/* Attendance                                                          */
/* ------------------------------------------------------------------ */
export interface AttendanceSession {
  in?: string;
  out?: string;
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
    present?: number;
    absent?: number;
    late?: number;
    half_day?: number;
    on_leave?: number;
    holiday?: number;
    avg_daily_hours?: number;
  };
  items: AttendanceDay[];
}

/* ------------------------------------------------------------------ */
/* Claims                                                              */
/* ------------------------------------------------------------------ */
export interface InsuranceClaimModel {
  id: string;
  date?: string;
  status: ClaimStatus;
  reason: ClaimReason | string;
  reason_display?: string;
  amount: number;
  note?: string;
  /** Wire `attachments` is a `string[]` of URLs; single doc also on `attachment_path`. */
  attachments?: string[];
  attachment_path?: string | null;
  attachment_name?: string | null;
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
  attachments?: string[];
  attachment_path?: string | null;
  attachment_name?: string | null;
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
  /** `formatMessage` emits `timestamp` (not `created_at`). */
  timestamp?: string;
  /** Sender identity is nested under `sender_employee`. */
  sender_employee?: EmployeeRef;
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
  /** `formatTicket` emits `created_date`. */
  created_date?: string;
  messages?: IssueMessage[];
}

/* ------------------------------------------------------------------ */
/* Salary                                                              */
/* ------------------------------------------------------------------ */
export interface SalaryLineItem {
  name: string;
  amount: number;
}

/** `formatBreakdown` output — flat named component fields (snake_case). */
export interface SalaryBreakdownModel {
  basic_salary?: number;
  house_rent?: number;
  medical?: number;
  transport?: number;
  utility?: number;
  tax?: number;
  provident_fund?: number;
  insurance?: number;
  loan_deduction?: number;
  total_provident_fund_collected?: number;
  gross_salary?: number;
  net_salary?: number;
  total_deductions?: number;
  [k: string]: number | null | undefined;
}

export interface SalaryRevisionModel {
  id: string;
  revision_type: SalaryRevisionType;
  effective_date: string;
  new_salary?: number;
  previous_salary?: number | null;
  increment_amount?: number | null;
  increment_percentage?: number | null;
  note?: string | null;
  created_at?: string;
}

export interface SalarySlipModel {
  id: string;
  slip_id?: string;
  user_id?: string | null;
  month: number | string;
  year: number;
  status: SalarySlipStatus;
  basic_salary?: number;
  earnings?: SalaryLineItem[];
  deductions?: SalaryLineItem[];
  gross_amount?: number;
  net_amount?: number;
  unpaid_leave_days?: number;
  download_url?: string | null;
  created_at?: string;
  employee?: EmployeeRef;
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

/** Profile loans — `formatLoans` output (snake_case, flat). */
export interface LoanModel {
  id?: string;
  name: string;
  principal: number;
  monthly_deduction?: number;
  amount_repaid?: number;
  balance_remaining: number;
  start_month?: string;
  status?: string;
  total_installments?: number | null;
  installments_paid?: number;
  start_date?: string | null;
}

/** Profile perks — `formatPerks` output. */
export interface PerkModel {
  key?: string;
  name: string;
  description?: string | null;
  enabled: boolean;
  amount?: number | null;
  percentage?: number | null;
}

/** Profile salary block — `formatSalary` output (nullable). */
export interface SalaryObject {
  basic_salary?: number;
  gross_salary?: number;
  net_salary?: number;
  components?: { name: string; amount: number }[];
  effective_date?: string;
}

export interface ManagedTeam {
  id?: string;
  name?: string;
  member_count?: number;
}

export interface ProfileModel {
  id?: string;
  email: string;
  full_name: string;
  father_name?: string | null;
  gender?: string | null;
  employee_code?: string | null;
  avatar?: string | null;
  dob?: string | null;
  cnic?: string | null;
  phone?: string | null;
  personal_email?: string | null;
  address?: string | null;
  bank_name?: string | null;
  account_number?: string | null;
  payment_method?: string | null;
  emergency_contact?: EmergencyContact | null;
  employment?: Employment;
  role?: UserRole | string | null;
  is_manager?: boolean;
  managed_teams?: ManagedTeam[];
  status?: string;
  has_password?: boolean;
  salary?: SalaryObject | null;
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

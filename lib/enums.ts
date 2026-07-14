/**
 * Enum catalog — seeded from the live backend `GET /api/enums` payload and the
 * mobile-app specs. `wire` is what crosses the network; `label` is display text;
 * `tone` maps to a Badge variant; `hex` is the raw spec colour hint.
 *
 * Prefer server-driven values (see `useEnums`) for pickers where the backend
 * supplies them (claim_reason, expense_category, ticket_category, etc.); fall
 * back to the constants here.
 */

import type { BadgeProps } from "@/components/ui/badge";

export type Tone = NonNullable<BadgeProps["variant"]>;

export interface EnumMeta {
  label: string;
  tone?: Tone;
  hex?: string;
  short?: string;
}

/** Build a typed lookup helper for an enum's metadata. */
export function enumHelper<T extends string>(map: Record<T, EnumMeta>) {
  return {
    map,
    label: (v: T | string | null | undefined): string =>
      (v && (map as Record<string, EnumMeta>)[v]?.label) || (v ? String(v) : "—"),
    tone: (v: T | string | null | undefined): Tone =>
      (v && (map as Record<string, EnumMeta>)[v]?.tone) || "muted",
    options: () =>
      (Object.keys(map) as T[]).map((value) => ({ value, label: map[value].label })),
  };
}

/* ------------------------------------------------------------------ */
/* Roles                                                               */
/* ------------------------------------------------------------------ */
export type UserRole = "employee" | "manager" | "hr" | "admin";
export const ROLE_LABELS: Record<UserRole, string> = {
  employee: "Employee",
  manager: "Manager",
  hr: "HR",
  admin: "Admin",
};
/** Landing route per role (unified role-agnostic app → single dashboard). */
export const ROLE_LANDING: Record<UserRole, string> = {
  employee: "/dashboard",
  manager: "/dashboard",
  hr: "/dashboard",
  admin: "/dashboard",
};

/* ------------------------------------------------------------------ */
/* Status / lifecycle                                                  */
/* ------------------------------------------------------------------ */
export type LeaveStatus = "pending" | "approved" | "rejected";
export const LeaveStatusEnum = enumHelper<LeaveStatus>({
  approved: { label: "Approved", tone: "success", hex: "#4CAF50" },
  pending: { label: "Pending", tone: "warning", hex: "#FF9800" },
  rejected: { label: "Rejected", tone: "destructive", hex: "#EA5455" },
});

export type ClaimStatus = "pending" | "approved" | "rejected";
export const ClaimStatusEnum = enumHelper<ClaimStatus>({
  approved: { label: "Approved", tone: "success" },
  pending: { label: "Pending", tone: "warning" },
  rejected: { label: "Rejected", tone: "destructive" },
});

export type ExpenseStatus = "pending" | "approved" | "rejected";
export const ExpenseStatusEnum = enumHelper<ExpenseStatus>({
  approved: { label: "Approved", tone: "success" },
  pending: { label: "Pending", tone: "warning" },
  rejected: { label: "Rejected", tone: "destructive" },
});

export type EodStatus = "draft" | "pending" | "submitted";
export const EodStatusEnum = enumHelper<EodStatus>({
  submitted: { label: "Submitted", tone: "success" },
  pending: { label: "Pending", tone: "warning" },
  draft: { label: "Draft", tone: "muted" },
});

/** Daily attendance classification (`attendance_report_status`). */
export type AttendanceReportStatus =
  | "present"
  | "absent"
  | "late"
  | "half_day"
  | "on_leave"
  | "holiday";
export const AttendanceReportStatusEnum = enumHelper<AttendanceReportStatus>({
  present: { label: "Present", tone: "success", hex: "#4CAF50" },
  absent: { label: "Absent", tone: "destructive", hex: "#EA5455" },
  late: { label: "Late", tone: "warning", hex: "#FF9800" },
  half_day: { label: "Half Day", tone: "secondary", hex: "#9C27B0", short: "½ Day" },
  on_leave: { label: "On Leave", tone: "default", hex: "#2196F3" },
  holiday: { label: "Holiday", tone: "outline", hex: "#00BCD4" },
});

/** Check-in state (`attendance_status`). */
export type CheckInStatus = "not_checked_in" | "checked_in" | "checked_out";
export const CHECK_IN_LABELS: Record<CheckInStatus, string> = {
  not_checked_in: "Not checked in",
  checked_in: "Checked in",
  checked_out: "Checked out",
};

export type IssueStatus = "open" | "in_progress" | "resolved" | "closed";
export const IssueStatusEnum = enumHelper<IssueStatus>({
  open: { label: "Open", tone: "default" },
  in_progress: { label: "In Progress", tone: "warning" },
  resolved: { label: "Resolved", tone: "success" },
  closed: { label: "Closed", tone: "muted" },
});

export type IssuePriority = "low" | "medium" | "high";
export const IssuePriorityEnum = enumHelper<IssuePriority>({
  high: { label: "High", tone: "destructive" },
  medium: { label: "Medium", tone: "warning" },
  low: { label: "Low", tone: "success" },
});

export type SalarySlipStatus = "generated" | "pending";
export const SalarySlipStatusEnum = enumHelper<SalarySlipStatus>({
  generated: { label: "Sent", tone: "success" },
  pending: { label: "Not sent", tone: "warning" },
});

/* ------------------------------------------------------------------ */
/* Type / category                                                     */
/* ------------------------------------------------------------------ */
export type LeaveType =
  | "annual"
  | "casual"
  | "sick"
  | "maternity"
  | "paternity"
  | "compassionate"
  | "marriage"
  | "hajj_umrah"
  | "iddat";
export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  annual: "Annual",
  casual: "Casual",
  sick: "Sick",
  maternity: "Maternity",
  paternity: "Paternity",
  compassionate: "Compassionate",
  marriage: "Marriage",
  hajj_umrah: "Hajj / Umrah",
  iddat: "Iddat",
};

export type LeaveDuration = "half_day" | "full_day" | "multiple_days";
export const LEAVE_DURATION_LABELS: Record<LeaveDuration, string> = {
  half_day: "Half day",
  full_day: "Full day",
  multiple_days: "Multiple days",
};

export type HalfDayPeriod = "am" | "pm";
export const HALF_DAY_LABELS: Record<HalfDayPeriod, string> = {
  am: "Earlier half (AM)",
  pm: "Later half (PM)",
};

export type ClaimReason =
  | "consultation"
  | "medication"
  | "labTests"
  | "hospitalization"
  | "dental"
  | "optical"
  | "other";
export const CLAIM_REASON_LABELS: Record<ClaimReason, string> = {
  consultation: "Consultation",
  medication: "Medication",
  labTests: "Lab Tests",
  hospitalization: "Hospitalization",
  dental: "Dental",
  optical: "Optical",
  other: "Other",
};

export type ExpenseCategory =
  | "travel"
  | "meals"
  | "office"
  | "software"
  | "training"
  | "equipment"
  | "other";
export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  travel: "Travel",
  meals: "Meals",
  office: "Office",
  software: "Software",
  training: "Training",
  equipment: "Equipment",
  other: "Other",
};

export type ExpenseCurrency = "PKR" | "USD";
export const CURRENCY_SYMBOL: Record<ExpenseCurrency, string> = { PKR: "₨", USD: "$" };

export type IssueCategory =
  | "payroll"
  | "leave"
  | "benefits"
  | "workplace"
  | "harassment"
  | "whistleblower"
  | "grievance"
  | "general";
export const ISSUE_CATEGORY_LABELS: Record<IssueCategory, string> = {
  payroll: "Payroll",
  leave: "Leave",
  benefits: "Benefits",
  workplace: "Workplace",
  harassment: "Harassment",
  whistleblower: "Whistleblower",
  grievance: "Grievance",
  general: "General",
};
export const SENSITIVE_ISSUE_CATEGORIES: IssueCategory[] = [
  "harassment",
  "whistleblower",
  "grievance",
];

export type EmploymentType =
  | "full_time"
  | "part_time"
  | "contract"
  | "intern"
  | "freelancer";
export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  intern: "Intern",
  freelancer: "Freelancer",
};

export type SalaryRevisionType = "initial" | "increment" | "promotion";
export const SALARY_REVISION_LABELS: Record<SalaryRevisionType, string> = {
  initial: "Initial",
  increment: "Increment",
  promotion: "Promotion",
};

export type NotificationCategory =
  | "leave"
  | "eod"
  | "payslip"
  | "policy"
  | "claim"
  | "expense"
  | "ticket"
  | "general";

export type Language = "en" | "ur";
export const LANGUAGE_LABELS: Record<Language, string> = {
  en: "English",
  ur: "Urdu",
};

export type HolidayType = "religious" | "national" | "company";
export const HOLIDAY_TYPE_LABELS: Record<HolidayType, string> = {
  religious: "Religious",
  national: "National",
  company: "Company",
};

export type PerkType =
  | "medical_insurance"
  | "provident_fund"
  | "fuel_allowance"
  | "meal_allowance"
  | "phone_allowance"
  | "other";
export const PERK_TYPE_LABELS: Record<PerkType, string> = {
  medical_insurance: "Medical Insurance",
  provident_fund: "Provident Fund",
  fuel_allowance: "Fuel Allowance",
  meal_allowance: "Meal Allowance",
  phone_allowance: "Phone Allowance",
  other: "Other",
};

/* ------------------------------------------------------------------ */
/* Filter enums (drive tab chips) — value `all` means no status param   */
/* ------------------------------------------------------------------ */
export const LEAVE_FILTERS = ["all", "pending", "approved", "rejected"] as const;
export const CLAIM_FILTERS = ["all", "approved", "pending", "rejected"] as const;
export const EXPENSE_FILTERS = ["all", "approved", "pending", "rejected"] as const;
export const ISSUE_FILTERS = ["all", "open", "in_progress", "resolved", "closed"] as const;
export const EOD_FILTERS = ["all", "submitted", "pending", "draft"] as const;
export const EOD_READ_FILTERS = ["all", "unread", "read"] as const;
export const ATTENDANCE_FILTERS = [
  "all",
  "present",
  "absent",
  "late",
  "half_day",
  "on_leave",
] as const;
export const ACTIVITY_FILTERS = ["all", "leaves", "eod", "other"] as const;
export const NOTIFICATION_FILTERS = ["all", "unread", "read"] as const;

export type FilterValue = string;

/** Convert a filter tab value to a `status` query param (`all` → undefined). */
export const statusParam = (v: string): string | undefined =>
  v === "all" ? undefined : v;

# CodeableHR — EMPLOYEE Dashboard Spec (Gospel for Web Build)

> This document is fully self-contained. It carries **everything** needed to rebuild the Employee experience as a Next.js web dashboard: global conventions, the complete enum catalog, all shared data models, auth, every screen, every input, every API call, and web-design guidance. You do not need any other file. (The HR and Admin specs duplicate the shared sections; only the role sections differ.)

---

## 0. How to read this doc

- **Wire value** = the exact string sent to / received from the backend for an enum. Always use the wire value in requests, never the label.
- **Label** = human-facing display text.
- Every API path below is relative to the base URL and is prefixed by the API version segment (see §3). Paths are written as the app's endpoint constants, e.g. `GET /leaves/history`. In the running app these resolve to `{BASE_URL}/api/...` (see §3.8 endpoint reference for exact strings).
- "Editable vs read-only", "opens dialog vs bottom-sheet vs page" are called out per field/interaction because they drive the web layout (modal vs inline vs route).
- **Mobile → Web intent**: mobile uses bottom-sheets and full-screen pushes; on web these usually become **right-side drawers / modals / dedicated routes** as noted per screen.
- **Role note**: An Employee may also be a **manager** (their `isManager` flag is true if other employees report to them). Manager-only sections are flagged. Managers approve/reject their reports' leaves and read their EODs — but do NOT get HR/Admin-wide powers.

---

## 1. Role Overview — EMPLOYEE

**Landing screen:** `/employee-home` (Dashboard).
**Navigation model:** left drawer (hamburger) with 8 primary destinations + Settings + Logout. No bottom nav on web — use a persistent left sidebar.

**What an Employee CAN do:**
- View personalized dashboard (greeting, leave balance, holidays, birthdays, recent activity, at-a-glance stats).
- Submit / edit / delete **EOD reports** (own).
- Apply for **leave**, view balance & history.
- View own **attendance** logs (classified per month).
- Submit **insurance claims** and **expense claims**; track status.
- Raise **HR Help** tickets (confidential, optionally anonymous) and chat with HR.
- View **salary** breakdown, revision history, download payslips.
- View **policies** (read-only PDF).
- View **notifications** & **recent activity**.
- Edit limited **profile** fields (avatar, phone, emergency contact) and preferences.
- **If manager**: view team members' EOD reports (mark read) and approve/reject team leave requests.

**What an Employee CANNOT do:** manage other employees, departments, payroll generation, projects management, finance/equity/loans/devices, announcements, holiday/policy creation.

---

## 2. Auth & Session (shared core)

### 2.1 Login & onboarding
- **Public routes** (no auth): `/` (splash), `/login`, `/forgot-password`, `/otp`, `/new-password`.
- Top-level guard: if not authenticated and route is not public → redirect to `/login`.
- After login, land on role home via role mapping: `admin → /admin-home`, `hr → /hr-home`, `employee|null → /employee-home`.

### 2.2 Auth endpoints (no bearer token attached; interceptor skips these)
| API | Body | Response | Notes |
|---|---|---|---|
| `POST /auth/login` | `{ email, password }` | `{ user: UserModel, tokens: { token, refresh_token } }` | 401 wrong creds; 429 too many attempts |
| `POST /auth/google` | `{ id_token }` | same as login | Google OAuth (server verifies id_token) |
| `POST /auth/refresh-token` | `{ refresh_token }` (also accepts `Authorization: Bearer <refresh>`) | `{ tokens: { token, refresh_token } }` | refresh token rotates each call |
| `POST /auth/logout` | empty (bearer) | 200 | invalidate session |
| `POST /auth/forgot-password` | `{ email }` | 200 | starts OTP flow |
| `POST /auth/verify-otp` | `{ email, otp }` | `{ reset_grant }` | grant used for reset |
| `POST /auth/reset-password` | `{ reset_grant, new_password }` | 200 | |
| `POST /auth/password/change` | `{ current_password, new_password }` | 200 | authenticated change |

### 2.3 Token handling
- Access token attached as `Authorization: Bearer <token>` on every non-auth request.
- On **401** (non-auth endpoint): attempt one refresh via `/auth/refresh-token`, persist rotated tokens, retry the original request once. On refresh failure (401/403 or missing refresh) → **force logout**, clear storage, navigate to login. Concurrent 401s share a single in-flight refresh.
- Web equivalent: store tokens in httpOnly cookies or secure storage; implement the same single-flight refresh + forced-logout behavior.

### 2.4 Password policy (for reset/change UI)
Requirements list (all must pass): min 8 chars, one uppercase, one number, one special character. Show a live checklist.

---

## 3. Global Conventions (shared core)

### 3.1 Environments
Three flavors, each with its own `.env`: **development / staging / production**. Each defines `BASE_URL`, `API_VERSION` (path segment), `GOOGLE_SERVER_CLIENT_ID`. Requests go to `{BASE_URL}/{API_VERSION}/...`. (Dev may override base URL via Firebase Remote Config.)

### 3.2 HTTP layer
- Client: Dio (web: axios/fetch). Content-Type `application/json`. Timeout 60s connect + 60s receive.
- Methods used: GET, POST, PUT, PATCH, DELETE, plus multipart POST/PATCH for file uploads.

### 3.3 Standard response envelope
Success:
```json
{ "statusCode": 200, "data": { ... }, "error": null }
```
Error:
```json
{ "statusCode": 400, "data": null,
  "error": { "code": "VALIDATION_ERROR", "message": "…", "timestamp": "…",
             "details": [ { "field": "email", "reason": "Invalid format" } ] } }
```
- `hasError` = `error != null`. Parse typed data from `data` (optionally under a key like `items`, `pagination`).
- Fallback error messages by status: 400 "Bad request", 401 "Unauthorized", 403 "Forbidden", 404 "Not found", 429 "Too many attempts. Please try again shortly.", 500 "Internal server error".

### 3.4 Pagination
`PaginationModel` = `{ currentPage, totalPages, totalItems }`. `hasMore = currentPage < totalPages`. Tolerates snake_case (`current_page`…) and legacy `{ page, limit, total }` (derives `totalPages = ceil(total/limit)`).
- **Requests** send `page` (1-indexed) and `limit`.
- List responses commonly shaped `{ items: [...], pagination: {...}, counts: {...} }` where `counts` powers filter-tab badges over the **whole set** (not just current page).

### 3.5 Money & amount formatting
- Group thousands with commas on input (`ThousandsSeparatorInputFormatter`): `25000 → 25,000`. Parse back by stripping commas.
- Display: `5,600` or `5,600.50` (keep 2 decimals only if fractional). Compact: `100k`, `5.6M`, `3T`.
- Currency: **PKR** default (backend stores PKR), some finance flows allow **USD**. Amount fields are numeric with comma grouping.

### 3.6 Date/time formatting
- Wire date: `YYYY-MM-DD`. Wire month key: `YYYY-MM`. ISO datetime for timestamps.
- Display helpers exist for ordinal dates ("7th June 2026"), ranges ("25th — 28th June 2026"), relative time ("5m ago", "2d ago", server may supply `time_ago`).

### 3.7 Standard UI states (apply to EVERY list/detail screen)
| State | Mobile behavior | Web equivalent |
|---|---|---|
| Loading (first page) | Skeleton shimmer (cards/tiles) | Skeleton rows/cards |
| Loading more (pagination) | Footer spinner on infinite scroll | "Load more" or infinite scroll + spinner |
| Empty | Icon + title + subtitle message (quoted per screen) | Empty-state panel |
| Error (no cached data) | Full error widget + Retry button | Error panel + Retry |
| Error (cached data present) | Toast error, keep showing cached data | Toast, keep data |
| Pull-to-refresh | Swipe down | Refresh button / auto-refresh |
| Success action | Toast (snackbar) | Toast |

### 3.8 Endpoint reference (constants → paths) — the ones an Employee hits
(Full org-wide list is in the HR/Admin specs; Employee-relevant subset:)
- Dashboard: `GET /dashboard`
- Leaves: `GET /leaves/quota`, `GET /leaves/types`, `POST /leaves/apply`, `GET /leaves/history`, `GET /leaves/team`, `GET /leaves/team/{employeeId}`, `PATCH /leaves/{id}/decision`
- EOD: `GET /eods`, `POST /eods` (draft), `POST /eods/submit`, `GET /eods/{id}`, `DELETE /eods/{id}`, `GET /eods/team`, `GET /eods/team/is-manager`, `GET /eods/team/{employeeId}`, `PATCH /eods/{id}/read`
- Attendance: `GET /attendance/logs?month&year`
- Insurance claims: `GET /insurance-claims`, `GET /insurance-claims/{id}`, `POST /insurance-claims`
- Expense claims: `GET /expense-claims`, `GET /expense-claims/{id}`, `POST /expense-claims`
- Tickets (HR Help): `GET /tickets`, `GET /tickets/{id}`, `POST /tickets`, `POST /tickets/{id}/replies`
- Salary: `GET /salary/breakdown`, `GET /salary/revisions`, `GET /salary/slips`, `GET /salary/slips/{id}/download`
- Policies: `GET /policies`, `GET /policies/{id}`
- Notifications: `GET /notifications`, `GET /notifications/unread-count`, `PATCH /notifications/{id}/read`, `PATCH /notifications/read-all`, `GET /activity`, `POST /notifications/devices`
- Profile: `GET /profile`, `PATCH /profile`, `POST /profile/avatar` (multipart), `DELETE /profile/avatar`, `DELETE /profile`, `GET /profile/preferences`, `PATCH /profile/preferences`
- Uploads: `POST /uploads` (multipart, returns `{ key, url }`)
- Enums: `GET /enums`

---

## 4. Full Enum Catalog (shared core — reproduce verbatim)

> These are the exact enum values. **Wire** is what crosses the network. **Label** is display text. **Color** is a UI hint (hex).

### Status / lifecycle enums
**LeaveStatus** — approved `approved` (green #4CAF50) · pending `pending` (orange #FF9800, default) · rejected `rejected` (red #EA5455)
**ClaimStatus** (insurance) — approved `approved` (green) · pending `pending` (orange, default) · rejected `rejected` (red)
**ExpenseStatus** — approved `approved` (green) · pending `pending` (orange, default) · rejected `rejected` (red)
**ExpenseEntryStatus** (admin ledger) — recorded `recorded` (green) · pendingAmount `pending_amount` (orange) · paid `paid` (blue)
**EodReportStatus** — submitted `submitted` (green) · pending `pending` (warning) · draft `draft` (grey, default)
**AttendanceStatus** — present `present` (green) · absent `absent` (red) · late `late` (orange) · halfDay `half_day` (purple) · onLeave `on_leave` (blue) · holiday `holiday` (cyan)
**CheckInStatus** — notCheckedIn `not_checked_in` · checkedIn `checked_in` · checkedOut `checked_out`
**IssueStatus** — open `open` (blue) · inProgress `in_progress` (orange) · resolved `resolved` (green) · closed `closed` (grey)
**IssuePriority** — high `high` (red) · medium `medium` (orange, default) · low `low` (green)
**SalarySlipStatus** — generated `generated` (green; payroll label "Sent") · pending `pending` (orange; "Not sent", default)
**LoanStatus** — active `active` (default) · completed `completed` · cancelled `cancelled`
**EmployeeStatus** — active `active` · inactive `inactive`
**DeviceStatus** — active (from isActive true, green) · inactive (grey)
**DistributionStatus** — draft `draft` · confirmed `confirmed` · voided `voided`
**MilestoneStatus** — pending `pending` (default) · inProgress `in_progress` · completed `completed`
**TaskStatus** — todo `todo` (default) · inProgress `in_progress` · done `done`
**ProjectStatus** — planning `planning` · active `active` · onHold `on_hold` · completed `completed` · archived `archived`
**PerkStatus** — active (green) · upcoming (blue) · expired (grey)

### Type / category enums
**LeaveType** — annual `annual` · casual `casual` (default) · sick `sick` · maternity `maternity` · paternity `paternity` · compassionate `compassionate` · marriage `marriage` · hajjUmrah `hajj_umrah` · iddat `iddat`. Each has icon + color + shortLabel. Accrued types (annual/casual/sick) carry quota; special types are event-based with entitlement/occurrence caps and sometimes gender gate.
**LeaveDuration** — halfDay `half_day` · fullDay `full_day` (default) · multipleDays `multiple_days`
**HalfDayPeriod** — am `am` ("Earlier half (AM)") · pm `pm` ("Later half (PM)")
**ClaimReason** (insurance) — consultation `consultation` · medication `medication` · labTests `labTests` · hospitalization `hospitalization` · dental `dental` · optical `optical` · other `other`. (Reason list is also server-driven via `/enums claim_reason`.)
**ExpenseCategory** (employee claims) — travel `travel` · meals `meals` · office `office` · software `software` · training `training` · equipment `equipment` · other `other`. (Also server-driven via `/enums expense_category`.)
**ExpenseCurrency** — pkr `PKR` (₨, default) · usd `USD` ($)
**AdminExpenseType** (company ledger) — officeSupplies `Office Supplies` · travel `Travel` · mealsAndEntertainment `Meals & Entertainment` · softwareAndSubscriptions `Software & Subscriptions` · hardwareAndEquipment `Hardware & Equipment` · utilities `Utilities` · rent `Rent` · marketing `Marketing` · trainingAndDevelopment `Training & Development` · maintenanceAndRepairs `Maintenance & Repairs` · other `Miscellaneous`
**ExpenseAmountType** — oneTime `one_time` · fixed `fixed` · variable `variable`
**ExpenseFrequencyFilter** — all `null` · oneTime `one_time` · recurring `recurring`
**IssueCategory** (HR Help) — payroll `payroll` · leave `leave` · benefits `benefits` · workplace `workplace` · harassment `harassment` · whistleblower `whistleblower` · grievance `grievance` · general `general` (default). harassment/whistleblower/grievance are **sensitive** (auto-suggest anonymity, priority high). Also server-driven via `/enums ticket_category`.
**HolidayType** — religious `religious` · national `national` · company `company`
**EmploymentType** — fullTime `full_time` · partTime `part_time` · contract `contract` · intern `intern` · freelancer `freelancer`
**PerkType** — medicalInsurance `medical_insurance` · providentFund `provident_fund` · fuelAllowance `fuel_allowance` · mealAllowance `meal_allowance` · phoneAllowance `phone_allowance` · other `other`
**SalaryRevisionType** — initial `initial` (default) · increment `increment` · promotion `promotion`
**NotificationCategory** — leave `leave` · eod `eod` · payslip `payslip` · policy `policy` · claim `claim` · expense `expense` · ticket `ticket` · general `general` (default)
**ActivityType** — eodApproved · leaveApproved · leaveRejected · payslip · policy · claimApproved · claimRejected · expenseApproved · expenseRejected · ticket · announcement (each maps to a category/type + icon + color)
**UserRole** — employee `employee` · hr `hr` · admin `admin` (`isManager` = hr or admin). Hive-persisted.
**MessageSender** (ticket thread) — user `user` · hr `hr` · system `system` (default)
**MessageDeliveryStatus** (client-only) — sending · sent · failed
**Language** — english `en` · arabic `ar`

### Filter enums (drive tab chips)
**LeaveFilter** — all · pending · approved · rejected
**ClaimFilter** — all · approved · pending · rejected
**ExpenseFilter** — all · approved · pending · rejected
**IssueFilter** — all · open · inProgress · resolved · closed
**EodReportFilter** — all · submitted · pending · draft
**EodReadFilter** — all · unread · read
**AttendanceLogFilter** — all · present · absent · late · halfDay · onLeave (+holiday in detail)
**ActivityFilter** — all `all` · leaves `leaves` · eod `eod` · other `other`
**NotificationFilter** — all `all` · unread `unread` · read `read`
**HolidayTimeFilter** — upcoming · past

### Admin/finance enums (not used by Employee, listed for completeness of the shared catalog)
**AdjustmentDirection** — inflow `in` · outflow `out`
**AdjustmentType** — tax `tax` · providentFund `provident_fund` · capital `capital` · other `other`
**BeneficiaryKind** — person `person` · esop `esop` · charity `charity` · other `other`
**AnnouncementTarget** — all `all` · department `department` · role `role`
**AnnouncementRole** — admin · hr · manager · employee
**ProjectPriority** — low · medium (default) · high · critical
**ProjectMemberRole** — lead · manager · developer · designer · qa · devops · analyst · member (default)
**ProjectDocumentType** — file `file` · note `note` · link `link`

### Server-driven enums (`GET /enums`)
Keys fetched at startup: `roles`, `employment_type`, `payment_method`, `gender`, `expense_type`, `expense_currencies`, `claim_reason`, `expense_category`, `language`, `perk_keys`, `ticket_category`. Prefer server values for pickers where present; fall back to the Dart enums above.

---

## 5. Shared Domain Models (shared core)

> Field | JSON key | type | notes. Only the fields an Employee actually consumes are strictly required, but the full shapes are given so the web layer matches the API exactly.

### UserModel (login + profile)
`id`, `email`, `full_name`, `role` (UserRole), `avatar`, `status`, `employee_code`, nested `employment { designation, department, joined_at, employment_type }`, `phone`, `dob`, `cnic`, `emergency_contact { name, phone, relation }`, plus salary/perks/loans on detail. `initials` computed.

### DashboardModel (`GET /dashboard`, role-aware)
`greeting`, `current_date`, `eod_pending` (bool), `at_a_glance { total_hours_worked, attendance_status (CheckInStatus), next_salary, next_holiday }`, `leave_balance[] { leave_type, name, total, used, remaining }`, `upcoming_holidays[] { id, name, date, daysUntil }`, `birthdays[] { employee_code, name, birthday, avatar }`, `recent_activity[] { id, title, subtitle, type (ActivityType), timestamp }`, `team_eod_updates[]` (manager), `team_leave_requests[]` (manager), `on_leave_today[]` (manager/hr/admin), `open_tickets[]`, `org_stats` (admin), `department_distribution[]` (admin), `pending_leaves[]` (hr/admin). **Absent section = not applicable to caller; drive widget visibility off presence.**

### LeaveModel
`id`, `date_from`, `date_to`, `status` (LeaveStatus), `leave_type` (LeaveType), `leave_type_name`, `total_days`, `paid_days`, `unpaid_days`, `duration` (LeaveDuration), `is_half_day`, `half_day` (`am`/`pm`), `reason`, `applied_date`, `approver` (EmployeeRef), `response_date`, `response_note`. Getters: date-range labels, `hasUnpaid`, `isSplit`, `daysLabel`.

### LeaveTypeModel (`GET /leaves/types`)
`leave_type_id` (slug), `name`, `kind` (`accrued`/`special`), `paid`, `eligible`, `quota`/`used`/`remaining` (accrued), `entitlement_days`/`max_occurrences`/`occurrences_used`/`occurrences_remaining` (special), `gender` gate, `qualifying_months`, `ineligible_reason`.

### LeaveBalanceModel (`GET /leaves/quota`)
`leave_type_id`, `name`, `quota`→total, `used`, `remaining`.

### LeaveHistoryModel
`counts { pending, approved, rejected }`, `items[] LeaveModel`, `pagination`.

### EodReportModel
`id`, `date` (YYYY-MM-DD), `status` (EodReportStatus), `summary`, `portal`, `project_id`, `hours`, `blockers`, `tomorrow_plan`, `is_read`, `can_edit`, `can_delete`, `created_at`, `updated_at`.
### EodListModel — `counts { draft, pending, approved }`, `items[]`, `pagination`.

### AttendanceMonthModel (`GET /attendance/logs`)
`summary { present_days, absent_days, leave_days, total_hours }` (+ classified counts & avgDailyHours), `items[] { date, status (AttendanceStatus), check_in, check_out, hours_worked, holiday_name, sessions[] { check_in, check_out, hours_worked } }`.

### InsuranceClaimModel
`id`, `date`, `status` (ClaimStatus), `reason` (ClaimReason), `reason_display`, `amount` (PKR), `note`, `attachments[]`, `applied_date`, `reviewed_by` (EmployeeRef), `response_date`, `response_note`, `employee` (EmployeeRef; populated only on manager/admin queues).

### ExpenseClaimModel
`id`, `date`, `status` (ExpenseStatus), `category` (ExpenseCategory), `category_display`, `amount` (PKR), `description`, `applied_date`, `attachments[]`, `reviewed_by`, `response_date`, `response_note`, `employee` (EmployeeRef; manager/admin only).

### Ticket / Issue models (HR Help)
Issue: `id`, `title`, `description`, `category` (IssueCategory), `status` (IssueStatus), `priority` (IssuePriority), `is_anonymous`, `assigned_to`, `created_at`, `messages[]`. Message: `sender` (MessageSender), `content/message`, `created_at`, delivery status (client). `IssueListModel { counts { open, resolved, closed }, items[], pagination }`.

### Salary models
`SalaryBreakdownModel` (basic, allowances, deductions, tax, provident fund, net; nullable if unconfigured). `SalaryRevisionModel` (type SalaryRevisionType, effective date, values). `SalarySlipModel` (month/year, status SalarySlipStatus, gross, net, earnings[], deductions[], download).

### PolicyModel
`id`, `title`, `description`, `document_url` (PDF), `effective_date`, `created_at`, `updated_at`.

### NotificationModel
`id`, `title`, `body`, `category` (NotificationCategory), `type` (granular), `data (NotificationDataModel: target + entity ids)`, `created_at`, `is_read`, `time_ago`. Targets: leave, eod, payslip, claim, expense, ticket, policy, holiday, profile, security, announcement.

### ActivityModel / ActivityFeedModel
Activity: `id`, `title`, `subtitle`, `type` (ActivityType), `timestamp`, `time_ago`. Feed: `counts { all, leaves, eod, other }`, `items[]`, `pagination`.

### ProfileModel / LoanModel / PerkModel
Profile: employeeCode, name, email, position, department, manager, salary, dateOfJoining, birthday, phone, avatar, cnic, emergencyContact(+name), employmentType, `loans[]`, `perks[]`. Loan: title, totalAmount, remainingAmount, totalInstallments, paidInstallments, startDate, monthlyDeduction (+progress). Perk: title, description, status (PerkStatus).

### NotificationPreferencesModel (`/profile/preferences`)
`notifications_enabled` (bool), `language` (`en`/`ar`).

### HolidayModel
`id`, `name`, `type` (HolidayType), `date`, `days`, `image`, `description` (+endDate, daysLeft, isPast).

---

## 6. Navigation Model — EMPLOYEE

**Landing:** `/employee-home` (app bar "Dashboard", no back).
**Drawer (sidebar) destinations (8 branches, order matters):**
1. Dashboard → `/employee-home`
2. EOD Reports → `/employee-eod-reports`
3. Leaves → `/employee-leaves`
4. Attendance → `/employee-attendance`
5. Insurance Claims → `/employee-insurance-claims`
6. Expense Claims → `/employee-expense-claims`
7. HR Help → `/employee-hr-help`
8. Policies → `/employee-policies` (shared PoliciesScreen)

**Drawer footer:** Settings → `/employee-settings`; Logout (confirmation sheet → clears session, restart at login).
**Drawer header:** avatar + name + role → tap opens `/employee-profile`.

**Secondary routes (pushed as full pages / web = dedicated routes or modals):**
`/employee-eod-reports/submit` (EodReportModel? extra), `/employee-eod-reports/team`, `/employee-eod-reports/team/member` (TeamMemberModel extra), `/employee-apply-for-leave`, `/employee-leaves-history`, `/employee-leaves/team`, `/employee-leaves/team/member`, `/employee-insurance-claims/submit`, `/employee-expense-claims/submit`, `/employee-hr-help/new`, `/employee-hr-help/issue` (issue extra), `/employee-salary-details`, `/employee-recent-activity`, `/employee-notifications`, `/employee-settings`, `/employee-profile`, shared `/policies/view` (PolicyModel extra), `/all-holidays`.

**Notification deep-links (target → route):** leave→`/employee-leaves`, eod→`/employee-eod-reports`, claim→`/employee-insurance-claims`, expense→`/employee-expense-claims`, ticket→`/employee-hr-help`, policy→`/policies`, holiday→`/all-holidays`, payslip→`/employee-salary-details`, profile→`/employee-profile`, security→`/employee-settings`, announcement→no-op.

---

## 7. Screens — EMPLOYEE (the bulk)

### 7.1 Dashboard — `employee-home` (`/employee-home`)
- **Purpose:** personalized overview + quick actions.
- **App bar:** "Dashboard" + notification bell (→ `/employee-notifications`).
- **Sections (top→bottom):**
  1. **EOD reminder banner** — shown only if `eod_pending == true`; tap → `/employee-eod-reports/submit`.
  2. **Greeting banner** — greeting text + attendance-status pill (from `at_a_glance.attendance_status`).
  3. **Quick actions** (4 buttons): Submit EOD → `/employee-eod-reports/submit`; Apply Leave → `/employee-apply-for-leave`; Attendance → switch to `/employee-attendance` branch; HR Help → `/employee-hr-help/new`.
  4. **Team EOD section** (manager only) — → `/employee-eod-reports/team`.
  5. **Team Leaves section** (manager only) — → `/employee-leaves/team`.
  6. **At a glance** — hours, attendance %, next salary, next holiday.
  7. **Leave balance** — cards per accrued type (used vs remaining).
  8. **Upcoming holidays**, 9. **Birthdays**, 10. **Recent activity** (max 4; "View All" → `/employee-recent-activity`).
- **States:** skeleton on first load; error+retry when no cached data; pull-to-refresh keeps cache, toast on refresh failure.
- **API:** `GET /dashboard` on init.
- **Web intent:** top KPI row (at-a-glance) + 2-col grid: left = quick actions + leave balance; right = holidays/birthdays/activity. Manager sections as a distinct band.

### 7.2 EOD Reports — `employee-eod-reports` (`/employee-eod-reports`)
- **Purpose:** list own EODs, filter, edit/delete, submit new.
- **App bar:** "EOD Reports" + (manager) team icon → `/employee-eod-reports/team`.
- **Filter tabs (EodReportFilter):** All · Submitted · Pending · Draft — each with badge counts; **per-tab pagination cache**.
- **FAB:** "Submit EOD" → `/employee-eod-reports/submit`.
- **Interactions:** card tap → **EodReportDetailsDialog** (read-only popup). Edit icon (if `can_edit`) → submit screen in edit mode. Delete icon (if `can_delete`) → **EodDeleteReportDialog** (confirm) → `DELETE /eods/{id}`, removed from all tabs.
- **States:** skeleton; empty "No reports yet"; error+retry (or toast over cache); infinite scroll (`page` up to `totalPages`).
- **APIs:** `GET /eods?page&limit=10&status=<wire|all>` (per tab); `DELETE /eods/{id}`.
- **Web intent:** table (Date, Project, Summary, Status, Hours, Actions) + status filter row; detail as side-panel/modal; delete = confirm dialog.

### 7.3 Submit / Edit EOD — `employee-submit-eod-report` (`/employee-eod-reports/submit`)
- **Purpose:** create/edit EOD; supports **Save Draft** and **Submit**.
- **Entry:** FAB, dashboard reminder, or edit (passes `EodReportModel` → title "Edit EOD Report").
- **Inputs:**
  | Field | Widget | Options | Validation | Req | Editable | Default |
  |---|---|---|---|---|---|---|
  | Report date | date chips (past 7 days + today) | — | picker-enforced range | Yes | Yes | Today |
  | Project | searchable dropdown from `/projects/options` | project list | "Please select a project" | Yes | Yes | none |
  | Summary | multiline textarea | — | 10–1000 chars, non-empty | Yes | Yes | empty |
  | Hours | (hidden, state) | — | — | No | No | 8.0 |
  | Blockers | textarea (optional collapsible) | — | — | No | Yes | empty |
  | Tomorrow plan | textarea (optional) | — | — | No | Yes | empty |
- **Footer:** sticky bar — Save Draft (`POST /eods`) + Submit (`POST /eods/submit`). Both bodies: `{ date, hours, summary, project_id, blockers, tomorrow_plan }`. Success → toast + pop; upsert into cached tabs.
- **API:** `GET /projects/options` on init.
- **Web intent:** single-column form; project autocomplete; large summary textarea; sticky footer (Draft left, Submit right).

### 7.4 Team EOD — `employee-team-eod` (`/employee-eod-reports/team`) [manager]
- List of team members reporting to user; each card shows avatar/name + **unread EOD count** badge. Subtitle "Members reporting to you". Tap → `/employee-eod-reports/team/member` (passes member).
- **API:** `GET /eods/team` → `{ items: TeamMemberModel[] }`. Skeleton(5)/empty "No team members"/error+retry.
- **Web intent:** member grid/list with unread badges.

### 7.5 Team Member EOD — `employee-team-member-eod` (`/employee-eod-reports/team/member`) [manager]
- Header = member (live). **Read filter chips (EodReadFilter):** All · Unread · Read (client-side). Card tap → **optimistically mark read** (`PATCH /eods/{id}/read`, decrement unread), show **EodReportDetailsDialog**.
- **API:** `GET /eods/team/{employeeId}`; `PATCH /eods/{id}/read`. Skeleton(3)/empty "No reports found".
- **Web intent:** member header + read/unread tabs + report list; detail modal.

### 7.6 Leaves — `employee-leaves` (`/employee-leaves`)
- **App bar:** "Leaves" + (manager) team icon → `/employee-leaves/team`.
- **Sections:** leave-balance cards (per accrued type); "Recent Leaves" header + "View All" → `/employee-leaves-history`; recent list (max 4). **FAB:** Apply Leave → `/employee-apply-for-leave`.
- **Interactions:** leave card → **LeaveDetailsDialog** (read-only).
- **APIs:** `GET /leaves/quota` + `GET /leaves/history?page=1&limit=10&status=all` on init. Pull-to-refresh both.
- **Web intent:** balance cards (donut used/remaining) + recent list; "View All" → history route.

### 7.7 Apply for Leave — `employee-apply-for-leave` (`/employee-apply-for-leave`)
- **Purpose:** guided leave application.
- **Inputs:**
  | Field | Widget | Options | Validation | Req | Default |
  |---|---|---|---|---|---|
  | Leave type | selector (modal picker) | LeaveType from `/leaves/types` (shows eligibility/balance) | "Please select a leave type" | Yes | none |
  | Duration | segmented | fullDay/halfDay/multipleDays | — | Yes | fullDay |
  | Half-day period | segmented (if halfDay) | am/pm | — | cond. | none |
  | Start date | date picker | tomorrow→+30d | required | Yes | Today |
  | End date | range picker (if multipleDays) | ≥ start | required if multi | cond. | none |
  | Reason | textarea | — | required (+length) | Yes | empty |
- **Summary card** shows computed days; **unpaid warning** if over quota (`unpaid_days > 0`).
- **Submit:** `POST /leaves/apply` body `{ leave_type_id, date_from, date_to, reason, duration, half_day|null }` → toast + pop; refresh balances + history.
- **API:** `GET /leaves/types` on init.
- **Web intent:** numbered steps; leave type as rich select showing balance; calendar pickers; sticky Submit.

### 7.8 Leave History — `employee-leave-history` (`/employee-leaves-history`)
- **Filter tabs (LeaveFilter):** All · Pending · Approved · Rejected (badge counts, per-tab cache). Results-count text. Infinite scroll. Card → LeaveDetailsDialog. **FAB:** Apply Leave.
- **API:** `GET /leaves/history?page&limit=10&status=<wire|all>`.
- **Web intent:** table (Date range, Type, Status, Duration, Reason) + filter row.

### 7.9 Team Leaves — `employee-team-leaves` (`/employee-leaves/team`) [manager]
- Member list with **pending leave count** badges. Tap → `/employee-leaves/team/member`. `GET /leaves/team`. Skeleton(5)/empty "No team members".

### 7.10 Team Member Leaves — `employee-team-member-leaves` (`/employee-leaves/team/member`) [manager]
- Member header + pending count. **Status filter chips** All/Pending/Approved/Rejected (client-side). 
- **Decision flow:** tap **pending** leave → **LeaveDetailsDialog** with **Approve** + **Reject** buttons. Approve → **ApproveLeaveDialog** (confirm) → decision. Reject → **RejectReasonDialog** (reason text) → decision. Non-pending → read-only dialog.
- **APIs:** `GET /leaves/team/{employeeId}`; `PATCH /leaves/{id}/decision` body `{ decision: "approve"|"reject", rejection_reason?: string }`. Refresh member leaves + team roster after.
- **Web intent:** member detail; leave list with inline Approve/Reject on pending rows; reject opens reason modal.

### 7.11 Attendance — `employee-attendance` (`/employee-attendance`)
- **Purpose:** own monthly classified attendance.
- **App bar:** "My Attendance" (no back — drawer branch).
- **Sections:** month/year selector; **summary card** (present/absent/late/on-leave counts + avg daily hours); **pinned filter chips (AttendanceLogFilter):** All/Present/Absent/Late/Half Day/On Leave (client-side); daily log list.
- **Interactions:** log card → **AttendanceSessionsDialog** (check-in/out sessions drill-down). Pull-to-refresh; month change reloads.
- **API:** `GET /attendance/logs?month&year` → AttendanceMonthModel. No pagination (whole month).
- **Web intent:** month picker + summary stat row + status filter + table (Date, Status, Check-In, Check-Out, Hours), expandable sessions.

### 7.12 Insurance Claims — `employee-insurance-claims` (`/employee-insurance-claims`)
- **Filter chips (ClaimFilter):** All · Approved · Pending · Rejected (per-tab cache). **FAB:** "New Claim" → submit screen. Card tap → detail dialog (read-only for own claims). Infinite scroll, pull-to-refresh.
- **API:** `GET /insurance-claims?page=1&limit=20&status=<all|wire>`.
- **Empty:** "No claims yet…". **Web intent:** table (Date, Reason, Amount, Status) + filter tabs.

### 7.13 Submit Insurance Claim — `employee-submit-insurance-claim` (`/employee-insurance-claims/submit`)
- **Inputs:**
  | Field | Widget | Options | Validation | Req | Default |
  |---|---|---|---|---|---|
  | Reason | dropdown | ClaimReason (server-driven) | "Please select a reason" | Yes | none |
  | Date of expense | date picker | 365d ago → today | "Please select a date" | Yes | none |
  | Amount (PKR) | number (thousands sep) | — | > 0 | Yes | empty |
  | Attachment | image/PDF picker | JPG/PNG/PDF | optional | No | none |
  | Note | textarea (500) | — | "Please add a note" | Yes | empty |
- **Attachment:** tap → bottom-sheet Pick Image / Pick PDF / Remove. Upload via `POST /uploads` (folder `attachments`) → URL.
- **Submit:** `POST /insurance-claims` `{ reason, amount, note, expense_date, attachment|null }` → toast + pop, refresh list. Sticky footer Cancel/Submit.
- **Web intent:** modal or route form; file dropzone; reason select; amount with ₨.

### 7.14 Expense Claims — `employee-expense-claims` (`/employee-expense-claims`)
- Same shape as 7.12 with **ExpenseFilter**. **FAB:** "New Expense". `GET /expense-claims?page&limit&status`. Web intent identical (table + tabs).

### 7.15 Submit Expense Claim — `employee-submit-expense-claim` (`/employee-expense-claims/submit`)
- **Guided 5-step form:** (1) How much? Amount; (2) What was it for? Category picker; (3) When? Date; (4) Receipt (optional image/PDF); (5) Add a note.
- **Inputs:**
  | Field | Widget | Options | Validation | Req | Default |
  |---|---|---|---|---|---|
  | Amount | number (thousands) | — | > 0 | Yes | empty |
  | Category | picker | ExpenseCategory (server-driven) | required | Yes | none |
  | Date | date picker | 365d ago → today | "Please select a date" | Yes | none |
  | Receipt | image/PDF | — | optional | No | none |
  | Note | textarea (500) | — | — | Yes | empty |
- **Submit:** `POST /expense-claims` `{ category, amount, description, expense_date, attachment|null }`. Sticky bar shows running total.
- **Web intent:** stepper or single form with grouped sections; sticky summary.

### 7.16 HR Help — `employee-hr-help` (`/employee-hr-help`)
- **Privacy notice:** "Your conversations are private. Only HR can see what you share here."
- **Filter chips (IssueFilter):** All · Open · Closed · In Progress (per-tab cache). **FAB:** "Raise Issue" → `/employee-hr-help/new`. Card tap → issue thread `/employee-hr-help/issue`.
- **API:** `GET /tickets?page&limit&status=<all|wire>`. Web intent: list of tickets with status/priority chips; tap → thread view.

### 7.17 Raise Issue — `employee-raise-issue` (`/employee-hr-help/new`)
- **Notice:** "This is a safe space… Only you and HR will have access."
- **Inputs:**
  | Field | Widget | Options | Validation | Req | Default |
  |---|---|---|---|---|---|
  | Category | picker | IssueCategory (server ticket_category) | "Please select a category" | Yes | none |
  | Subject | text | — | "Please enter a subject" | Yes | empty |
  | Description | textarea (1000) | — | "Please describe your issue" | Yes | empty |
  | Submit Anonymously | checkbox | — | — | No | false (auto-on for sensitive) |
- Sensitive category → shows **SensitiveComplaintNotice**, pre-enables anonymity, sends `priority: high`.
- **Submit:** `POST /tickets` `{ title, description, category, is_anonymous, priority? }` → **pushReplacement** to the created issue thread.
- **Web intent:** form modal/route; category-driven safety messaging; anonymity toggle.

### 7.18 Issue Thread — `employee-issue-detail` (`/employee-hr-help/issue`)
- **Header card:** title, date, chips (Status w/ dot, Priority, Category), assigned-to.
- **Thread:** messages grouped by date (date chips "Today"/"Yesterday"/date); bubbles — **own** right/blue, **HR** left/purple w/ name+avatar, **system** centered grey ("Status changed to …"). Optimistic send: bubble appears immediately (clock, 60% opacity); on failure shows "Not sent · Tap to retry".
- **Reply input:** sticky footer text field (grows to 4 lines) + send (disabled when empty). Hidden + replaced by "This issue has been [status]. You cannot reply." when closed/resolved.
- **APIs:** `GET /tickets/{id}` (full thread) on init; `POST /tickets/{id}/replies` `{ message }` (optimistic, swap server copy on success). Loading shimmer(4)/error+retry.
- **Web intent:** chat pane with date separators, sender-styled bubbles, delivery indicators, retry on failed send.

### 7.19 Salary Details — `employee-salary-details` (`/employee-salary-details`)
- **Sections:** salary breakdown card (basic/allowances/deductions/net) OR "No salary configured yet" banner; provident-fund banner (if > 0); **Salary History** (revisions timeline); **Salary Slips** (list w/ per-slip Download).
- **APIs (parallel on init):** `GET /salary/breakdown`, `GET /salary/revisions`, `GET /salary/slips`. Download: `GET /salary/slips/{id}/download` → `{ url }` (presigned) → browser download. Pull-to-refresh reloads all; per-slip download spinner.
- **Web intent:** 3-section page; breakdown card; history timeline; slips table with download button.

### 7.20 Recent Activity — `employee-recent-activity` (`/employee-recent-activity`)
- **Filter chips (ActivityFilter):** All · Leaves · EOD · Other (client-side, counts stable). Feed up to 50 items (no pagination). `GET /activity?filter=<wire>&page=1&limit=50`. Web intent: activity feed with category filter.

### 7.21 Settings — `employee-settings` (`/employee-settings`)
- **Profile card** → `/employee-profile`. **Preferences:** Notification toggle (via `PATCH /profile/preferences`). **Legal & Info:** Privacy Policy (external URL), Terms of Service (external URL), App Version (read-only). **Account:** Delete Account → **DeleteAccountSheet**.
- **Delete flow:** sheet warns "permanent…", → confirm dialog "Delete account?" → `DELETE /profile` → toast "Your account has been deleted" → restart at login. Web intent: settings page; deletion = double-confirm modal.

### 7.22 Profile — `employee-profile` (`/employee-profile`)
- **Header card:** avatar (tap → **ProfilePhotoSheet**: Take Photo / Choose from Gallery / Remove), name, email, employee code.
- **Compensation:** net salary + eye toggle (local visibility) + "View Details" → `/employee-salary-details`.
- **Personal Info:** Phone (edit via **ProfileEditSheet.showPhone**), Emergency contact name+phone (edit via **ProfileEditSheet.showEmergencyContact**). Other fields read-only.
- **Employment:** designation, department, join date, reports-to (read-only). **Loans** (read-only list). **Perks** (read-only list).
- **APIs:** `GET /profile`; `PATCH /profile` `{ phone?, emergency_contact? }`; `POST /profile/avatar` (multipart, optimistic preview); `DELETE /profile/avatar`. Pull-to-refresh.
- **Editable:** avatar, phone, emergency contact ONLY. Everything else read-only (HR/Admin manage it).
- **Web intent:** profile page; inline-editable phone/emergency (pencil → modal); avatar uploader; read-only employment/loans/perks.

### 7.23 Policies — `policies` (`/employee-policies`) & Policy Viewer — `policy-viewer` (`/policies/view`)
- Banner "Company has X documents"; list of policy cards (title, description, date). **Employee = read-only** (no FAB/edit). Card tap → **PolicyViewerScreen** (in-app PDF via document URL). `GET /policies`. Viewer states: loading/loaded/error+retry. Web intent: policy library + PDF.js viewer.

### 7.24 Notifications — `employee-notifications` (`/employee-notifications`)
- **App bar:** "Notifications" + "Mark all as read". **Filter chips (NotificationFilter):** All · Unread · Read (client-side). Card tap → mark read (`PATCH /notifications/{id}/read`) + deep-link to related resource. 
- **APIs:** `GET /notifications?filter=all&page=1&limit=30`; `GET /notifications/unread-count`; `PATCH /notifications/read-all`. Pull-to-refresh. Web intent: notification center with tabs + bulk mark-read.

---

## 8. Cross-feature flows — EMPLOYEE
1. **EOD**: dashboard reminder / quick action → submit (draft or submit) → appears in EOD list (status) → (if manager's report) manager reads it.
2. **Leave**: apply → pending → manager/HR approves/rejects → status + notification + recent-activity + balance update.
3. **Claim (insurance/expense)**: submit + attachment upload → pending → manager/admin decides → status + notification.
4. **HR Help**: raise (optionally anonymous) → thread with HR → HR resolves/closes → reply disabled.
5. **Payroll (read)**: HR/Admin release payslip → employee notified → view/download in Salary Details.

## 9. Employee API Index (quick reference)
`GET /dashboard` · `GET /leaves/quota` · `GET /leaves/types` · `POST /leaves/apply` · `GET /leaves/history` · `GET /leaves/team` · `GET /leaves/team/{id}` · `PATCH /leaves/{id}/decision` · `GET /eods` · `POST /eods` · `POST /eods/submit` · `GET /eods/{id}` · `DELETE /eods/{id}` · `GET /eods/team` · `GET /eods/team/is-manager` · `GET /eods/team/{id}` · `PATCH /eods/{id}/read` · `GET /attendance/logs` · `GET /insurance-claims` · `POST /insurance-claims` · `GET /expense-claims` · `POST /expense-claims` · `GET /tickets` · `GET /tickets/{id}` · `POST /tickets` · `POST /tickets/{id}/replies` · `GET /salary/breakdown` · `GET /salary/revisions` · `GET /salary/slips` · `GET /salary/slips/{id}/download` · `GET /policies` · `GET /notifications` · `GET /notifications/unread-count` · `PATCH /notifications/{id}/read` · `PATCH /notifications/read-all` · `GET /activity` · `GET /profile` · `PATCH /profile` · `POST /profile/avatar` · `DELETE /profile/avatar` · `DELETE /profile` · `GET /profile/preferences` · `PATCH /profile/preferences` · `POST /uploads` · `GET /enums`.

## 10. Route index (quick reference)
See §6. Editable-vs-readonly summary: Employee edits only **EOD (own, if can_edit)**, **leave applications (create)**, **claims (create)**, **HR tickets (create + reply)**, **profile phone/emergency/avatar**, **notification preference**. Approvals (leave) available **only if manager**. Everything else is read-only.

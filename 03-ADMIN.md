# CodeableHR — ADMIN Dashboard Spec (Gospel for Web Build)

> Fully self-contained. Everything needed to rebuild the Admin experience as a Next.js web dashboard. Shared sections (§2–§5) are identical across specs; role sections (§1, §6–§10) are Admin-specific. Admin is the superset role: all self-service + all HR management + finance/equity/loans/devices/project-income/promotions/holidays.

---

## 0. How to read this doc
- **Wire value** = exact enum string sent/received; always use it in requests. **Label** = display text.
- API paths are endpoint constants relative to `{BASE_URL}/{API_VERSION}` (see §3).
- "Editable vs read-only", "dialog vs sheet vs page" drive web layout (modal vs inline vs route).
- **Mobile → Web**: bottom-sheets/full-screen pushes → right-side drawers / modals / routes (noted per screen).
- **Money is critical here** — finance/equity flows use PKR + USD, previews before commit, and confirm-gated destructive actions. Preserve those gates exactly.

---

## 1. Role Overview — ADMIN
**Landing:** `/admin-home`. **Nav:** left drawer, 17 destinations + Settings + Logout.
**ADMIN CAN do:** everything HR can (people, departments, projects, payroll, claims queues, HR-help triage, announcements, policies, own self-service) **PLUS**:
- **Promotions** dedicated flow (select employee → promote/increment with salary revision).
- **Expenses** — company expense ledger (create/edit, one-time/fixed/variable recurring, templates, analytics, report, pending-amount entries).
- **Devices** — biometric device registry, PIN→employee mappings, unmapped punches.
- **Loans** — employee loan ledger, create loan, record payments, edit/delete.
- **Treasury / Finance** — treasury overview + opening balance, finance report, manual adjustments, period close/reopen, audit log.
- **Equity** — cap table, beneficiaries, profit distributions (preview→execute→settle/void), commitments, pool funds.
- **Project Income** — income ledger (record/reverse/delete).
- **Holidays** — create company holidays (calendar).
- **Attendance/EOD/Leaves** management org-wide.
**Note:** Admins do NOT record their own attendance (no check-in pill on dashboard).

---

## 2. Auth & Session (shared core)
Public routes `/`, `/login`, `/forgot-password`, `/otp`, `/new-password`; unauthed non-public → `/login`. Role landing: admin→`/admin-home`, hr→`/hr-home`, employee|null→`/employee-home`.
**Auth endpoints (no bearer):** `POST /auth/login {email,password}` · `/auth/google {id_token}` · `/auth/refresh-token {refresh_token}` (rotates) · `/auth/logout` · `/auth/forgot-password {email}` · `/auth/verify-otp {email,otp}→{reset_grant}` · `/auth/reset-password {reset_grant,new_password}` · `/auth/password/change {current_password,new_password}`. login/google → `{ user, tokens:{token,refresh_token} }`.
**Tokens:** bearer on every non-auth request; 401 → single-flight refresh → retry once; refresh failure → force logout. **Password policy:** min 8, uppercase, number, special.

---

## 3. Global Conventions (shared core)
### 3.1 Environments
dev/staging/prod; each `.env` has `BASE_URL`, `API_VERSION`, `GOOGLE_SERVER_CLIENT_ID`; requests → `{BASE_URL}/{API_VERSION}/...`.
### 3.2 HTTP
Dio; JSON; 60s timeouts; GET/POST/PUT/PATCH/DELETE + multipart uploads.
### 3.3 Response envelope
Success `{ statusCode, data, error:null }`; error `{ statusCode, data:null, error:{ code, message, timestamp, details[] } }`. Fallbacks 400/401/403/404/429/500.
### 3.4 Pagination
`PaginationModel { currentPage, totalPages, totalItems }`; requests `page`+`limit`; list responses `{ items, pagination, counts }` (counts = whole-set filter badges). `PagedResult<T>{items,pagination}`.
### 3.5 Money
Comma-group input; PKR default, **USD** allowed in finance/equity/income; display `5,600.50`; compact `100k/5.6M/3T`.
### 3.6 Dates
Wire date `YYYY-MM-DD`, month key `YYYY-MM`, ISO datetime; ordinal display + `time_ago`.
### 3.7 Standard UI states
Loading skeleton / load-more spinner / empty (per-screen message) / error+retry (or toast over cache) / pull-to-refresh / success toast — every list & detail. Destructive actions (delete/void/settle/reverse/reopen) go through **CodeableConfirmationSheet**.
### 3.8 Endpoint reference (org-wide, complete)
All HR endpoints (see §9) **plus** Admin-only:
- Expenses: `GET /admin/expenses`, `GET /admin/expenses/options`, `GET /admin/expenses/pending-entries`, `GET /admin/expenses/analytics`, `GET /admin/expenses/report`, `GET /admin/expenses/{id}`, `POST /admin/expenses`, `PATCH /admin/expenses/{id}`; templates `GET /admin/expense-templates[/{id}]`, `POST`, `PATCH`, `DELETE`.
- Devices: `GET /admin/devices[/{id}]`, `POST /admin/devices`, `PATCH /admin/devices/{id}`, `GET /admin/devices/{id}/mappings`, `POST /admin/devices/{id}/mappings`, `DELETE /admin/devices/{id}/mappings/{mid}`, `GET /admin/devices/punches/unmapped`.
- Loans: `GET /admin/loans[/{id}]`, `POST /admin/loans`, `PATCH /admin/loans/{id}`, `DELETE /admin/loans/{id}`, `GET /admin/loans/{id}/payments`, `POST /admin/loans/{id}/payments`.
- Treasury/Finance: `GET /admin/treasury`, `GET /admin/treasury/opening`, `PUT /admin/treasury/opening`, `GET /admin/treasury/analytics`, `GET /admin/finance/report`, `GET /admin/finance/audit`, `GET /admin/finance/periods[/{month}]`, `POST /admin/finance/periods`, `DELETE /admin/finance/periods/{month}`, `GET /admin/finance/adjustments[/{id}]`, `POST /admin/finance/adjustments`, `DELETE /admin/finance/adjustments/{id}`.
- Equity: `GET /admin/equity/allocation`, `GET /admin/equity/funds`, `GET /admin/equity/beneficiaries[/{id}]`, `POST`, `PATCH`, `DELETE`; `GET /admin/equity/distributions[/{id}]`, `POST /admin/equity/distributions/preview`, `POST /admin/equity/distributions`, `POST /admin/equity/distributions/{id}/void`, `POST /admin/equity/distributions/{id}/settle`, `DELETE`; `GET /admin/equity/commitments[/{id}]`, `POST`, `PATCH`, `DELETE`.
- Project income: `GET /admin/project-income[/{id}]`, `GET /admin/project-income/summary`, `POST /admin/project-income`, `PATCH /admin/project-income/{id}`, `POST /admin/project-income/{id}/reverse`, `DELETE /admin/project-income/{id}`.
- Holidays: `GET /holidays[/{id}]`, `POST /holidays`.

---

## 4. Full Enum Catalog (shared core — reproduce verbatim)
### Status / lifecycle
**LeaveStatus** approved`approved`(green)/pending`pending`(orange,default)/rejected`rejected`(red) · **ClaimStatus** approved/pending/rejected · **ExpenseStatus** approved/pending/rejected · **ExpenseEntryStatus** recorded`recorded`/pendingAmount`pending_amount`/paid`paid` · **EodReportStatus** submitted/pending/draft(default) · **AttendanceStatus** present/absent/late/halfDay`half_day`/onLeave`on_leave`/holiday · **CheckInStatus** notCheckedIn`not_checked_in`/checkedIn`checked_in`/checkedOut`checked_out` · **IssueStatus** open/inProgress`in_progress`/resolved/closed · **IssuePriority** high/medium(default)/low · **SalarySlipStatus** generated`generated`("Sent")/pending`pending`("Not sent",default) · **LoanStatus** active/completed/cancelled · **EmployeeStatus** active/inactive · **DeviceStatus** active(isActive true)/inactive · **DistributionStatus** draft`draft`/confirmed`confirmed`/voided`voided` · **MilestoneStatus** pending/inProgress`in_progress`/completed · **TaskStatus** todo/inProgress`in_progress`/done · **ProjectStatus** planning/active/onHold`on_hold`/completed/archived · **PerkStatus** active/upcoming/expired.
### Type / category
**LeaveType** annual/casual(default)/sick/maternity/paternity/compassionate/marriage/hajjUmrah`hajj_umrah`/iddat · **LeaveDuration** halfDay`half_day`/fullDay`full_day`(default)/multipleDays`multiple_days` · **HalfDayPeriod** am/pm · **ClaimReason** consultation/medication/labTests`labTests`/hospitalization/dental/optical/other · **ExpenseCategory** travel/meals/office/software/training/equipment/other · **ExpenseCurrency** pkr`PKR`/usd`USD` · **AdminExpenseType** Office Supplies/Travel/Meals & Entertainment/Software & Subscriptions/Hardware & Equipment/Utilities/Rent/Marketing/Training & Development/Maintenance & Repairs/Miscellaneous · **ExpenseAmountType** oneTime`one_time`/fixed`fixed`/variable`variable` · **IssueCategory** payroll/leave/benefits/workplace/harassment/whistleblower/grievance/general(default; sensitive=harassment/whistleblower/grievance) · **HolidayType** religious/national/company · **EmploymentType** fullTime`full_time`/partTime`part_time`/contract/intern/freelancer · **PerkType** medicalInsurance`medical_insurance`/providentFund`provident_fund`/fuelAllowance`fuel_allowance`/mealAllowance`meal_allowance`/phoneAllowance`phone_allowance`/other · **SalaryRevisionType** initial(default)/increment/promotion · **AdjustmentDirection** inflow`in`/outflow`out` · **AdjustmentType** tax`tax`/providentFund`provident_fund`/capital`capital`/other`other` · **BeneficiaryKind** person`person`/esop`esop`/charity`charity`/other`other` · **AnnouncementTarget** all/department/role · **AnnouncementRole** admin/hr/manager/employee · **ProjectPriority** low/medium(default)/high/critical · **ProjectMemberRole** lead/manager/developer/designer/qa/devops/analyst/member(default) · **ProjectDocumentType** file/note/link · **NotificationCategory** leave/eod/payslip/policy/claim/expense/ticket/general(default) · **UserRole** employee/hr/admin · **MessageSender** user/hr/system · **Language** english`en`/arabic`ar`.
### Filter enums
**LeaveFilter** all/pending/approved/rejected · **ClaimFilter** all/approved/pending/rejected · **ExpenseFilter** all/approved/pending/rejected · **ExpenseFrequencyFilter** all(null)/oneTime`one_time`/recurring`recurring` · **IssueFilter** all/open/inProgress/resolved/closed · **EodReportFilter** all/submitted/pending/draft · **AttendanceLogFilter** all/present/absent/late/halfDay/onLeave/holiday · **NotificationFilter** all/unread/read · **ActivityFilter** all/leaves/eod/other · **HolidayTimeFilter** upcoming/past.
### Server-driven (`GET /enums`)
`roles, employment_type, payment_method, gender, expense_type, expense_currencies, claim_reason, expense_category, language, perk_keys, ticket_category`.

---

## 5. Shared Domain Models (shared core)
UserModel, DashboardModel (role-aware; admin gets `org_stats{totalEmployees,activeEmployees,onLeaveToday,birthdays}`, `department_distribution[]{departmentName,employeeCount}`, `pending_leaves[]{employee_code,name,leave_type,days,appliedDate}`), Leave/EOD/Attendance/Employee/Department/Projects/Payroll/Salary/Claims/Tickets/Notification/Activity/Policy/Holiday/Profile models — identical to the HR spec §5.
**Admin-only models:**
- **AdminExpensesModel** — id, name, type, amount, item, date, payment_method, vendor, description, is_recurring, amount_type (ExpenseAmountType), status (ExpenseEntryStatus), reimburse_to_employee_code, attachment, currency.
- **ExpenseTemplateModel** — id, name, default_amount, cadence (fixed/variable), is_active, start_month, end_month.
- **DeviceModel** — id, name, serial_number, location, model, comm_key, is_active, last_sync, mappings_count. **DeviceMappingModel** — id, pin, user_id, employee name, created_at. **UnmappedPunchModel** — pin, device, timestamp.
- **LoanModel** — id, employee, principal, balance_remaining, amount_repaid, monthly_deduction (null/0=dynamic), status (LoanStatus), start_month, note, `repayments[] LoanRepaymentModel{date,type(auto|manual),amount,month,note}`.
- **TreasuryOverviewModel** — currency, opening_balance, opening_date, total_income, total_expenses, net_profit_to_date, total_disbursed, reserve_built, total_payroll, loans_disbursed, loan_repayments, net_loan_outflow, loans_outstanding, adjustments_net, current_balance, note, updated_at. **TreasuryAnalyticsModel** — monthly[] cash-flow points + totals.
- **FinanceReportModel** — currency, plIncome, plExpenses, plNetProfit, plPayroll, plEquityDistributed, plRetained, loanDisbursed, loanRepaid, adjustmentsNet, netChange, currentBalance, loansOutstanding, generatedAt.
- **TreasuryAdjustmentModel** — id, type (AdjustmentType), direction (AdjustmentDirection), amount, currency, date, description. **FinancePeriodModel** — month, note, closed_at. **FinanceAuditEntryModel** — action, entity_type, entity_id, actor, timestamp, changes.
- **EquityAllocationModel** — beneficiaries[] (name, kind, share%, payout rate%, effective paid%) + summary. **BeneficiaryModel** — id, name, kind (BeneficiaryKind), user_id (if person), share_percent, payout_rate, is_active, sort_order, note. **EquityDistributionModel** — id, period_label, month, status (DistributionStatus), settlement_status, currency, revenue, expenses_total, payroll, net_profit, total_distributed, retained, allocations[]{beneficiary, share%, payout%, amount_due}, audit fields. **EquityCommitmentModel** — id, beneficiary_id, name, amount, currency, is_active, start_month, end_month, note, paid_by_id. **EquityFundModel** — beneficiary name, balance, currency, last_update.
- **ProjectIncomeModel** — id, name, amount, project_id, source, currency, date, description, attachment, is_reversed, reversed_at. **ProjectIncomeSummaryModel** — totals (PKR + original currency, count).

---

## 6. Navigation Model — ADMIN
**Landing:** `/admin-home` (app bar "Admin Dashboard").
**Drawer destinations (17):** 1 Dashboard `/admin-home` · 2 Attendance Logs `/admin-attendance-logs` · 3 People `/admin-all-employees` · 4 Leave Management `/admin-leave-requests` · 5 HR Issues `/admin-hr-help` · 6 Departments `/admin-departments` · 7 Promotions `/admin-promotions` · 8 Insurance Claims `/admin-insurance-claims` · 9 Expenses `/admin-expenses` · 10 Devices `/admin-devices` · 11 Projects `/admin-projects` · 12 Policies `/admin-policies` · 13 Treasury `/admin-treasury` (nested finance) · 14 Project Income `/admin-project-income` · 15 Loans `/admin-loans` · 16 Equity `/admin-equity` (nested equity) · 17 Post Announcement `/admin-announcement`.
**Footer:** Settings `/admin-settings`; Logout. **Header:** → `/admin-profile`.
**Nested (pushed on root nav, shell stays on parent):** Treasury → `report`, `adjustments`, `periods`, `audit`. Equity → `beneficiaries`, `distributions`, `commitments`, `funds`.
**Secondary routes:** `/admin-profile`, `/admin-notifications`, `/admin-salary-details`, `/admin-eod-reports`, `/admin-eod-reports/submit`, `/admin-leaves`, `/admin-apply-for-leave`, `/admin-leaves-history`, `/admin-hr-help/new`, `/admin-hr-help/issue`, `/admin-attendance-logs/employee`, `/admin-employee-info`, `/admin-employee-info/add`, `/admin-departments/detail`, `/admin-add-expense`, `/admin-expense-templates`, `/admin-expense-analytics`, `/admin-expense-report`, `/admin-promotions/promote`, `/admin-insurance-claims/submit`, `/admin-payroll`, `/payroll/slip`, `/all-holidays`, `/all-holidays/create`, `/policies/view`.
**Notification deep-links (Admin):** leave→`/admin-leave-requests`, eod→`/admin-eod-reports`, claim→`/admin-insurance-claims`, expense→`/admin-expenses`, ticket→`/admin-hr-help`, payslip→`/admin-salary-details`(own) or `/admin-payroll`(month), policy→`/policies`, holiday→`/all-holidays`, profile/security→no-op.

---

## 7. Screens — ADMIN

### 7.1 Dashboard — `admin-home` (`/admin-home`)
App bar "Admin Dashboard" + bell. Sections: greeting (no attendance pill); **Quick actions** (Employees→`/admin-all-employees`, Departments→`/admin-departments`, Attendance→`/admin-attendance-logs`, Leave Requests→`/admin-leave-requests`); **Payroll banner** → `/admin-payroll`; **Admin stats grid** (org headcount, active, on leave today, pending leaves); **Pending leaves** ("View All" → `/admin-leave-requests`); **Department overview** (distribution chart; "View All" → `/admin-departments`); On Leave Today; Upcoming Holidays; Birthdays; Recent Activity. `GET /dashboard`. Web: exec dashboard — KPI cards + charts + pending-approvals panel.

### 7.2 Attendance Logs — `admin-attendance-logs` (`/admin-attendance-logs`)
Department filter chips (All + departments) + search icon → **AdminEmployeeSearchSheet** (server search, debounced, paginated). Employee tiles (status counts). Tap → `/admin-attendance-logs/employee`. `GET /attendance/employees?department=`; search `?name=&page=`. Skeleton(6)/empty/pull-to-refresh.

### 7.3 Employee Attendance Detail — `admin-employee-attendance` (`/admin-attendance-logs/employee`)
Pinned header; month/year selector; summary card (present/absent/late/on-leave/avg hours); pinned AttendanceLogFilter chips (+Holiday, counts); daily logs. `GET /attendance/employees/{code}/logs?month&year`. Pull-to-refresh.

### 7.4 All Employees — `admin-all-employees` (`/admin-all-employees`)
Search (name/code/position, debounced client-side) + department chips + count + tiles. Tap → `/admin-employee-info`. `GET /employees?limit=100`. Skeleton(8)/empty/pull-to-refresh.

### 7.5 Employee Info — `admin-employee-info` (`/admin-employee-info`)
Full record. Header (avatar/name/position/department/status) + action buttons **Promote / Increment / Set Salary / Edit / Deactivate**. Sections: Personal Info (editable: name, email, phone, CNIC 3-part, gender, father name, personal email), Bank Details (bank name, account number, payment method), Emergency Contact, Employment (department/designation/manager/type/join/DOB/role), Salary/Promotion (breakdown + history), Perks (toggle active), Payslips (download), Documents (CNIC images, contract — upload).
- **Interactions:** Promote → **AdminPromotionSheet** (new salary, effective date, optional new designation) → `POST /employees/{id}/promote {new_salary,designation_id?,effective_date}`. Increment → **AdminSalaryIncrementSheet** → `POST /employees/{id}/increment {new_salary,effective_date}`. Set Salary → salary setup sheet. Edit → edit mode → `PATCH /employees/{id}`. Deactivate → **AdminDeactivateSheet** (reason, effective date) → `POST /employees/{id}/deactivate {reason,effective_date}`. Perk toggle → `PATCH /employees/{code}/perks/{perkId}`.
- **APIs:** `GET /employees/{id}`, `GET /salary/employee/{userId}`, `GET /employees/designations`, `GET /employees/departments`, `POST /uploads`. Web: detail page + edit mode + compensation modals + document manager + salary history.

### 7.6 Add Employee — `admin-add-employee` (`/admin-employee-info/add`)
Full onboarding form (identical fields to HR Add Employee §7.13): Personal (Full Name, Email, Phone Countrify PK, CNIC 3-part, Birthday); Emergency Contact (name, phone); Salary (Basic req + House Rent/Medical/Transport/Utility/Tax/Provident Fund/Insurance opt); Employment (Department, Designation, Manager opt, Employment Type, Role opt [Admin/HR/Manager/Employee], DOB opt, Date of Joining req); Documents (CNIC front/back image, contract PDF); Perks (toggles + amount/percentage). `POST /employees` (full body incl salary components, perks[], document URLs) + `POST /uploads` (cnic/contracts). Toast "Employee added (CODE)".

### 7.7 Leave Requests — `admin-leave-requests` (`/admin-leave-requests`)
Info banner + LeaveFilter tabs (counts) + results count + list. Approve/Reject: Approve → `PATCH /leaves/{id}/decision {decision:"approve"}`; Reject → reason dialog → `PATCH /leaves/{id}/decision {decision:"reject", rejection_reason}`. (Wire body key is **`decision`** with value `"approve"|"reject"`, NOT `approve:bool`.) Invalidates cached tabs. `GET /leaves/requests?page&limit=20&status`. Web: approval queue + decision modal.

### 7.8 Leaves / Apply / History — `admin-leaves`, `admin-apply-for-leave`, `admin-leave-history`
Admin's personal leave (same as HR/Employee). Leaves: balance + LeaveFilter list + FAB Apply + action → `/admin-leave-requests`. `GET /leaves/quota`, `GET /leaves/history`. Apply: `GET /leaves/types` → `POST /leaves/apply {leave_type_id,date_from,date_to,reason,duration,half_day?}`. History: LeaveFilter tabs + pagination + FAB.

### 7.9 Promotions — `admin-employees-for-promotions` (`/admin-promotions`) + `admin-promotions` (`/admin-promotions/promote`)
- **List:** search + department chips + employee tiles (avatar/name/position/current salary). Tap → promote screen. `GET /employees`.
- **Promote screen:** selected employee card; New position dropdown (opt, `GET /employees/designations`); **Increment type toggle (Amount / Percentage)**; increment value (req, >0); computed new salary (live, read-only); salary breakdown preview; effective date (req). Promote → **PromotionConfirmationSheet** (summary) → `POST /employees/{id}/promote {new_salary, designation_id?, effective_date}` → **PromotionSuccessView**. Web: promotion workflow with live salary calc + confirmation + success state.

### 7.10 Departments — `admin-departments` (`/admin-departments`) + detail `/admin-departments/detail`
- List: cards (name, cover image, member count, manager, description) + FAB "New Department" → **AdminCreateDepartmentSheet** (name, description, cover image → `POST /departments {name,description,cover_image?}`). Card delete → **AdminDeleteDepartmentSheet** → `DELETE /departments/{id}`. `GET /departments`.
- Detail: header + details + Edit (**AdminEditDepartmentSheet** → `PATCH /departments/{id}`) + Delete + Change Manager (sheet → `PATCH /departments/{id}/manager {manager_id}`) + Members (Add → `POST /departments/{id}/members {employee_code}`; Remove → `DELETE /departments/{id}/members/{code}`). `GET /departments/{id}`, `GET /departments/{id}/available-employees`.

### 7.11 EOD Reports / Submit — `admin-eod-reports`, `admin-submit-eod-report`
EodReportFilter tabs (All/Draft/Submitted/Approved, counts), list + edit/delete + FAB. `GET /eods?page&status`, `DELETE /eods/{id}`. Submit form: date, project (`/projects/options`), summary (req, char counter), optional blockers/tomorrow_plan → `POST /eods/submit {date,project_id,summary,blockers?,tomorrow_plan?,status}`.

### 7.12 Expenses (company ledger) — `admin-expenses` (`/admin-expenses`)
- App bar: Analytics icon → `/admin-expense-analytics`; Recurring icon → `/admin-expense-templates`.
- Search (debounced 350ms, server-side) + **filter button** → **ExpenseFilterSheet** (Month single picker `YYYY-MM`; Frequency multi-select ExpenseFrequencyFilter; Categories multi-select). Active filters render as removable chips. Pending variable-amount banner → **ExpensePendingSheet** (enter amounts for variable recurring).
- List (paginated, pull-to-refresh). Card tap → edit (`/admin-add-expense` w/ model). Delete → confirm sheet.
- **APIs:** `GET /admin/expenses?page&limit=20&month&frequency&category&search`; `GET /admin/expenses/pending-entries`. Web: ledger table + multi-dimensional filters + pending banner.

### 7.13 Add/Edit Expense — `admin-add-expense` (`/admin-add-expense`)
**5-step wizard** (Amount → Category → Details → More details → Review). **Inputs:**
| Field | Widget | Options | Validation | Req | Default |
|---|---|---|---|---|---|
| Amount | numeric keypad + big display | max 12 digits, 2 dec | > 0 | Yes | '' |
| Currency | toggle chips | PKR/USD | — | No | PKR |
| Category | dropdown | API types (fallback AdminExpenseType) | — | Yes | none |
| **Frequency/amount type** | card selector | One-time → `is_recurring:false, amount_type:one_time`; Recurring → Fixed `amount_type:fixed` (default) / Variable `amount_type:variable` | — | Yes | Fixed if recurring |
| Expense name | text | — | non-empty | Yes | '' |
| Date | date picker | — | — | No | today on submit |
| Reimburse to | employee dropdown | codes | — | No | none |
| Item | text | — | non-empty | Yes | '' |
| Vendor | text | — | — | No | '' |
| Description | textarea (1000) | — | — | No | '' |
| Payment method | dropdown | API (fallback Cash/Credit/Debit/Bank Transfer/Company Card/Online) | — | No | none |
| Invoice attachment | image/PDF | — | — | No | none |
- **Amount-type branching:** step Details shows One-time vs Recurring; Recurring reveals Fixed ("same amount every month") vs Variable ("changes monthly — you enter it each time").
- **Submit:** `POST /admin/expenses` (create) / `PATCH /admin/expenses/{id}` (edit) body `{name,type,amount,item,date?,payment_method?,vendor?,description?,is_recurring,amount_type?(if recurring),reimburse_to_employee_code?,attachment?}`. Upload first via `POST /uploads` (folder company-expenses). Web: stepper form; keypad → numeric input; branching frequency; invoice dropzone.

### 7.14 Expense Templates — `admin-expense-templates` (`/admin-expense-templates`)
List of recurring templates (name, amount, cadence, active toggle, delete). Toggle → `PATCH /admin/expense-templates/{id} {is_active}`. Delete → confirm ("Stop … recurring? Past entries kept") → `DELETE /admin/expense-templates/{id}?keep_occurrences=true`. `GET /admin/expense-templates`. Empty "No recurring expenses".

### 7.15 Expense Analytics — `admin-expense-analytics` (`/admin-expense-analytics`) & Report — `admin-expense-report` (`/admin-expense-report`)
Analytics: `GET /admin/expenses/analytics` (category/trend breakdowns). Report: `GET /admin/expenses/report` (date-range financial report). Web: charts dashboard + exportable report.

### 7.16 Devices — `admin-devices` (`/admin-devices`)
Unmapped-punches banner (if >0 → detail). Registered Devices list (name, status toggle, last sync, mappings count). FAB → **RegisterDeviceSheet** (serial#, name, location, model, comm_key → `POST /admin/devices`). Card tap → device detail. `GET /admin/devices?limit=100`; `GET /admin/devices/punches/unmapped`. Pull-to-refresh.
- **Device Detail — `/admin/devices/{id}`:** info card + status toggle (`PATCH /admin/devices/{id} {is_active}`) + Edit (**EditDeviceSheet**: name/location/comm_key). **PIN Mappings** list; Add → **AddMappingSheet** (PIN, employee dropdown → `POST /admin/devices/{id}/mappings {pin,user_id}`); delete mapping → confirm → `DELETE …/{mid}`. `GET /admin/devices/{id}/mappings`, `GET /employees?limit=100` (picker).
- **Unmapped Punches — `/admin/devices/punches/unmapped`:** list (PIN, device, timestamp) + "Map PIN" → AddMappingSheet (pre-filled PIN) → auto-refresh. `GET /admin/devices/punches/unmapped`.
- Web: device fleet dashboard + mapping manager + unmapped triage queue.

### 7.17 Insurance Claims — `admin-insurance-claims` (`/admin-insurance-claims`) + Add `/admin-insurance-claims/submit`
ClaimFilter tabs (per-tab cache, counts). Card → detail with Approve/Reject (Reject → reason). `GET /insurance-claims/requests?page&limit&status`; `PATCH /insurance-claims/{id}/decision {decision:"approve"|"reject", rejection_reason?}` (wire key `decision`, same for expense claims). FAB → **AdminAddInsuranceClaim** (submit on behalf): Reason (ClaimReason), Date (1yr→today), Amount(PKR,>0), Note(500,req), Attachment → `POST /insurance-claims {reason,amount,note,expense_date,attachment?}`.

### 7.18 HR Help (triage) — `admin-hr-help` (`/admin-hr-help`) + Raise `/admin-hr-help/new` + Detail `/admin-hr-help/issue`
IssueFilter tabs (All/Open/In Progress/Resolved/Closed, per-tab cache). Card → detail. `GET /tickets/requests?page&limit&status` (admin/HR triage uses **`/tickets/requests`**; only the raiser's own list uses `/tickets`).
- Raise (admin): confidentiality notice; Category (IssueCategory), Subject, Description(1000), Anonymous (auto-on for sensitive). `POST /tickets {title,description,category,is_anonymous,priority?}` → pushReplacement to detail.
- Detail: header (title/status/priority/category/created/assigned); thread (employee+admin bubbles, system, retry on failed); reply input or closed notice; **Resolve** → **HrResolveIssueDialog** → `PATCH /tickets/{id}/status {status}` (dedicated status endpoint; body is `{status}`). `GET /tickets/{id}`; `POST /tickets/{id}/replies {message}` (body key **`message`**).

### 7.19 Loans — `admin-loans` (`/admin-loans`)
LoanStatus filter chips (All/Active/Completed/Closed, per-tab cache). Cards (employee, principal, balance, monthly deduction or "Dynamic", est. installments). FAB → **Create Loan**. Card → detail. `GET /admin/loans?page&limit&status`. Skeleton/empty/pull-to-refresh.
- **Create Loan — `/admin/loans/new`:** Borrower (searchable dropdown, req, `GET /employees?limit=100`), Principal (req >0), Monthly deduction (opt — **empty = dynamic loan**, filled = fixed auto-deduction), Start month (opt → this month), Label (opt), Note (opt). `POST /admin/loans {principal,user_id,name?,monthly_deduction?,start_month?,note?}`.
- **Loan Detail — `/admin/loans/{id}`:** summary (principal, balance, repaid, monthly deduction, est. installments) + metadata + **Repayment ledger** (date/type auto|manual/amount/note). FAB "Record Payment" (if active) → **RecordPaymentSheet** → `POST /admin/loans/{id}/payments {amount,type:"manual",month?,date?,note?}`. Edit → `PATCH /admin/loans/{id} {name?,principal?,monthly_deduction?,status?,note?}`. Delete → confirm "Delete loan and its entire repayment ledger?" → `DELETE /admin/loans/{id}`. `GET /admin/loans/{id}`.
- Web: loan portfolio + origination form (dynamic vs fixed) + payment ledger + record-payment modal.

### 7.20 Treasury — `admin-treasury` (`/admin-treasury`)
App bar edit (pencil) → **SetOpeningBalanceSheet** (Amount req, Currency PKR/USD, As-of date, Note → `PUT /admin/treasury/opening {opening_balance,opening_date?,currency?,note?}`). Balance card + breakdown (income, expenses, net profit, disbursed, payroll, loans outstanding, adjustments) + cash-flow chart (if analytics) + **Finance tools buttons** → Report/Adjustments/Periods/Audit + Equity nav. `GET /admin/treasury`, `GET /admin/treasury/analytics?from&to`. Skeleton/error+retry/pull-to-refresh. Web: cash-position dashboard + drill-down tools.

### 7.21 Finance Report — `admin-finance-report` (`/admin-treasury/report`)
Date-range bar (from/to). P&L group (income, expenses, net profit, payroll, equity distributed, retained), Cash flow group (loans disbursed/repaid, adjustments net, net change), Treasury snapshot (current balance, loans outstanding), generated timestamp. `GET /admin/finance/report?from&to`. Web: financial summary report with date filter + export.

### 7.22 Finance Adjustments — `admin-finance-adjustments` (`/admin-treasury/adjustments`)
**AdjustmentDirectionFilterBar** (All/Inflow`in`/Outflow`out`). List (paginated). FAB "New Adjustment" → **CreateAdjustmentSheet**: Type (AdjustmentType: tax/provident_fund/capital/other, default other), Direction (inflow/outflow, default outflow), Amount (>0, always positive), Currency (PKR/USD), Date (opt→today), Description → `POST /admin/finance/adjustments {type,direction,amount,currency?,date?,description?}`. Card tap → confirm delete → `DELETE /admin/finance/adjustments/{id}`. `GET /admin/finance/adjustments?page&limit&type&direction&month&from&to`. Web: manual-movements ledger + create modal.

### 7.23 Finance Periods — `admin-finance-periods` (`/admin-treasury/periods`)
Closed periods list (paginated). FAB "Close Month" → **ClosePeriodSheet** (month `YYYY-MM` + note → `POST /admin/finance/periods {month,note?}`). Card tap → confirm reopen → `DELETE /admin/finance/periods/{month}`. `GET /admin/finance/periods?page&limit`. Web: period lock/unlock lifecycle.

### 7.24 Finance Audit — `admin-finance-audit` (`/admin-treasury/audit`)
Immutable audit trail (action, entity, actor, timestamp). Paginated, pull-to-refresh. `GET /admin/finance/audit?page&limit&entityType&action&actorId&entityId`. Web: compliance log with filters.

### 7.25 Equity Allocation (Cap Table) — `admin-equity` (`/admin-equity`)
App bar "Equity". Allocation summary card + cap-table rows (beneficiary name, kind, share%, payout rate%, effective paid%) + **manage buttons** → Beneficiaries/Distributions/Commitments/Funds. `GET /admin/equity/allocation`. Pull-to-refresh. Web: cap-table overview + nav hub.

### 7.26 Beneficiaries — `admin-equity-beneficiaries` (`/admin-equity/beneficiaries`) + Form
List (name, kind, share%, payout%). FAB "Add Beneficiary" → **BeneficiaryFormScreen**. Card → edit. `GET /admin/equity/beneficiaries?page&limit&is_active`.
- **Form:** Name (req), Kind (BeneficiaryKind: person/esop/charity/other, req), User (**BeneficiaryUserPicker**, if kind=person), Share % (0–100, req), Payout rate % (0–100, req, default 100), Is Active (toggle, default true), Note. Create `POST /admin/equity/beneficiaries {name,kind,share_percent,payout_rate,user_id?,is_active?,sort_order?,note?}`; edit `PATCH /admin/equity/beneficiaries/{id}` (sparse); delete (edit mode, app bar) → confirm → `DELETE`. Web: beneficiary roster + kind-aware form.

### 7.27 Distributions — `admin-equity-distributions` (`/admin-equity/distributions`) + Create + Detail
- List: DistributionStatus filter (All/Draft/Confirmed/Voided). Cards (period, month, status, amounts). FAB "New Run" → Create. Card → Detail. `GET /admin/equity/distributions?page&limit&status&month&from&to`.
- **Create (Preview→Execute):** Inputs — Period label (req), Month (opt), Net profit (opt), Revenue (opt), Expenses (opt), Currency (PKR/USD), Note. **Preview button** → `POST /admin/equity/distributions/preview {period_label?,month?,net_profit?,revenue?,expenses_total?,currency?,overrides?,note?}` → **non-persisted** EquityDistributionModel with allocation lines (if net_profit omitted, server derives revenue−expenses). Preview section shows summary (net profit, total to distribute, allocated, retained) + allocation lines. **Confirm button** (enabled after preview) → `POST /admin/equity/distributions {…, status:"confirmed"}` → persist → back + toast. **CRITICAL: keep the two-step preview-before-commit gate.**
- **Detail — `/admin/equity/distributions/{id}`:** summary + allocations + bottom actions **Settle / Void / Delete** (status-dependent). Settle → confirm → `POST /admin/equity/distributions/{id}/settle`. Void → confirm (irreversible; reverses treasury disbursement) → `POST …/void`. Delete (draft/confirmed) → confirm → `DELETE`. `GET /admin/equity/distributions/{id}`. Web: runs list + create wizard (preview panel) + detail with status-aware action bar + confirm gates.

### 7.28 Commitments — `admin-equity-commitments` (`/admin-equity/commitments`) + Form
List (name, beneficiary, amount, currency, active). FAB "Add Commitment" → **CommitmentFormScreen**. `GET /admin/equity/commitments?page&limit&beneficiary_id&is_active`.
- **Form:** Beneficiary (searchable, req), Name (req), Amount (>0, req), Currency (PKR/USD), Start month (opt), End month (opt), Is Active (toggle), Note. Create `POST /admin/equity/commitments {beneficiary_id,name,amount,currency?,is_active?,start_month?,end_month?,note?,paid_by_id?}`; edit `PATCH` (sparse); delete → confirm.

### 7.29 Funds — `admin-equity-funds` (`/admin-equity/funds`)
Read-only pool funds (beneficiary, balance, currency, last update). `GET /admin/equity/funds` → `{funds:[]}`. Empty "No pool funds…". Pull-to-refresh.

### 7.30 Project Income — `admin-project-income` (`/admin-project-income`) + Create
Search (name/source, debounced 300ms) + summary header (total PKR, total original currency, count) + income list (name, amount, project, source, date, reversed status). FAB "Add Income" → Create. Card → edit. `GET /admin/project-income?page&limit&search&project_id&month&from&to`; `GET /admin/project-income/summary?from&to`; `GET /projects/options` (project picker).
- **Create Income — `/admin/project-income/new`:** Name (req), Amount (>0, req), Project (searchable, opt), Source (opt), Currency (PKR/USD), Date (≤ today, opt), Description (opt, char counter). Create `POST /admin/project-income {name,amount,project_id?,source?,currency?,date?,description?,attachment?}`; edit `PATCH /admin/project-income/{id}`. **Reverse** (soft-delete, edit mode, if not reversed) → confirm → `POST /admin/project-income/{id}/reverse`. **Delete** (hard) → confirm → `DELETE`. Web: income ledger + search + summary + reverse/delete lifecycle.

### 7.31 Projects — `projects` (`/admin-projects`)
Identical to HR §7.21 (list + Create/Edit + Detail tabs Overview/Team/Tasks/Activity/Analytics + all member/task/milestone/document CRUD). Same endpoints. Admin has full manage.

### 7.32 Payroll — `payroll-dashboard` (`/admin-payroll`) + Slip Detail `/payroll/slip`
Identical to HR §7.22: period picker; generate (`POST /salary/payroll/generate`); release all (`POST /salary/payroll/release`); slip list; slip detail with amend (`PATCH /salary/slips/{id} {basic_salary,earnings[],deductions[]}`) + release (`PATCH …{status:"generated"}`) + download (`GET /salary/slips/{id}/staff-download`). `GET /salary/payroll/slips?month&year&page&limit=100`.

### 7.33 Admin Salary Details (own) — `admin-salary-details` (`/admin-salary-details`)
Breakdown + PF banner + revisions + slips (download). `GET /salary/breakdown|revisions|slips`, `GET /salary/slips/{id}/download`.

### 7.34 Announcement Composer — `admin-announcement` (`/admin-announcement`)
Title (≤120), Message (≤500), Audience (AnnouncementTarget: everyone/role/department), Role (AnnouncementRole, if role), Department (searchable, if department). `GET /departments`; `POST /notifications/announcements {title,body,target,departmentId?,role?}` → recipient count.

### 7.35 All Holidays — `all-holidays` (`/all-holidays`) + Create `/all-holidays/create`
- List: HolidayTimeFilter chips (Upcoming/Past, counts, client-side on `isPast`); holiday cards (date, name, type, duration, description, image). FAB "Add Holiday" (admin) → Create. `GET /holidays` (flat, no pagination). Skeleton(6)/empty per filter/pull-to-refresh.
- **Create Holiday:** Name (req, ≤120), Date (req), Type (HolidayType: national/festival/company/other, req), Duration days (req ≥1, default 1), Image (opt → `POST /uploads` folder holidays), Description (opt ≤500). `POST /holidays {name,date,type,days,image?,description?}` → toast → pop.

### 7.36 Policies (manage) — `policies` (`/admin-policies`) + Viewer `/policies/view`
List + banner + **New Policy** FAB + per-card edit/delete (**PolicyFormSheet**: Title req, Description, PDF (req on create), Effective Date, Notify Employees toggle). `GET /policies`; `POST /policies {title,document_url,description?,effective_date?}`; `PATCH /policies/{id} {…,notify?}`; `DELETE /policies/{id}`. Viewer = in-app PDF (error+retry).

### 7.37 Notifications / Settings / Profile — `admin-notifications`, `admin-settings`, `admin-profile`
Identical to HR §7.26–7.28: notifications center (filter tabs + mark-all-read); settings (profile card, notification toggle, legal, delete account); profile (avatar, salary visibility, editable phone/emergency, read-only employment/loans/perks). Same endpoints.

---

## 8. Cross-feature flows — ADMIN
1. **Full payroll → treasury**: generate/release payroll → payroll appears in treasury `total_payroll` + finance report P&L.
2. **Profit distribution**: record project income → treasury income grows → create distribution (preview net profit → confirm) → beneficiaries allocated → settle/void → audit log + treasury disbursement.
3. **Loan lifecycle**: create loan (fixed → auto payroll deduction, or dynamic → manual) → record payments → balance drops → treasury loans_outstanding updates.
4. **Attendance from devices**: register device → map PINs (or resolve unmapped punches) → punches classify into attendance logs.
5. **Expense recurring**: create recurring expense (fixed/variable) → template created → variable months surface as pending-entries to fill.
6. **Period close**: close month → finance records locked → reopen to edit.
7. All HR flows (leave approval, onboarding, claim decisions, HR-help triage, announcements, projects) also apply.

## 9. ADMIN API Index
All HR endpoints (§9 of HR spec) **plus**: Expenses `GET /admin/expenses`, `/options`, `/pending-entries`, `/analytics`, `/report`, `GET /admin/expenses/{id}`, `POST /admin/expenses`, `PATCH /admin/expenses/{id}`; templates `GET /admin/expense-templates[/{id}]`, `POST`, `PATCH`, `DELETE`. Devices `GET /admin/devices[/{id}]`, `POST`, `PATCH /admin/devices/{id}`, `GET/POST /admin/devices/{id}/mappings`, `DELETE …/{mid}`, `GET /admin/devices/punches/unmapped`. Loans `GET /admin/loans[/{id}]`, `POST`, `PATCH`, `DELETE`, `GET/POST /admin/loans/{id}/payments`. Treasury/Finance `GET /admin/treasury`, `/opening` (GET/PUT), `/analytics`, `GET /admin/finance/report`, `/audit`, `/periods[/{month}]` (GET/POST/DELETE), `/adjustments[/{id}]` (GET/POST/DELETE). Equity `GET /admin/equity/allocation`, `/funds`, `/beneficiaries[/{id}]` (GET/POST/PATCH/DELETE), `/distributions[/{id}]` (GET/POST/DELETE) + `/preview` + `/{id}/void` + `/{id}/settle`, `/commitments[/{id}]` (GET/POST/PATCH/DELETE). Project income `GET /admin/project-income[/{id}]`, `/summary`, `POST`, `PATCH`, `POST …/{id}/reverse`, `DELETE`. Holidays `GET /holidays[/{id}]`, `POST /holidays`. Promotions reuse `GET /employees`, `GET /employees/designations`, `POST /employees/{id}/promote`.

## 10. Route index & editable summary
See §6. **Admin edits/creates:** everything HR can + promotions (dedicated) + company expenses (+templates) + devices/mappings + loans (+payments) + treasury opening + finance adjustments/periods + equity beneficiaries/distributions/commitments + project income + holidays. **Confirm-gated destructive actions:** delete expense/template/department/loan/beneficiary/commitment/adjustment, void/settle distribution, reverse income, reopen/close period, deactivate employee, delete account. **Two-step preview→commit:** equity distributions. **Read-only displays:** equity funds, finance audit, treasury breakdown, expense analytics/report.

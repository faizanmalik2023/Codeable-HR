# CodeableHR Web — Spec-Alignment Design (Plan of Record)

> Aligns the existing Next.js dashboard to the mobile-app specs (`01-EMPLOYEE.md`, `02-HR.md`, `03-ADMIN.md`). Approved 2026-07-13.

## Goal
The web app diverged from the mobile app. Rebuild/refactor the web dashboard so its screens, fields, flows, and enums match the gospel specs, wired to the **real backend**, with polished shadcn-style UI.

## Decisions (locked)
- **Data layer:** wire the real backend now, **feature by feature**. Server state via **TanStack React Query**; auth/UI state via **zustand**; **hook-per-page** (`use-<page>.ts` co-located; pages stay pure UI); API mappers in `lib/api/<feature>.ts`. **No proxy `/api` route** (calls go direct).
- **Routing:** keep **unified role-agnostic routes** under `(dashboard)/*`; sidebar gates destinations by role.
- **Start scope:** **Employee + Manager** first (foundation HR/Admin reuse), then HR, then Admin.
- **Existing UI:** **refactor & align** — keep the design system + reusable `components/ui`, restructure pages to spec, add missing screens/primitives.
- **Components:** everything (buttons, inputs, typography, selects) is a reusable shadcn-style component from `components/ui`. Forms: **react-hook-form + zod**. Toasts: **sonner**. Per global prefs: **never native** date/time/select pickers.

## Backend facts (verified against live API)
- Base: `http://ec2-13-234-142-206.ap-south-1.compute.amazonaws.com/api` — **no `/v1` segment**.
- Envelope: `{ statusCode, data, error }`, `hasError = error != null`.
- Auth: `POST /auth/google {id_token}` (Google-only for real accounts — needs a **Web** OAuth client ID); `POST /auth/refresh-token` rotates; single-flight 401 refresh + retry-once → forced logout.
- Enum truths (from `/api/enums`, override the MD where they differ): real `manager` role exists; `language` = `en`/`ur`; `attendance_status` (checkin) vs `attendance_report_status` (present/absent/…); `ticket_priority` = low/medium/high.

## Foundation (built first, once)
1. `lib/api/client.ts` — typed fetch wrapper: base URL + envelope unwrap + `Bearer` attach + single-flight refresh + forced logout + error mapping.
2. `lib/query/` — QueryClient + provider; query-key factory; pagination/infinite helpers.
3. `stores/auth-store.ts` — tokens + user + role landing; collapse to backend roles (admin/hr/manager/employee) + `isManager`.
4. `types/` — rewritten to spec models; `lib/enums.ts` — full catalog (wire→label→color→icon) seeded from live `/api/enums`, with server-driven overrides.
5. `components/ui` — extend with `Dialog`, `Sheet`/right-drawer, `Tabs`, `Table`+`DataTable`, `Tooltip`, `Toast` (sonner), `Popover`, `DropdownMenu`; shared `FilterTabs`, `EmptyState`, `ErrorRetry`, `Skeleton` states, money/date formatters.
6. Auth pages: `/login` (Google), guards, forgot/otp/reset.

## Employee + Manager feature order
Foundation → Auth + Dashboard → EOD (+team) → Leaves (+team approvals) → Attendance → Insurance & Expense claims → HR Help → Salary → Policies → Notifications + Activity → Settings + Profile.

Each feature: mini-spec → `lib/api/<feature>.ts` + `use-<page>.ts` → align/build page to spec fields/flows/enums → wire standard states → verify in running app.

## Open items (need from user)
- Google OAuth **Web** Client ID (to complete real login).
- Path of the role-change-for-testing endpoint.

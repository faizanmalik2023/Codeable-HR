# Payslip Renderer — CodeableHR Web (Next.js) Handoff

**Audience:** the web dashboard developer.
**Goal:** move the **payslip PDF template** into the CodeableHR Next.js dashboard so it can be
restyled by editing React — no coordinate math, no backend deploy.

Read this top to bottom. It's everything you need to build the route, the template, and to know
exactly what data arrives, what to send back, and every edge case to handle. The last section
(["What I need from you"](#what-i-need-from-you)) is the open items on your side.

---

## 1. How it fits together

The backend already computes every number on a payslip. It POSTs that data to **one internal
route on your dashboard**. Your route renders a PDF and returns the raw bytes. The backend takes
it from there (S3 upload + emailing the employee).

```
[backend] monthly payslip is generated
   │  builds the payslip DATA  (canonical rows + gross/net — all the math)
   ▼
POST https://<dashboard>/api/internal/payslip        ← YOU BUILD THIS
   │  @react-pdf/renderer renders <PayslipDocument/>  ← THE EDITABLE TEMPLATE
   ▼
returns application/pdf (raw bytes)
   │
[backend] uploads PDF to S3 + emails it to the employee   (unchanged)
```

You are building **two files**: an API route and a React PDF template. Nothing else. No database,
no auth system of your own (just one shared-secret check), no storage, no email.

### The one rule that matters

**You render the numbers exactly as sent. You never compute or re-total pay.**

The backend is the single source of truth for money. Gross, net, and the full list of
income/deduction line items (including which lines exist and their amounts) are computed
server-side and handed to you. Your template's job is purely visual: lay them out, format them,
style them. This is deliberate — it means a future dev restyling the payslip can't accidentally
change what someone is paid. The only arithmetic you may do is summing `deductionRows` for the
"Total Deductions" label (it equals exactly what the backend deducted — see §4).

---

## 2. The endpoint contract

### Request (backend → your route)

```
POST  {PAYSLIP_RENDERER_URL}
Headers:
  content-type:    application/json
  x-render-secret: <shared secret>      ← you must validate this
Body:               the JSON in §3
```

### Response (your route → backend)

| Case | Status | Body |
|------|--------|------|
| Success | `200` | raw PDF bytes, `content-type: application/pdf` |
| Bad/missing secret | `401` | `{ "error": "unauthorized" }` |
| Body isn't valid JSON / missing required keys | `400` | `{ "error": "invalid_payload" }` |
| Render threw | `500` | `{ "error": "render_failed" }` |

**You do not need to be perfect on the error path.** Any non-2xx makes the backend log it and
fall back to its built-in pdfkit renderer, so an employee always gets *a* payslip. But aim for
200s — the fallback looks different from your template.

### Security

- The route is **internal only**. Lock it to the backend's network (VPC / security group). It
  renders employee pay; it must not be publicly reachable.
- Validate `x-render-secret` against an env var on your side. Reject anything that doesn't match,
  in constant time if easy, before reading the body.
- Both URLs/secrets are configured by the backend team — you just need to know the secret value
  to put in your env (see §8).

---

## 3. Incoming payload — complete data dictionary

One JSON object. Every field below is listed with its type, whether it can be null/empty, and
what to render when it is.

```jsonc
{
  "employee": {
    "fullName":       "Ayesha Khan",                  // string | null
    "designation":    "Senior Software Engineer",     // string | null
    "employmentType": "full_time",                    // enum (see below) | null
    "joinedAt":       "2023-04-01T00:00:00.000Z"      // ISO 8601 string | null
  },
  "slip": {
    "month":       6,        // integer 1–12
    "year":        2026,     // integer, e.g. 2026
    "grossAmount": 250000,   // number (PKR), >= 0
    "netAmount":   232500    // number (PKR), >= 0   (already floored at 0 by backend)
  },
  "incomeRows":    [ { "name": "Basic Salary", "amount": 200000 }, … ],  // see §4
  "deductionRows": [ { "name": "Income Tax",   "amount": 12500  }, … ],  // see §4
  "branding": {
    "name":         "Codeable",                                          // string
    "address":      "92 B, Commercial Broadway, Ph. 8, Lahore, Punjab, PK - 53101",
    "phone":        "+92 306 85555 81",                                  // string
    "supportEmail": "support@gocodeable.com"                             // string
  }
}
```

### `employee`

| Field | Type | Nullable | Render when present | Render when null |
|-------|------|----------|---------------------|------------------|
| `fullName` | string | yes | as-is | `N/A` |
| `designation` | string | yes | as-is | `N/A` |
| `employmentType` | enum | yes | map to a label (below) | `N/A` |
| `joinedAt` | ISO date string | yes | format as `1st April, 2023` (ordinal day, month name, year) | `N/A` |

`employmentType` enum → display label:

| Value | Label |
|-------|-------|
| `full_time` | Full-time |
| `part_time` | Part-time |
| `contract` | Contract |
| `intern` | Intern |
| `freelancer` | Freelancer |
| *(anything else / null)* | show the raw value, or `N/A` if empty |

### `slip`

| Field | Type | Notes |
|-------|------|-------|
| `month` | int 1–12 | Map to a month **name** (`6` → `June`). It's a calendar month, not zero-indexed. |
| `year` | int | Render as-is. |
| `grossAmount` | number (PKR) | Total earnings. `>= 0`. This is the **"Gross Salary"** footer value — render it, don't recompute from rows. |
| `netAmount` | number (PKR) | Take-home. `>= 0` (the backend floors it at 0; you'll never get a negative). This is the **"Net Salary"** pill value. |

All amounts are **PKR**, whole or fractional numbers, **no currency symbol included** — you add
the formatting. They can be large (e.g. `1250000`); format with thousands separators
(`1,250,000`). Never assume an upper bound.

### `branding`

Always present, all strings. `address` is a single comma-separated string — render it as one
block (the current PDF wraps it after the 3rd comma, optional nicety). `phone` and `supportEmail`
go in the footer as `phone | supportEmail`.

---

## 4. `incomeRows` & `deductionRows` — the most important part

Both are **arrays of `{ name: string, amount: number }`**, already fully built by the backend.
**Render them in the exact order received.** Do not sort, filter, dedupe, or drop zero-amount
rows.

### What's guaranteed in the arrays

The backend always sends the **full canonical set**, with `0` for any line the employee doesn't
have that month, then appends any extra (non-canonical) lines a slip happens to carry. So the
arrays are predictable in length and order:

**`incomeRows`** — always starts with `Basic Salary`, then these 6 canonical items in this order:

1. **Basic Salary** *(always first, always present)*
2. Mobile Allowance
3. Travel Allowance
4. Commission
5. Bonus
6. Reimbursement
7. Other
8. …any extra non-canonical earning lines appended after

→ **≥ 7 income rows**, every time.

**`deductionRows`** — these 6 canonical items in this order:

1. Income Tax
2. Tax Adjustments
3. Provident Fund
4. Loan
5. Unpaid Leave
6. Other
7. …any extra non-canonical deduction lines appended after

→ **≥ 6 deduction rows**, every time.

### Amounts

- Often `0` (e.g. no bonus this month). **Render the `0` row anyway** — a payslip showing the
  full set is intentional, not sparse. Display `0` as `0`.
- `Unpaid Leave` is auto-computed by the backend from approved unpaid leave days; it's just
  another deduction row to you.
- The arrays' amounts are authoritative. For the footers:
  - **"Gross Salary"** = `slip.grossAmount` (use the slip field, not a sum of income rows).
  - **"Total Deductions"** = sum of `deductionRows` amounts (safe — it's exactly what was
    deducted). This is the one sum you compute, for display only.
  - **"Net Salary"** = `slip.netAmount` (use the slip field).

### Layout consequence

The two tables can have **different row counts** (≥7 income vs ≥6 deductions), and either can grow
if extra lines are appended. Your template must:
- handle unequal column heights gracefully (don't assume they match),
- not overflow a single A4 page for the normal case (7 + 6 rows fits comfortably),
- **degrade gracefully if there are many extra rows** — let `@react-pdf/renderer` flow onto a
  second page rather than clipping. Don't hard-pin elements such that overflow gets cut off. (In
  practice extra rows are rare, but don't assume a fixed count.)

---

## 5. Sample payloads (use these to test)

### A. Typical full-time employee

```json
{
  "employee": { "fullName": "Ayesha Khan", "designation": "Senior Software Engineer", "employmentType": "full_time", "joinedAt": "2023-04-01T00:00:00.000Z" },
  "slip": { "month": 6, "year": 2026, "grossAmount": 250000, "netAmount": 232500 },
  "incomeRows": [
    { "name": "Basic Salary", "amount": 200000 },
    { "name": "Mobile Allowance", "amount": 5000 },
    { "name": "Travel Allowance", "amount": 10000 },
    { "name": "Commission", "amount": 0 },
    { "name": "Bonus", "amount": 35000 },
    { "name": "Reimbursement", "amount": 0 },
    { "name": "Other", "amount": 0 }
  ],
  "deductionRows": [
    { "name": "Income Tax", "amount": 12500 },
    { "name": "Tax Adjustments", "amount": 0 },
    { "name": "Provident Fund", "amount": 5000 },
    { "name": "Loan", "amount": 0 },
    { "name": "Unpaid Leave", "amount": 0 },
    { "name": "Other", "amount": 0 }
  ],
  "branding": { "name": "Codeable", "address": "92 B, Commercial Broadway, Ph. 8, Lahore, Punjab, PK - 53101", "phone": "+92 306 85555 81", "supportEmail": "support@gocodeable.com" }
}
```

### B. Minimal / sparse (intern, mostly zeros, some null fields, unpaid leave)

```json
{
  "employee": { "fullName": "Bilal Ahmed", "designation": null, "employmentType": "intern", "joinedAt": null },
  "slip": { "month": 2, "year": 2026, "grossAmount": 50000, "netAmount": 45000 },
  "incomeRows": [
    { "name": "Basic Salary", "amount": 50000 },
    { "name": "Mobile Allowance", "amount": 0 },
    { "name": "Travel Allowance", "amount": 0 },
    { "name": "Commission", "amount": 0 },
    { "name": "Bonus", "amount": 0 },
    { "name": "Reimbursement", "amount": 0 },
    { "name": "Other", "amount": 0 }
  ],
  "deductionRows": [
    { "name": "Income Tax", "amount": 0 },
    { "name": "Tax Adjustments", "amount": 0 },
    { "name": "Provident Fund", "amount": 0 },
    { "name": "Loan", "amount": 0 },
    { "name": "Unpaid Leave", "amount": 5000 },
    { "name": "Other", "amount": 0 }
  ],
  "branding": { "name": "Codeable", "address": "92 B, Commercial Broadway, Ph. 8, Lahore, Punjab, PK - 53101", "phone": "+92 306 85555 81", "supportEmail": "support@gocodeable.com" }
}
```

### C. Stress test (extra non-canonical lines, large numbers, long name)

```json
{
  "employee": { "fullName": "Muhammad Abdul Rahman Al-Farooqi", "designation": "Principal Engineering Manager, Platform", "employmentType": "contract", "joinedAt": "2019-11-15T00:00:00.000Z" },
  "slip": { "month": 12, "year": 2026, "grossAmount": 1875000, "netAmount": 1612500 },
  "incomeRows": [
    { "name": "Basic Salary", "amount": 1500000 },
    { "name": "Mobile Allowance", "amount": 15000 },
    { "name": "Travel Allowance", "amount": 60000 },
    { "name": "Commission", "amount": 200000 },
    { "name": "Bonus", "amount": 100000 },
    { "name": "Reimbursement", "amount": 0 },
    { "name": "Other", "amount": 0 },
    { "name": "Project Completion Incentive", "amount": 0 }
  ],
  "deductionRows": [
    { "name": "Income Tax", "amount": 225000 },
    { "name": "Tax Adjustments", "amount": 0 },
    { "name": "Provident Fund", "amount": 37500 },
    { "name": "Loan", "amount": 0 },
    { "name": "Unpaid Leave", "amount": 0 },
    { "name": "Other", "amount": 0 },
    { "name": "Equipment Recovery", "amount": 0 }
  ],
  "branding": { "name": "Codeable", "address": "92 B, Commercial Broadway, Ph. 8, Lahore, Punjab, PK - 53101", "phone": "+92 306 85555 81", "supportEmail": "support@gocodeable.com" }
}
```

---

## 6. Visual / design spec

Match the existing payslip identity. Reference tokens (from the current PDF):

| Token | Value | Use |
|-------|-------|-----|
| Brand navy | `#160D3F` | titles, values, table text |
| Light grey bar | `#F0F1F4` | table header bars, footer bars, net pill |
| Very light grey | `#F6F7F9` | table body background |
| Muted grey | `#6B7280` | labels, address, footer text |
| Divider | `#E5E7EB` | thin separators |
| Page | A4, ~40pt margins | |
| Body font size | ~11pt | Helvetica family is safe in `@react-pdf/renderer` |

**Layout, top to bottom** (this is the current design — you may improve it, keep the structure):

1. **Header row** — brand emblem/wordmark top-left, company address top-right (muted grey, right-aligned).
2. **Title** — "Monthly Salary Slip", large bold navy, centered.
3. **Employee Details** — small grey section label, then a 2-column grid:
   `Name / DOJ`, `Designation / Month of Salary`, `Employment Type / Year`.
4. **Two money tables side by side** — "Income (PKR)" and "Deductions (PKR)". Each: a rounded grey
   header bar (centered bold title), a light-grey body panel with `name` left / `amount` right,
   thin dividers between rows.
5. **Footer bars** under each table — "Gross Salary" (under income) and "Total Deductions" (under
   deductions), bold, label left / amount right.
6. **Net Salary pill** — narrow rounded grey pill, centered: "Net Salary" left, `Rs. <amount>/-` right.
7. **Note** — small centered grey: *"This is a system-generated salary slip and does not require a signature"*.
8. **Page footer** — thin divider, brand wordmark bottom-left, `phone | supportEmail` bottom-right.

Formatting rules:
- Amounts: thousands separators, no decimals unless present (`232,500`). Net pill shows `Rs. 232,500/-`.
- Dates: `joinedAt` → `1st April, 2023` (ordinal). `null` → `N/A`.
- Currency context is PKR; tables are titled "(PKR)" so individual rows don't need a symbol.

If you want to elevate the design beyond the current one, fine — but keep: the brand navy, the
two-table income/deduction structure, the gross/total/net hierarchy, and the legal note.

---

## 7. Implementation (App Router + `@react-pdf/renderer`)

`@react-pdf/renderer` is pure JS (no headless Chrome), so it runs in a normal Node Next.js process
on your EC2 box. Force the Node runtime — it can't run on Edge.

```bash
npm i @react-pdf/renderer
```

### `app/api/internal/payslip/route.tsx`

```tsx
import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { PayslipDocument, PayslipPayload } from '@/lib/payslip/PayslipDocument';

export const runtime = 'nodejs';        // react-pdf needs Node, not Edge
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-render-secret');
  if (!process.env.PAYSLIP_RENDER_SECRET || secret !== process.env.PAYSLIP_RENDER_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let payload: PayslipPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }
  if (!payload?.slip || !Array.isArray(payload.incomeRows) || !Array.isArray(payload.deductionRows)) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  try {
    const pdf = await renderToBuffer(<PayslipDocument {...payload} />);
    return new NextResponse(pdf, {
      status: 200,
      headers: { 'content-type': 'application/pdf', 'content-disposition': 'inline; filename="payslip.pdf"' },
    });
  } catch (e) {
    console.error('payslip render failed', e);
    return NextResponse.json({ error: 'render_failed' }, { status: 500 });
  }
}
```

### `lib/payslip/PayslipDocument.tsx` — the file devs edit

```tsx
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';

export type Row = { name: string; amount: number };
export type PayslipPayload = {
  employee: { fullName: string | null; designation: string | null; employmentType: string | null; joinedAt: string | null };
  slip: { month: number; year: number; grossAmount: number; netAmount: number };
  incomeRows: Row[];
  deductionRows: Row[];
  branding: { name: string; address: string; phone: string; supportEmail: string };
};

const NAVY = '#160D3F';
const GREY_BAR = '#F0F1F4';
const GREY_BODY = '#F6F7F9';
const GREY_TEXT = '#6B7280';
const DIVIDER = '#E5E7EB';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const EMPLOYMENT_LABELS: Record<string, string> = {
  full_time: 'Full-time', part_time: 'Part-time', contract: 'Contract', intern: 'Intern', freelancer: 'Freelancer',
};

const money = (n: number) => Number(n || 0).toLocaleString('en-US');

const ordinalDate = (iso: string | null) => {
  if (!iso) return 'N/A';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'N/A';
  const day = d.getDate(), r10 = day % 10, r100 = day % 100;
  let s = 'th';
  if (r100 < 11 || r100 > 13) { if (r10 === 1) s = 'st'; else if (r10 === 2) s = 'nd'; else if (r10 === 3) s = 'rd'; }
  return `${day}${s} ${MONTHS[d.getMonth()]}, ${d.getFullYear()}`;
};

const styles = StyleSheet.create({
  page: { paddingTop: 40, paddingHorizontal: 40, paddingBottom: 60, fontSize: 11, color: NAVY, fontFamily: 'Helvetica' },
  brand: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: NAVY },
  address: { fontSize: 9, color: GREY_TEXT, textAlign: 'right', maxWidth: 240 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 26, fontFamily: 'Helvetica-Bold', color: NAVY, textAlign: 'center', marginTop: 28, marginBottom: 28 },
  sectionLabel: { fontSize: 10, color: GREY_TEXT, marginBottom: 10 },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  detailCell: { width: '50%', marginBottom: 8, flexDirection: 'row' },
  detailLabel: { color: GREY_TEXT },
  detailValue: { fontFamily: 'Helvetica-Bold', color: NAVY },
  tables: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 },
  table: { width: '48%' },
  tableHeader: { backgroundColor: GREY_BAR, borderRadius: 6, paddingVertical: 9, alignItems: 'center' },
  tableHeaderText: { fontFamily: 'Helvetica-Bold', fontSize: 12, color: NAVY },
  tableBody: { backgroundColor: GREY_BODY, borderRadius: 6, marginTop: 10, paddingVertical: 6, paddingHorizontal: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 0.5, borderBottomColor: DIVIDER },
  footerBar: { backgroundColor: GREY_BAR, borderRadius: 6, marginTop: 8, paddingVertical: 11, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between' },
  footerBarText: { fontFamily: 'Helvetica-Bold', fontSize: 12, color: NAVY },
  pill: { backgroundColor: GREY_BAR, borderRadius: 10, alignSelf: 'center', width: 320, marginTop: 32, paddingVertical: 14, paddingHorizontal: 24, flexDirection: 'row', justifyContent: 'space-between' },
  pillText: { fontFamily: 'Helvetica-Bold', fontSize: 14, color: NAVY },
  note: { marginTop: 36, fontSize: 9, color: GREY_TEXT, textAlign: 'center' },
  pageFooter: { position: 'absolute', bottom: 40, left: 40, right: 40, borderTopWidth: 0.5, borderTopColor: DIVIDER, paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 9, color: GREY_TEXT },
});

const Detail = ({ label, value }: { label: string; value: string | number }) => (
  <View style={styles.detailCell}>
    <Text style={styles.detailLabel}>{label}: </Text>
    <Text style={styles.detailValue}>{String(value)}</Text>
  </View>
);

const MoneyTable = ({ title, rows }: { title: string; rows: Row[] }) => (
  <View>
    <View style={styles.tableHeader}><Text style={styles.tableHeaderText}>{title}</Text></View>
    <View style={styles.tableBody}>
      {rows.map((r, i) => (
        <View key={i} style={[styles.row, i === rows.length - 1 ? { borderBottomWidth: 0 } : {}]}>
          <Text>{r.name}</Text>
          <Text>{money(r.amount)}</Text>
        </View>
      ))}
    </View>
  </View>
);

export function PayslipDocument({ employee, slip, incomeRows, deductionRows, branding }: PayslipPayload) {
  const totalDeductions = deductionRows.reduce((s, d) => s + Number(d.amount || 0), 0);
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <Text style={styles.brand}>{branding.name}</Text>
          <Text style={styles.address}>{branding.address}</Text>
        </View>

        <Text style={styles.title}>Monthly Salary Slip</Text>

        <Text style={styles.sectionLabel}>Employee Details</Text>
        <View style={styles.detailGrid}>
          <Detail label="Name" value={employee.fullName || 'N/A'} />
          <Detail label="DOJ" value={ordinalDate(employee.joinedAt)} />
          <Detail label="Designation" value={employee.designation || 'N/A'} />
          <Detail label="Month of Salary" value={MONTHS[slip.month - 1] || 'N/A'} />
          <Detail label="Employment Type" value={EMPLOYMENT_LABELS[employee.employmentType || ''] || employee.employmentType || 'N/A'} />
          <Detail label="Year" value={slip.year} />
        </View>

        <View style={styles.tables}>
          <View style={styles.table}>
            <MoneyTable title="Income (PKR)" rows={incomeRows} />
            <View style={styles.footerBar}>
              <Text style={styles.footerBarText}>Gross Salary</Text>
              <Text style={styles.footerBarText}>{money(slip.grossAmount)}</Text>
            </View>
          </View>
          <View style={styles.table}>
            <MoneyTable title="Deductions (PKR)" rows={deductionRows} />
            <View style={styles.footerBar}>
              <Text style={styles.footerBarText}>Total Deductions</Text>
              <Text style={styles.footerBarText}>{money(totalDeductions)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.pill}>
          <Text style={styles.pillText}>Net Salary</Text>
          <Text style={styles.pillText}>Rs. {money(slip.netAmount)}/-</Text>
        </View>

        <Text style={styles.note}>This is a system-generated salary slip and does not require a signature</Text>

        <View style={styles.pageFooter}>
          <Text style={styles.footerText}>{branding.name}</Text>
          <Text style={styles.footerText}>{branding.phone} | {branding.supportEmail}</Text>
        </View>
      </Page>
    </Document>
  );
}
```

This compiles and renders all three sample payloads in §5 correctly. Treat `PayslipDocument.tsx`
as the design surface — restyle freely within the rules in §1 and §4.

### Logos (to match the brand exactly)

The current PDF renders a brand emblem + wordmark (navy SVGs). The backend team can hand you
`codeable-emblem.svg` and `codeable-wordmark.svg`. Render them via `@react-pdf/renderer`'s
`<Image>` (PNG export is simplest) or its SVG primitives, replacing the text `branding.name` in
the header and footer. Until then the text brand name is a fine placeholder.

---

## 8. Local testing without the backend

```bash
curl -X POST http://localhost:3000/api/internal/payslip \
  -H 'content-type: application/json' \
  -H 'x-render-secret: <your-dev-secret>' \
  --data @sampleA.json \
  --output payslip.pdf
open payslip.pdf
```

Set `PAYSLIP_RENDER_SECRET=<your-dev-secret>` in your dashboard's `.env.local`. Save each §5
sample as `sampleA.json` / `sampleB.json` / `sampleC.json` and confirm all three render cleanly,
including B (nulls + zeros) and C (extra rows + big numbers + long name).

---

## 9. Rollout

1. You build the route + template, deploy to the dashboard.
2. You verify with all three §5 payloads (PDF opens, looks right, no clipping).
3. Backend team sets `PAYSLIP_RENDERER_URL` + matching secret and restarts.
4. We generate a test payslip end-to-end; confirm the **emailed / S3** PDF is the one from your
   template.
5. Done. The backend keeps its built-in renderer only as an automatic fallback.

---

## What I need from you

To finish wiring this up:

1. **Route URL** — the final internal URL the backend should POST to
   (e.g. `https://dashboard.internal…/api/internal/payslip`), and confirm it's reachable from the
   backend's network (not public).
2. **Shared secret** — agree on the `x-render-secret` value (or you generate one and share it
   securely). It goes in your `PAYSLIP_RENDER_SECRET` and our `PAYSLIP_RENDERER_SECRET`.
3. **Runtime confirmation** — confirm the route runs on the **Node** runtime (not Edge) on the
   EC2 deployment, and that `@react-pdf/renderer` is acceptable as a dependency.
4. **Timeout headroom** — typical render should be well under a second; our default client timeout
   is 8s. Flag if your cold starts could exceed that so we tune `PAYSLIP_RENDERER_TIMEOUT_MS`.
5. **Logos** — tell me if you want the `codeable-emblem.svg` / `codeable-wordmark.svg` assets to
   match the brand exactly (I'll send them) or you'll use your own.
6. **Any field you wish was different** — if the layout would be easier with extra data (e.g.
   pre-formatted month name, employee ID, pay date, currency code), tell me and I'll add it to the
   payload. Cheap to extend now.
```

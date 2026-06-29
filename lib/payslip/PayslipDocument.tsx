import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Svg,
  Path,
} from '@react-pdf/renderer';

export type Row = { name: string; amount: number };

export type PayslipPayload = {
  employee: {
    fullName: string | null;
    designation: string | null;
    employmentType: string | null;
    joinedAt: string | null;
  };
  slip: { month: number; year: number; grossAmount: number; netAmount: number };
  incomeRows: Row[];
  deductionRows: Row[];
  branding: { name: string; address: string; phone: string; supportEmail: string };
};

// ─── Design tokens ────────────────────────────────────────────────────────────

const NAVY      = '#160D3F';
const GREY_BAR  = '#F0F1F4';
const GREY_BODY = '#F6F7F9';
const GREY_TEXT = '#6B7280';
const DIVIDER   = '#E5E7EB';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const EMPLOYMENT_LABELS: Record<string, string> = {
  full_time:  'Full-time',
  part_time:  'Part-time',
  contract:   'Contract',
  intern:     'Intern',
  freelancer: 'Freelancer',
};

function money(n: number): string {
  return Number(n || 0).toLocaleString('en-US');
}

function ordinalDate(iso: string | null): string {
  if (!iso) return 'N/A';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'N/A';
  const day = d.getDate();
  const r10 = day % 10, r100 = day % 100;
  let suffix = 'th';
  if (r100 < 11 || r100 > 13) {
    if (r10 === 1) suffix = 'st';
    else if (r10 === 2) suffix = 'nd';
    else if (r10 === 3) suffix = 'rd';
  }
  return `${day}${suffix} ${MONTHS[d.getMonth()]}, ${d.getFullYear()}`;
}

// Wrap address at the 3rd comma for a two-line layout
function formatAddress(address: string): string {
  const parts = address.split(', ');
  if (parts.length <= 3) return address;
  return parts.slice(0, 3).join(', ') + ',\n' + parts.slice(3).join(', ');
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingHorizontal: 40,
    paddingBottom: 80,       // leave room for absolute note + footer
    fontSize: 11,
    color: NAVY,
    fontFamily: 'Helvetica',
  },

  // ── Page header ──
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  address: {
    fontSize: 9,
    color: GREY_TEXT,
    textAlign: 'right',
    maxWidth: 230,
    lineHeight: 1.5,
  },

  // ── Title ──
  title: {
    fontSize: 25,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
    textAlign: 'center',
    marginTop: 22,
    marginBottom: 20,
  },

  // ── Employee details ──
  sectionLabel: {
    fontSize: 9.5,
    color: GREY_TEXT,
    marginBottom: 6,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailCell: {
    width: '50%',
    marginBottom: 7,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailLabel: {
    fontSize: 10.5,
    color: GREY_TEXT,
  },
  detailValue: {
    fontSize: 10.5,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
  },

  // ── Tables section ──
  //
  // Layout: one wide header bar → two equal-height bodies → two footer bars
  //
  tablesSection: {
    marginTop: 44,
  },

  // Single rounded bar spanning full width, split into two label cells
  tablesHeaderBar: {
    flexDirection: 'row',
    backgroundColor: GREY_BAR,
    borderRadius: 6,
    paddingVertical: 11,
  },
  tablesHeaderCell: {
    flex: 1,
    alignItems: 'center',
  },
  tablesHeaderText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
    color: NAVY,
  },

  // Two body columns — alignItems:'stretch' forces equal heights
  tablesBodies: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    marginTop: 10,
  },
  tableBodyCol: {
    width: '48%',
    backgroundColor: GREY_BODY,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 0.5,
    borderBottomColor: DIVIDER,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowText: {
    fontSize: 10.5,
    color: NAVY,
  },

  // Two footer bars — same width/gap as bodies so they align perfectly
  tablesFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  footerBar: {
    width: '48%',
    backgroundColor: GREY_BAR,
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerBarText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    color: NAVY,
  },

  // ── Net salary pill ──
  pill: {
    backgroundColor: GREY_BAR,
    borderRadius: 8,
    alignSelf: 'center',
    width: 285,
    marginTop: 24,
    paddingVertical: 13,
    paddingHorizontal: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pillText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 12.5,
    color: NAVY,
  },

  // ── Note — absolute, pinned just above the page footer ──
  note: {
    position: 'absolute',
    bottom: 60,
    left: 40,
    right: 40,
    fontSize: 9,
    color: GREY_TEXT,
    textAlign: 'center',
  },

  // ── Page footer — absolute at very bottom ──
  pageFooter: {
    position: 'absolute',
    bottom: 26,
    left: 40,
    right: 40,
    borderTopWidth: 0.5,
    borderTopColor: DIVIDER,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerRight: {
    fontSize: 9,
    color: GREY_TEXT,
  },
});

// ─── SVG logos ────────────────────────────────────────────────────────────────

// Standalone diamond emblem — page header top-left
const EmblemSvg = () => (
  <Svg width={38} height={24} viewBox="0 0 46 29">
    <Path d="M11.4395 14.4996L22.517 3.42827L25.939 0H19.0888H14.5004L0 14.4996L14.37 28.8704L20.0897 23.1498L11.4395 14.4996Z" fill={NAVY} />
    <Path d="M30.6642 0.134937L24.9436 5.85558L33.5884 14.4995L22.5171 25.5771L19.0889 29H25.94H30.5284L45.0342 14.4995L30.6642 0.134937Z" fill={NAVY} />
    <Path d="M22.4893 8.30975L16.2993 14.4997L22.4893 20.6896L28.6792 14.4997L22.4893 8.30975Z" fill={NAVY} />
  </Svg>
);

// Full c◇deable wordmark — page footer bottom-left
const WordmarkSvg = () => (
  <Svg width={92} height={15} viewBox="0 0 110 18">
    <Path d="M0 11.3126C0 7.61487 2.84608 4.81659 6.64158 4.81659C9.87656 4.81659 12.4315 6.85882 12.9421 9.77877H10.046C9.60716 8.39266 8.27102 7.44324 6.63941 7.44324C4.44945 7.44324 2.79611 9.12265 2.79611 11.3104C2.79611 13.4982 4.45162 15.1798 6.63941 15.1798C8.26885 15.1798 9.60716 14.2304 10.046 12.8443H12.9421C12.4315 15.7642 9.87656 17.8065 6.64158 17.8065C2.84608 17.8065 0 15.0082 0 11.3104" fill={NAVY} />
    <Path d="M49.5347 11.3126C49.5347 7.61487 52.3807 4.81659 56.1524 4.81659C59.924 4.81659 62.7939 7.61488 62.7939 11.3365C62.7939 11.6776 62.77 12.0426 62.7201 12.3576H52.4546C52.8674 14.1587 54.3274 15.3493 56.274 15.3493C57.7101 15.3493 58.9506 14.717 59.5829 13.7676H62.5984C61.6012 16.177 59.1679 17.8065 56.224 17.8065C52.3808 17.8065 49.5347 15.0082 49.5347 11.3104M52.4785 10.1199H59.874C59.4612 8.41656 58.0012 7.27378 56.1524 7.27378C54.3035 7.27378 52.9174 8.39266 52.4785 10.1199Z" fill={NAVY} />
    <Path d="M64.1216 11.3126C64.1216 7.61488 66.7243 4.81659 70.2287 4.81659C72.0537 4.81659 73.5615 5.59437 74.5826 6.88489V5.10772H77.307V17.5153H74.5826V15.7403C73.5615 17.0287 72.0515 17.8086 70.2287 17.8086C66.7243 17.8086 64.1216 15.0103 64.1216 11.3126ZM74.5826 11.3126C74.5826 9.12265 72.9531 7.44541 70.7632 7.44541C68.5732 7.44541 66.9199 9.12482 66.9199 11.3126C66.9199 13.5004 68.5493 15.182 70.7632 15.182C72.977 15.182 74.5826 13.5026 74.5826 11.3126Z" fill={NAVY} />
    <Path d="M92.8779 1.73807L95.6023 0V17.5154H92.8779V1.73807Z" fill={NAVY} />
    <Path d="M96.7407 11.3126C96.7407 7.61487 99.5868 4.81659 103.358 4.81659C107.13 4.81659 110 7.61488 110 11.3365C110 11.6776 109.976 12.0426 109.926 12.3576H99.6607C100.073 14.1587 101.533 15.3493 103.48 15.3493C104.916 15.3493 106.157 14.717 106.789 13.7676H109.807C108.809 16.177 106.376 17.8065 103.432 17.8065C99.589 17.8065 96.7429 15.0082 96.7429 11.3104M99.6846 10.1199H107.08C106.667 8.41656 105.207 7.27378 103.358 7.27378C101.51 7.27378 100.123 8.39266 99.6846 10.1199Z" fill={NAVY} />
    <Path d="M45.6719 1.73807V6.88491C44.6508 5.5944 43.143 4.81661 41.3181 4.81661C37.8159 4.81661 35.2109 7.6149 35.2109 11.3126C35.2109 15.0104 37.8137 17.8087 41.3181 17.8087C41.8873 17.8087 42.4196 17.7261 42.9214 17.5827L44.3814 14.2565C43.7188 14.8366 42.8454 15.182 41.8547 15.182C39.6408 15.182 38.0114 13.5026 38.0114 11.3126C38.0114 9.12267 39.6408 7.44544 41.8547 7.44544C44.0686 7.44544 45.6741 9.12484 45.6741 11.3126V17.5154H48.3985V0L45.6741 1.73807H45.6719Z" fill={NAVY} />
    <Path d="M85.6083 4.81661C83.7833 4.81661 82.2755 5.5944 81.2283 6.88491V0L78.5039 1.73807V17.5154H81.2283V11.3126C81.2283 9.12267 82.8817 7.44327 85.0716 7.44327C87.2616 7.44327 88.891 9.12267 88.891 11.3105C88.891 13.4983 87.2616 15.1798 85.0716 15.1798C84.0679 15.1798 83.1815 14.8257 82.5101 14.2326L83.9766 17.5718C84.4872 17.7196 85.0282 17.8065 85.6061 17.8065C89.0844 17.8065 91.7132 15.0082 91.7132 11.3105C91.7132 7.61273 89.0866 4.81444 85.6061 4.81444" fill={NAVY} />
    <Path d="M19.3707 11.3126L24.0656 6.61984L25.5169 5.16638H22.6122H20.6677L14.5215 11.3126L20.6112 17.4045L23.0358 14.9799L19.3707 11.3126Z" fill={NAVY} />
    <Path d="M27.5202 5.22504L25.0934 7.64964L28.7585 11.3126L24.0658 16.0097L22.6123 17.461H25.517H27.4615L33.6099 11.3126L27.5202 5.22504Z" fill={NAVY} />
    <Path d="M24.0546 8.68834L21.4307 11.3123L24.0546 13.9362L26.6785 11.3123L24.0546 8.68834Z" fill={NAVY} />
  </Svg>
);

// ─── Sub-components ───────────────────────────────────────────────────────────

const Detail = ({ label, value }: { label: string; value: string | number }) => (
  <View style={s.detailCell}>
    <Text style={s.detailLabel}>{label}: </Text>
    <Text style={s.detailValue}>{String(value)}</Text>
  </View>
);

// Pad the shorter column with invisible spacer rows so both bodies are equal height.
// alignItems:'stretch' is unreliable in yoga-layout when row counts differ;
// explicit padding is the guaranteed approach.
type DisplayRow = Row & { spacer?: true };

function padToLength(rows: Row[], n: number): DisplayRow[] {
  const extra = Math.max(0, n - rows.length);
  return [...rows, ...Array.from({ length: extra }, () => ({ name: '', amount: 0, spacer: true as const }))];
}

// totalRows: the row count of the taller sibling column
const RowList = ({ rows, totalRows }: { rows: Row[]; totalRows: number }) => {
  const display = padToLength(rows, totalRows);
  return (
    <View>
      {display.map((r, i) => (
        <View
          key={i}
          style={[
            s.row,
            // remove divider on last real row and on all spacer rows
            (r.spacer || i === rows.length - 1) ? s.rowLast : {},
          ]}
        >
          {/* space char keeps spacer rows the same height as data rows */}
          <Text style={s.rowText}>{r.spacer ? ' ' : r.name}</Text>
          <Text style={s.rowText}>{r.spacer ? '' : money(r.amount)}</Text>
        </View>
      ))}
    </View>
  );
};

// ─── Main document ────────────────────────────────────────────────────────────

export function PayslipDocument({
  employee,
  slip,
  incomeRows,
  deductionRows,
  branding,
}: PayslipPayload) {
  const totalDeductions = deductionRows.reduce((sum, d) => sum + Number(d.amount || 0), 0);
  const maxLen = Math.max(incomeRows.length, deductionRows.length);
  const empTypeLabel =
    EMPLOYMENT_LABELS[employee.employmentType || ''] ||
    employee.employmentType ||
    'N/A';

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* ── Page header ── */}
        <View style={s.headerRow}>
          <EmblemSvg />
          <Text style={s.address}>{formatAddress(branding.address)}</Text>
        </View>

        {/* ── Title ── */}
        <Text style={s.title}>Monthly Salary Slip</Text>

        {/* ── Employee details ── */}
        <Text style={s.sectionLabel}>Employee Details</Text>
        <View style={s.detailGrid}>
          <Detail label="Name"            value={employee.fullName || 'N/A'} />
          <Detail label="DOJ"             value={ordinalDate(employee.joinedAt)} />
          <Detail label="Designation"     value={employee.designation || 'N/A'} />
          <Detail label="Month of Salary" value={MONTHS[slip.month - 1] ?? 'N/A'} />
          <Detail label="Employment Type" value={empTypeLabel} />
          <Detail label="Year"            value={slip.year} />
        </View>

        {/* ── Tables section ── */}
        <View style={s.tablesSection}>

          {/* Single full-width header bar with two centered labels */}
          <View style={s.tablesHeaderBar}>
            <View style={s.tablesHeaderCell}>
              <Text style={s.tablesHeaderText}>Income (PKR)</Text>
            </View>
            <View style={s.tablesHeaderCell}>
              <Text style={s.tablesHeaderText}>Deductions (PKR)</Text>
            </View>
          </View>

          {/* Two body columns — both padded to maxLen rows for equal height */}
          <View style={s.tablesBodies}>
            <View style={s.tableBodyCol}>
              <RowList rows={incomeRows} totalRows={maxLen} />
            </View>
            <View style={s.tableBodyCol}>
              <RowList rows={deductionRows} totalRows={maxLen} />
            </View>
          </View>

          {/* Two footer bars aligned below each body */}
          <View style={s.tablesFooterRow}>
            <View style={s.footerBar}>
              <Text style={s.footerBarText}>Gross Salary</Text>
              <Text style={s.footerBarText}>{money(slip.grossAmount)}</Text>
            </View>
            <View style={s.footerBar}>
              <Text style={s.footerBarText}>Total deductions</Text>
              <Text style={s.footerBarText}>{money(totalDeductions)}</Text>
            </View>
          </View>
        </View>

        {/* ── Net salary pill ── */}
        <View style={s.pill}>
          <Text style={s.pillText}>Net Salary</Text>
          <Text style={s.pillText}>Rs. {money(slip.netAmount)}/-</Text>
        </View>

        {/* ── Note — absolute, pinned above the page footer ── */}
        <Text style={s.note}>
          This is a system-generated salary slip and does not require a signature
        </Text>

        {/* ── Page footer — absolute at very bottom ── */}
        <View style={s.pageFooter}>
          <WordmarkSvg />
          <Text style={s.footerRight}>
            {branding.phone}{'  |  '}{branding.supportEmail}
          </Text>
        </View>

      </Page>
    </Document>
  );
}

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  Repeat,
  BarChart3,
  Receipt,
  AlertTriangle,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetFooter } from "@/components/ui/sheet";
import { ConfirmModal } from "@/components/ui/modal";
import { DataTable, type DataTableColumn } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { formatMoney, formatAmount, parseAmount, formatOrdinalDate } from "@/lib/format";
import { CURRENCY_SYMBOL } from "@/lib/enums";
import {
  prettify,
  statusMeta,
  type AdminExpense,
  type PendingEntry,
} from "@/lib/api/admin-expenses";
import {
  useAdminExpenses,
  activeFilterCount,
  type ExpenseFilters,
} from "./use-admin-expenses";

/* Recent months for the single-month filter picker (themed Select-like chips). */
function recentMonths(count = 12): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    });
  }
  return out;
}

const FREQUENCY_OPTIONS = [
  { value: "", label: "All" },
  { value: "one_time", label: "One-time" },
  { value: "recurring", label: "Recurring" },
];

export default function AdminExpensesPage() {
  const router = useRouter();
  const {
    search,
    setSearch,
    filters,
    setFilters,
    clearFilters,
    removeFilter,
    page,
    setPage,
    items,
    pagination,
    query,
    options,
    pendingEntries,
    remove,
    savePending,
  } = useAdminExpenses();

  const [filterOpen, setFilterOpen] = React.useState(false);
  const [pendingOpen, setPendingOpen] = React.useState(false);
  const [toDelete, setToDelete] = React.useState<AdminExpense | null>(null);

  const months = React.useMemo(() => recentMonths(), []);
  const categoryKeys = React.useMemo(
    () => options.data?.categories ?? options.data?.types ?? [],
    [options.data],
  );
  const activeCount = activeFilterCount(filters);

  const monthLabel = (value: string) =>
    months.find((m) => m.value === value)?.label ?? value;

  const columns: DataTableColumn<AdminExpense>[] = [
    {
      key: "name",
      header: "Name",
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{r.name}</p>
          {r.vendor && (
            <p className="truncate text-xs text-foreground-muted">{r.vendor}</p>
          )}
        </div>
      ),
    },
    {
      key: "type",
      header: "Category",
      render: (r) => (
        <span className="text-foreground-muted">{prettify(r.type)}</span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      render: (r) => (
        <span className="font-medium text-foreground">
          {formatMoney(r.amount, r.currency)}
        </span>
      ),
    },
    {
      key: "date",
      header: "Date",
      render: (r) => (
        <span className="text-foreground-muted">{formatOrdinalDate(r.date)}</span>
      ),
    },
    {
      key: "recurring",
      header: "Recurring",
      render: (r) =>
        r.is_recurring ? (
          <Badge variant="secondary">
            <Repeat className="mr-1 h-3 w-3" />
            {r.amount_type === "variable" ? "Variable" : "Fixed"}
          </Badge>
        ) : (
          <span className="text-foreground-subtle">One-time</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => {
        const meta = statusMeta(r.entry_status);
        return <Badge variant={meta.tone}>{meta.label}</Badge>;
      },
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (r) => (
        <div
          className="flex items-center justify-end"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setToDelete(r)}
            aria-label="Delete"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Company Expenses"
        description="Track and manage the company expense ledger"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => router.push("/admin/expense-analytics")}
            >
              <BarChart3 className="h-4 w-4" /> Analytics
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/admin/expense-templates")}
            >
              <Repeat className="h-4 w-4" /> Recurring
            </Button>
            <Button onClick={() => router.push("/admin/add-expense")}>
              <Plus className="h-4 w-4" /> Add Expense
            </Button>
          </div>
        }
      />

      {/* Pending variable-amount banner */}
      {pendingEntries.length > 0 && (
        <Card className="flex flex-wrap items-center gap-4 border-warning/30 bg-warning-muted/40 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-warning text-warning-foreground">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground">
              {pendingEntries.length} recurring expense
              {pendingEntries.length === 1 ? "" : "s"} need an amount
            </p>
            <p className="text-sm text-foreground-muted">
              Enter the amount for this period so they post to the ledger.
            </p>
          </div>
          <Button variant="outline" onClick={() => setPendingOpen(true)}>
            Enter amounts
          </Button>
        </Card>
      )}

      {/* Search + filter */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Input
            icon={<Search className="h-4 w-4" />}
            placeholder="Search expenses…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={() => setFilterOpen(true)}>
          <SlidersHorizontal className="h-4 w-4" /> Filters
          {activeCount > 0 && (
            <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </Button>
      </div>

      {/* Active filter chips */}
      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {filters.month && (
            <FilterChip
              label={monthLabel(filters.month)}
              onRemove={() => removeFilter({ month: "" })}
            />
          )}
          {filters.frequency && (
            <FilterChip
              label={prettify(filters.frequency)}
              onRemove={() => removeFilter({ frequency: "" })}
            />
          )}
          {filters.categories.map((c) => (
            <FilterChip
              key={c}
              label={prettify(c)}
              onRemove={() =>
                removeFilter({
                  categories: filters.categories.filter((x) => x !== c),
                })
              }
            />
          ))}
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs font-medium text-foreground-muted underline-offset-2 hover:text-foreground hover:underline"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Ledger */}
      <Card className="p-2">
        <DataTable
          columns={columns}
          data={items}
          rowKey={(r) => r.id}
          onRowClick={(r) => router.push(`/admin/add-expense?id=${r.id}`)}
          isLoading={query.isLoading && !query.data}
          empty={
            <EmptyState
              icon={Receipt}
              title="No expenses yet"
              description="Record your first company expense to build the ledger."
              action={{
                label: "Add Expense",
                onClick: () => router.push("/admin/add-expense"),
              }}
            />
          }
        />
      </Card>

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between text-sm text-foreground-muted">
          <span>
            Page {pagination.current_page} of {pagination.total_pages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.total_pages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Filter sheet */}
      <FilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        months={months}
        categories={categoryKeys}
        value={filters}
        onApply={(f) => {
          setFilters(f);
          setFilterOpen(false);
        }}
        onClear={() => {
          clearFilters();
          setFilterOpen(false);
        }}
      />

      {/* Pending amounts sheet */}
      <PendingAmountsSheet
        open={pendingOpen}
        onClose={() => setPendingOpen(false)}
        entries={pendingEntries}
        isSaving={savePending.isPending}
        onSave={(entries) =>
          savePending.mutate(entries, {
            onSuccess: () => setPendingOpen(false),
          })
        }
      />

      {/* Delete confirm */}
      <ConfirmModal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete)
            remove.mutate(toDelete.id, { onSettled: () => setToDelete(null) });
        }}
        title="Delete expense?"
        description="This expense will be permanently removed from the ledger."
        confirmLabel="Delete"
        variant="destructive"
        isLoading={remove.isPending}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Filter chip                                                         */
/* ------------------------------------------------------------------ */
function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-foreground">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="rounded-full text-foreground-muted hover:text-foreground"
        aria-label={`Remove ${label}`}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Filter sheet                                                        */
/* ------------------------------------------------------------------ */
function FilterSheet({
  open,
  onClose,
  months,
  categories,
  value,
  onApply,
  onClear,
}: {
  open: boolean;
  onClose: () => void;
  months: { value: string; label: string }[];
  categories: string[];
  value: ExpenseFilters;
  onApply: (f: ExpenseFilters) => void;
  onClear: () => void;
}) {
  const [draft, setDraft] = React.useState<ExpenseFilters>(value);

  // Sync draft when opening.
  React.useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  const toggleCategory = (key: string) =>
    setDraft((d) => ({
      ...d,
      categories: d.categories.includes(key)
        ? d.categories.filter((c) => c !== key)
        : [...d.categories, key],
    }));

  return (
    <Sheet open={open} onClose={onClose} title="Filters" size="md">
      <div className="space-y-6">
        {/* Month */}
        <div>
          <Label className="mb-2 block">Month</Label>
          <div className="flex flex-wrap gap-2">
            <ChipToggle
              active={!draft.month}
              onClick={() => setDraft((d) => ({ ...d, month: "" }))}
              label="Any"
            />
            {months.map((m) => (
              <ChipToggle
                key={m.value}
                active={draft.month === m.value}
                onClick={() => setDraft((d) => ({ ...d, month: m.value }))}
                label={m.label}
              />
            ))}
          </div>
        </div>

        {/* Frequency */}
        <div>
          <Label className="mb-2 block">Frequency</Label>
          <div className="flex flex-wrap gap-2">
            {FREQUENCY_OPTIONS.map((f) => (
              <ChipToggle
                key={f.value || "all"}
                active={draft.frequency === f.value}
                onClick={() => setDraft((d) => ({ ...d, frequency: f.value }))}
                label={f.label}
              />
            ))}
          </div>
        </div>

        {/* Categories */}
        <div>
          <Label className="mb-2 block">Categories</Label>
          {categories.length === 0 ? (
            <p className="text-sm text-foreground-muted">No categories available.</p>
          ) : (
            <div className="space-y-2.5">
              {categories.map((c) => (
                <Checkbox
                  key={c}
                  checked={draft.categories.includes(c)}
                  onChange={() => toggleCategory(c)}
                  label={prettify(c)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <SheetFooter>
        <Button variant="outline" onClick={onClear}>
          Clear
        </Button>
        <Button onClick={() => onApply(draft)}>Apply</Button>
      </SheetFooter>
    </Sheet>
  );
}

function ChipToggle({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors " +
        (active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border text-foreground-muted hover:border-border-hover hover:text-foreground")
      }
    >
      {label}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Pending amounts sheet                                               */
/* ------------------------------------------------------------------ */
function PendingAmountsSheet({
  open,
  onClose,
  entries,
  isSaving,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  entries: PendingEntry[];
  isSaving: boolean;
  onSave: (entries: { id: string; amount: number }[]) => void;
}) {
  const [amounts, setAmounts] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (open) setAmounts({});
  }, [open]);

  const filled = entries
    .map((e) => ({ id: e.id, amount: parseAmount(amounts[e.id] ?? "") }))
    .filter((e) => e.amount > 0);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Enter amounts"
      description="Set the amount for each recurring expense this period."
      size="md"
    >
      <div className="space-y-4">
        {entries.map((e) => (
          <div
            key={e.id}
            className="rounded-[var(--radius-lg)] border border-border p-4"
          >
            <p className="font-medium text-foreground">{e.name}</p>
            {(e.type || e.date) && (
              <p className="mb-3 text-xs text-foreground-muted">
                {[e.type ? prettify(e.type) : null, e.date ? formatOrdinalDate(e.date) : null]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-foreground-muted">
                {CURRENCY_SYMBOL[e.currency ?? "PKR"]}
              </span>
              <Input
                inputMode="decimal"
                placeholder="0"
                className="pl-8"
                value={amounts[e.id] ?? ""}
                onChange={(ev) => {
                  const raw = ev.target.value.replace(/[^0-9.]/g, "");
                  setAmounts((a) => ({
                    ...a,
                    [e.id]: raw ? formatAmount(parseAmount(raw)) : "",
                  }));
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <SheetFooter>
        <Button variant="outline" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button
          onClick={() => onSave(filled)}
          disabled={filled.length === 0}
          isLoading={isSaving}
        >
          Save amounts
        </Button>
      </SheetFooter>
    </Sheet>
  );
}

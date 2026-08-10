"use client";

import * as React from "react";
import {
  Wallet,
  TrendingUp,
  Boxes,
  Scale,
  Plus,
  Check,
  Trash2,
  AlertTriangle,
  Landmark,
  Info,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Tooltip } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SkeletonStats } from "@/components/ui/skeleton";
import { DataTable, type DataTableColumn } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { QueryState } from "@/components/shared/query-state";
import { StatusCard } from "@/components/shared/status-card";
import { formatAmount, formatMoney, formatOrdinalDate, monthLabel } from "@/lib/format";
import type { ExpenseCurrency } from "@/lib/enums";
import {
  ASSET_CATEGORY_LABELS,
  CASH_ACCOUNT_KIND_LABELS,
  RECEIVABLE_CADENCE_LABELS,
  RECEIVABLE_STAGE_LABELS,
  type Asset,
  type AssetCategory,
  type CashAccount,
  type Receivable,
  type ReceivableCadence,
  type ReceivableStage,
} from "@/lib/api/admin-position";
import { usePosition } from "./use-position";

const usd = (n: number) => `$${formatAmount(n)}`;

const PIPELINE_WINDOWS = [3, 6, 12];

export default function AdminPositionPage() {
  const {
    pipelineMonths,
    setPipelineMonths,
    position,
    accounts,
    receivables,
    assets,
    saveAccount,
    deleteAccount,
    saveReceivable,
    settleReceivable,
    deleteReceivable,
    createAsset,
    deleteAsset,
  } = usePosition();

  const [tab, setTab] = React.useState("accounts");
  const [editingAccount, setEditingAccount] = React.useState<CashAccount | null>(null);
  // Doubles as the modal's open flag, like editingAccount. A new row is a partial
  // carrying just the cadence, so "Add retainer" opens the form already set to monthly.
  const [editingReceivable, setEditingReceivable] =
    React.useState<Partial<Receivable> | null>(null);
  const [addingAsset, setAddingAsset] = React.useState(false);

  const allReceivables = receivables.data?.items ?? [];
  const retainers = allReceivables.filter((r) => r.cadence === "monthly");
  const oneOffs = allReceivables.filter((r) => r.cadence !== "monthly");

  const accountColumns: DataTableColumn<CashAccount>[] = [
    {
      key: "name",
      header: "Account",
      render: (a) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{a.name}</p>
          <p className="text-xs text-foreground-muted">
            {CASH_ACCOUNT_KIND_LABELS[a.kind]}
            {a.holder ? ` · ${a.holder}` : ""}
          </p>
        </div>
      ),
    },
    {
      key: "balance",
      header: "Balance",
      align: "right",
      render: (a) => (
        <div>
          <p className="font-medium text-foreground">
            {a.currency === "USD" ? usd(a.balance) : formatMoney(a.balance, a.currency)}
          </p>
          {a.currency !== "PKR" && (
            <p className="text-xs text-foreground-muted">{formatMoney(a.balance_pkr)}</p>
          )}
        </div>
      ),
    },
    {
      key: "reconciled",
      header: "Last checked",
      render: (a) =>
        a.last_reconciled_at ? (
          <span className="text-sm text-foreground-muted">
            {formatOrdinalDate(a.last_reconciled_at)}
          </span>
        ) : (
          <span className="text-sm text-foreground-subtle">Never</span>
        ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (a) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={() => setEditingAccount(a)}>
            Update balance
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => deleteAccount.mutate(a.id)}
            disabled={deleteAccount.isPending}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  // Retainers and one-offs differ in exactly one column — when the money lands. A
  // retainer has a period, a one-off has a single expected month.
  const receivableColumns = (kind: ReceivableCadence): DataTableColumn<Receivable>[] => [
    {
      key: "name",
      header: "What",
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{r.name}</p>
          {r.client && <p className="text-xs text-foreground-muted">{r.client}</p>}
        </div>
      ),
    },
    {
      key: "stage",
      header: "Stage",
      render: (r) => (
        <Badge
          variant={
            r.stage === "confirmed" ? "success" : r.stage === "pipeline" ? "muted" : "warning"
          }
        >
          {RECEIVABLE_STAGE_LABELS[r.stage]}
        </Badge>
      ),
    },
    kind === "monthly"
      ? {
          key: "period",
          header: "Runs",
          render: (r) => (
            <span className="text-sm text-foreground-muted">
              {r.start_month ? monthLabel(r.start_month) : "Already"} –{" "}
              {r.end_month ? monthLabel(r.end_month) : "open"}
            </span>
          ),
        }
      : {
          key: "expected",
          header: "Expected",
          render: (r) => (
            <span className="text-sm text-foreground-muted">
              {r.expected_month ? monthLabel(r.expected_month) : "No date"}
            </span>
          ),
        },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      render: (r) => (
        <span className="font-medium text-foreground">
          {r.currency === "USD" ? usd(r.amount) : formatMoney(r.amount, r.currency)}
          {r.cadence === "monthly" && (
            <span className="text-xs text-foreground-muted">/mo</span>
          )}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (r) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={() => setEditingReceivable(r)}>
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => settleReceivable.mutate(r.id)}
            disabled={settleReceivable.isPending}
            title="The money arrived"
          >
            <Check className="h-4 w-4" /> Received
          </Button>
          <Button variant="ghost" size="sm" onClick={() => deleteReceivable.mutate(r.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const assetColumns: DataTableColumn<Asset>[] = [
    {
      key: "name",
      header: "Asset",
      render: (a) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{a.name}</p>
          <p className="text-xs text-foreground-muted">
            {ASSET_CATEGORY_LABELS[a.category]}
            {a.assigned_to ? ` · ${a.assigned_to}` : ""}
          </p>
        </div>
      ),
    },
    { key: "quantity", header: "Qty", align: "right", render: (a) => a.quantity },
    {
      key: "value",
      header: "Value each",
      align: "right",
      render: (a) => formatMoney(a.value_pkr),
    },
    {
      key: "total",
      header: "Total",
      align: "right",
      render: (a) => (
        <span className="font-medium text-foreground">{formatMoney(a.total_value_pkr)}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (a) => (
        <Button variant="ghost" size="sm" onClick={() => deleteAsset.mutate(a.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financial position"
        description="Where the money sits, what's owed to us, and what we own"
      />

      <QueryState
        isLoading={position.isLoading}
        isError={position.isError}
        error={position.error}
        data={position.data}
        onRetry={() => position.refetch()}
        isEmpty={() => false}
        skeleton={<SkeletonStats count={4} />}
      >
        {(p) => {
          const usdAvailable =
            p.available.by_currency.find((c) => c.currency === "USD")?.total ?? 0;
          const gap = p.reconciliation.difference_pkr;
          // A gap either way means the books and the bank disagree; more than a
          // rounding error is worth chasing before trusting either number.
          const gapMatters = Math.abs(gap) > 1000;

          return (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatusCard
                  title="Available now"
                  value={usd(usdAvailable)}
                  subtitle={formatMoney(p.available.total_pkr)}
                  icon={Wallet}
                  variant="primary"
                />
                <StatusCard
                  title="Confirmed coming in"
                  value={usd(p.receivables.confirmed.total)}
                  subtitle={`${p.receivables.confirmed.count} line(s) · ${usd(
                    p.receivables.unconfirmed.total
                  )} unconfirmed`}
                  icon={TrendingUp}
                  variant="success"
                />
                <StatusCard
                  title="Assets owned"
                  value={formatMoney(p.assets.total_pkr)}
                  subtitle={`${p.assets.by_category.length} categor${
                    p.assets.by_category.length === 1 ? "y" : "ies"
                  }`}
                  icon={Boxes}
                />
                <StatusCard
                  title="Net worth"
                  value={formatMoney(p.net_worth_pkr)}
                  subtitle="Cash + confirmed + assets − custody"
                  icon={Scale}
                  variant="accent"
                />
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                <Card className="p-6 lg:col-span-2">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Pipeline</h3>
                      <p className="text-xs text-foreground-muted">
                        Forecast only — none of this touches profit until it arrives.
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {PIPELINE_WINDOWS.map((m) => (
                        <Button
                          key={m}
                          size="sm"
                          variant={m === pipelineMonths ? "default" : "outline"}
                          onClick={() => setPipelineMonths(m)}
                        >
                          {m}mo
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-foreground-muted">Recurring</p>
                      <p className="text-2xl font-bold text-foreground">
                        {usd(p.pipeline.monthly_run)}
                        <span className="text-sm font-normal text-foreground-muted">/mo</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-foreground-muted">One-off</p>
                      <p className="text-2xl font-bold text-foreground">
                        {usd(p.pipeline.one_time)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-foreground-muted">
                        Over {p.pipeline.months} months
                      </p>
                      <p className="text-2xl font-bold text-primary">
                        {usd(p.pipeline.projected)}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Landmark className="h-4 w-4" /> Books vs bank
                  </h3>
                  <p className="mb-4 text-xs text-foreground-muted">
                    Worked out two independent ways.
                  </p>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-foreground-muted">Ledger says</dt>
                      <dd className="text-foreground">
                        {formatMoney(p.reconciliation.ledger_balance_pkr)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-foreground-muted">Accounts say</dt>
                      <dd className="text-foreground">
                        {formatMoney(p.reconciliation.accounts_balance_pkr)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4 border-t border-border pt-2">
                      <dt className="font-medium text-foreground">Difference</dt>
                      <dd
                        className={
                          gapMatters ? "font-medium text-warning" : "text-foreground-muted"
                        }
                      >
                        {formatMoney(gap)}
                      </dd>
                    </div>
                  </dl>
                  {gapMatters && (
                    <p className="mt-3 flex items-start gap-2 text-xs text-foreground-muted">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                      Either a movement was never recorded, or an account balance is stale.
                    </p>
                  )}
                </Card>
              </div>
            </div>
          );
        }}
      </QueryState>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="receivables">Receivables &amp; pipeline</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "accounts" && (
        <Card className="p-0">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Cash accounts</h3>
              <p className="text-xs text-foreground-muted">
                Balances kept by hand — reconcile them against the real accounts.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() =>
                setEditingAccount({
                  id: "",
                  name: "",
                  kind: "bank",
                  currency: "USD",
                  balance: 0,
                } as CashAccount)
              }
            >
              <Plus className="h-4 w-4" /> Add account
            </Button>
          </div>
          {accounts.isLoading ? (
            <div className="p-6">
              <SkeletonStats count={3} />
            </div>
          ) : (accounts.data?.items.length ?? 0) === 0 ? (
            <EmptyState title="No accounts yet" description="Add where the money sits." />
          ) : (
            <DataTable data={accounts.data!.items} columns={accountColumns} rowKey={(a) => a.id} />
          )}
        </Card>
      )}

      {tab === "receivables" && (
        <Card className="p-0">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                Monthly retainers
                <Tooltip
                  side="right"
                  content={
                    <span className="block max-w-[16rem] text-left">
                      Only <strong>Confirmed</strong> retainers count in the Committed
                      forecast — the one you can bank on. Not confirmed and Pipeline show
                      up under Expected only.
                      <br />
                      <br />
                      A retainer is added to every month it runs, so set the period.
                      Leave the end blank for a rolling contract.
                    </span>
                  }
                >
                  <Info className="h-3.5 w-3.5 text-foreground-muted" />
                </Tooltip>
              </h3>
              <p className="text-xs text-foreground-muted">
                Recurring income. Confirm one and it lands in every month of its period,
                in the forecast and the position.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() =>
                setEditingReceivable({ cadence: "monthly", stage: "confirmed" })
              }
            >
              <Plus className="h-4 w-4" /> Add retainer
            </Button>
          </div>
          {receivables.isLoading ? (
            <div className="p-6">
              <SkeletonStats count={3} />
            </div>
          ) : retainers.length === 0 ? (
            <EmptyState
              title="No retainers"
              description="Add the recurring contracts so the forecast stops assuming nothing comes in."
              action={{
                label: "Add retainer",
                onClick: () =>
                  setEditingReceivable({ cadence: "monthly", stage: "confirmed" }),
              }}
            />
          ) : (
            <DataTable
              data={retainers}
              columns={receivableColumns("monthly")}
              rowKey={(r) => r.id}
            />
          )}
        </Card>
      )}

      {tab === "receivables" && (
        <Card className="p-0">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">One-off income</h3>
              <p className="text-xs text-foreground-muted">
                Forecast, not income. Booking the money is a separate step. An entry
                with no expected month is counted in the first month of the window.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setEditingReceivable({ cadence: "one_time", stage: "confirmed" })
              }
            >
              <Plus className="h-4 w-4" /> Add one-off
            </Button>
          </div>
          {receivables.isLoading ? (
            <div className="p-6">
              <SkeletonStats count={3} />
            </div>
          ) : oneOffs.length === 0 ? (
            <EmptyState title="Nothing expected" description="Add what's coming in." />
          ) : (
            <DataTable
              data={oneOffs}
              columns={receivableColumns("one_time")}
              rowKey={(r) => r.id}
            />
          )}
        </Card>
      )}

      {tab === "assets" && (
        <Card className="p-0">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Asset register</h3>
              <p className="text-xs text-foreground-muted">
                What the company owns. Values are your own estimate — there is no
                depreciation schedule.
              </p>
            </div>
            <Button size="sm" onClick={() => setAddingAsset(true)}>
              <Plus className="h-4 w-4" /> Add asset
            </Button>
          </div>
          {assets.isLoading ? (
            <div className="p-6">
              <SkeletonStats count={3} />
            </div>
          ) : (assets.data?.items.length ?? 0) === 0 ? (
            <EmptyState
              title="Nothing on the register"
              description="Add laptops, furniture, anything the company owns."
              action={{ label: "Add asset", onClick: () => setAddingAsset(true) }}
            />
          ) : (
            <DataTable data={assets.data!.items} columns={assetColumns} rowKey={(a) => a.id} />
          )}
        </Card>
      )}

      <AccountModal
        account={editingAccount}
        onClose={() => setEditingAccount(null)}
        onSave={async (body) => {
          await saveAccount.mutateAsync(body);
          setEditingAccount(null);
        }}
        saving={saveAccount.isPending}
      />
      <ReceivableModal
        receivable={editingReceivable}
        onClose={() => setEditingReceivable(null)}
        onSave={async (body) => {
          await saveReceivable.mutateAsync(body);
          setEditingReceivable(null);
        }}
        saving={saveReceivable.isPending}
      />
      <AssetModal
        open={addingAsset}
        onClose={() => setAddingAsset(false)}
        onSave={async (body) => {
          await createAsset.mutateAsync(body);
          setAddingAsset(false);
        }}
        saving={createAsset.isPending}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modals — small, local, and uncontrolled beyond what they need       */
/* ------------------------------------------------------------------ */

function AccountModal({
  account,
  onClose,
  onSave,
  saving,
}: {
  account: CashAccount | null;
  onClose: () => void;
  onSave: (body: Partial<CashAccount> & { name: string; id?: string }) => Promise<void>;
  saving: boolean;
}) {
  const [name, setName] = React.useState("");
  const [kind, setKind] = React.useState("bank");
  const [currency, setCurrency] = React.useState("USD");
  const [balance, setBalance] = React.useState("");

  React.useEffect(() => {
    if (!account) return;
    setName(account.name ?? "");
    setKind(account.kind ?? "bank");
    setCurrency(account.currency ?? "USD");
    setBalance(account.balance ? String(account.balance) : "");
  }, [account]);

  const editing = Boolean(account?.id);

  return (
    <Modal
      open={Boolean(account)}
      onClose={onClose}
      title={editing ? "Update balance" : "Add a cash account"}
      description="Type in what the account really holds right now."
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="acc-name">Name</Label>
          <Input
            id="acc-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Askari bank"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Type"
            value={kind}
            onChange={setKind}
            options={Object.entries(CASH_ACCOUNT_KIND_LABELS).map(([value, label]) => ({
              value,
              label,
            }))}
          />
          <Select
            label="Currency"
            value={currency}
            onChange={setCurrency}
            options={[
              { value: "USD", label: "US Dollar ($)" },
              { value: "PKR", label: "Pakistani Rupee (₨)" },
            ]}
          />
        </div>
        <div>
          <Label htmlFor="acc-balance">Balance</Label>
          <Input
            id="acc-balance"
            inputMode="decimal"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            placeholder="9870"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={saving || !name || !balance}
            onClick={() =>
              onSave({
                id: account?.id || undefined,
                name,
                kind: kind as CashAccount["kind"],
                currency: currency as CashAccount["currency"],
                balance: Number(balance.replace(/,/g, "")),
              })
            }
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function ReceivableModal({
  receivable,
  onClose,
  onSave,
  saving,
}: {
  receivable: Partial<Receivable> | null;
  onClose: () => void;
  onSave: (
    body: Partial<Receivable> & { name: string; stage: ReceivableStage; id?: string }
  ) => Promise<void>;
  saving: boolean;
}) {
  const [name, setName] = React.useState("");
  const [stage, setStage] = React.useState<ReceivableStage>("confirmed");
  const [cadence, setCadence] = React.useState<ReceivableCadence>("one_time");
  const [amount, setAmount] = React.useState("");
  const [currency, setCurrency] = React.useState<ExpenseCurrency>("USD");
  const [client, setClient] = React.useState("");
  const [expectedMonth, setExpectedMonth] = React.useState("");
  const [startMonth, setStartMonth] = React.useState("");
  const [endMonth, setEndMonth] = React.useState("");

  React.useEffect(() => {
    if (!receivable) return;
    setName(receivable.name ?? "");
    setStage(receivable.stage ?? "confirmed");
    setCadence(receivable.cadence ?? "one_time");
    setAmount(receivable.amount ? String(receivable.amount) : "");
    setCurrency(receivable.currency ?? "USD");
    setClient(receivable.client ?? "");
    setExpectedMonth(receivable.expected_month ?? "");
    setStartMonth(receivable.start_month ?? "");
    setEndMonth(receivable.end_month ?? "");
  }, [receivable]);

  const editing = Boolean(receivable?.id);
  const isRetainer = cadence === "monthly";
  // The one mistake that silently zeroes a retainer, so it is caught in the form
  // rather than bounced by the API after the user has typed everything else.
  const badPeriod = Boolean(startMonth && endMonth && endMonth < startMonth);

  return (
    <Modal
      open={Boolean(receivable)}
      onClose={onClose}
      title={
        editing
          ? isRetainer
            ? "Edit retainer"
            : "Edit expected income"
          : isRetainer
            ? "Add a retainer"
            : "Add expected income"
      }
      description="Confirmed, not confirmed, or pipeline. None of it counts as income yet."
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="rec-name">What</Label>
          <Input
            id="rec-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={isRetainer ? "Kobiton retainer" : "Kibu"}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Stage"
            value={stage}
            onChange={(v) => setStage(v as ReceivableStage)}
            options={Object.entries(RECEIVABLE_STAGE_LABELS).map(([value, label]) => ({
              value,
              label,
            }))}
          />
          <Select
            label="Cadence"
            value={cadence}
            onChange={(v) => setCadence(v as ReceivableCadence)}
            options={Object.entries(RECEIVABLE_CADENCE_LABELS).map(([value, label]) => ({
              value,
              label,
            }))}
          />
        </div>
        <p className="rounded-[var(--radius)] bg-background-secondary px-3 py-2 text-xs text-foreground-muted">
          {stage === "confirmed" ? (
            isRetainer ? (
              <>
                Confirmed retainers are counted in the <strong>Committed</strong>{" "}
                forecast — every month between the dates below.
              </>
            ) : (
              <>
                Confirmed income is counted in the <strong>Committed</strong> forecast.
              </>
            )
          ) : (
            <>
              {RECEIVABLE_STAGE_LABELS[stage]} income only shows under{" "}
              <strong>Expected</strong>. Mark it Confirmed once the contract is signed
              and it starts counting in the Committed forecast too.
            </>
          )}
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="rec-amount">Amount</Label>
            <Input
              id="rec-amount"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="10800"
            />
          </div>
          <Select
            label="Currency"
            value={currency}
            onChange={(v) => setCurrency(v as ExpenseCurrency)}
            options={[
              { value: "USD", label: "US Dollar ($)" },
              { value: "PKR", label: "Pakistani Rupee (₨)" },
            ]}
          />
          <div>
            <Label htmlFor="rec-client">Client</Label>
            <Input
              id="rec-client"
              value={client}
              onChange={(e) => setClient(e.target.value)}
            />
          </div>
        </div>
        {isRetainer ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="rec-start">Runs from</Label>
              <Input
                id="rec-start"
                type="month"
                value={startMonth}
                onChange={(e) => setStartMonth(e.target.value)}
              />
              <p className="mt-1 text-xs text-foreground-subtle">
                Blank = already running.
              </p>
            </div>
            <div>
              <Label htmlFor="rec-end">Runs until</Label>
              <Input
                id="rec-end"
                type="month"
                value={endMonth}
                onChange={(e) => setEndMonth(e.target.value)}
                error={badPeriod ? "It cannot end before it starts." : undefined}
              />
              <p className="mt-1 text-xs text-foreground-subtle">
                Blank = rolling, no agreed end.
              </p>
            </div>
          </div>
        ) : (
          <div>
            <Label htmlFor="rec-expected">Expected month</Label>
            <Input
              id="rec-expected"
              type="month"
              value={expectedMonth}
              onChange={(e) => setExpectedMonth(e.target.value)}
            />
            <p className="mt-1 text-xs text-foreground-subtle">
              Leave blank and it is counted in the first month of the forecast.
            </p>
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={saving || !name || !amount || badPeriod}
            onClick={() =>
              onSave({
                ...(receivable?.id ? { id: receivable.id } : {}),
                name,
                stage,
                cadence,
                amount: Number(amount.replace(/,/g, "")),
                currency,
                client: client || null,
                // Only the fields that mean anything for this cadence are sent; the
                // others are cleared so switching cadence can't leave a stale date
                // still steering the forecast.
                expected_month: isRetainer ? null : expectedMonth || null,
                start_month: isRetainer ? startMonth || null : null,
                end_month: isRetainer ? endMonth || null : null,
              })
            }
          >
            {saving ? "Saving…" : editing ? "Save" : "Add"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function AssetModal({
  open,
  onClose,
  onSave,
  saving,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (body: Partial<Asset> & { name: string; value: number }) => Promise<void>;
  saving: boolean;
}) {
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState<AssetCategory>("equipment");
  const [quantity, setQuantity] = React.useState("1");
  const [value, setValue] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    setName("");
    setCategory("equipment");
    setQuantity("1");
    setValue("");
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add an asset"
      description="What it's worth now, per unit. Buying it was already an expense."
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="asset-name">Name</Label>
          <Input
            id="asset-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="MacBook Pro 14&quot;"
          />
        </div>
        <Select
          label="Category"
          value={category}
          onChange={(v) => setCategory(v as AssetCategory)}
          options={Object.entries(ASSET_CATEGORY_LABELS).map(([v, label]) => ({
            value: v,
            label,
          }))}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="asset-qty">Quantity</Label>
            <Input
              id="asset-qty"
              inputMode="numeric"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="asset-value">Value each (PKR)</Label>
            <Input
              id="asset-value"
              inputMode="decimal"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="450000"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={saving || !name || !value}
            onClick={() =>
              onSave({
                name,
                category,
                quantity: Number(quantity) || 1,
                value: Number(value.replace(/,/g, "")),
                currency: "PKR",
              })
            }
          >
            {saving ? "Adding…" : "Add"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

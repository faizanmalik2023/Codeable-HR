"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, HeartHandshake, Users, Wallet, AlertTriangle, Undo2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable, type DataTableColumn } from "@/components/ui/table";
import { SkeletonStats } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { QueryState } from "@/components/shared/query-state";
import { StatusCard } from "@/components/shared/status-card";
import { formatMoney, formatOrdinalDate } from "@/lib/format";
import type { Donation } from "@/lib/api/admin-donations";
import { useDonations } from "./use-donations";

const schema = z.object({
  to: z.string().min(1, "Who is it going to?"),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((v) => Number(v.replace(/,/g, "")) > 0, "Enter an amount above zero"),
  vouched_by_name: z.string().optional(),
  date: z.string().optional(),
  note: z.string().max(500).optional(),
});
type FormValues = z.infer<typeof schema>;

export default function AdminDonationsPage() {
  const { list, summary, create, reverse, items, month } = useDonations();
  const [adding, setAdding] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { to: "", amount: "", vouched_by_name: "", note: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await create.mutateAsync({
      to: values.to,
      amount: Number(values.amount.replace(/,/g, "")),
      vouched_by_name: values.vouched_by_name || null,
      date: values.date || undefined,
      note: values.note || null,
    });
    form.reset();
    setAdding(false);
  });

  const columns: DataTableColumn<Donation>[] = [
    {
      key: "to",
      header: "Donated to",
      render: (d) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{d.to}</p>
          <p className="text-xs text-foreground-muted">{formatOrdinalDate(d.date)}</p>
        </div>
      ),
    },
    {
      key: "vouched_by",
      header: "Vouched by",
      render: (d) =>
        d.vouched_by ? (
          <div className="flex items-center gap-2">
            <span className="text-foreground">{d.vouched_by}</span>
            {d.vouched_by_id && (
              <Badge variant="muted">{d.vouched_by_employee_code ?? "staff"}</Badge>
            )}
          </div>
        ) : (
          <span className="text-foreground-subtle">Unattributed</span>
        ),
    },
    { key: "month", header: "Month", render: (d) => d.month },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      render: (d) => (
        <span
          className={
            d.reversed_at ? "text-foreground-subtle line-through" : "text-foreground"
          }
        >
          {formatMoney(d.amount_pkr)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (d) =>
        d.reversed_at ? (
          <Badge variant="muted">Reversed</Badge>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => reverse.mutate(d.id)}
            disabled={reverse.isPending}
          >
            <Undo2 className="h-4 w-4" /> Reverse
          </Button>
        ),
    },
  ];

  const s = summary.data;
  // The pool has given away more than it collected — the company covered the gap.
  const inDeficit = (s?.pool_balance ?? 0) < 0;
  const shortThisMonth =
    s && s.expected_this_month > 0 && s.month_donated < s.expected_this_month;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Donations"
        description="Where the company's giving goes, and who vouched for it"
        actions={
          <Button onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" /> Record a donation
          </Button>
        }
      />

      <QueryState
        isLoading={summary.isLoading}
        isError={summary.isError}
        error={summary.error}
        data={s}
        onRetry={() => summary.refetch()}
        isEmpty={() => false}
        skeleton={<SkeletonStats count={4} />}
      >
        {(sum) => (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatusCard
                title="Given all time"
                value={formatMoney(sum.total_donated)}
                icon={HeartHandshake}
                variant="primary"
              />
              <StatusCard
                title={`Given in ${sum.month}`}
                value={formatMoney(sum.month_donated)}
                subtitle={
                  sum.expected_this_month > 0
                    ? `${formatMoney(sum.expected_this_month)} committed`
                    : undefined
                }
                icon={Wallet}
                variant={shortThisMonth ? "warning" : "default"}
              />
              <StatusCard
                title="Left in the giving pool"
                value={formatMoney(sum.pool_balance)}
                subtitle="Collected from profit, not yet given"
                icon={Wallet}
                variant={inDeficit ? "warning" : "success"}
              />
              <StatusCard
                title="Recipients"
                value={String(sum.by_recipient.length)}
                subtitle={`${sum.by_voucher.length} voucher(s)`}
                icon={Users}
              />
            </div>

            {inDeficit && (
              <Card className="flex items-start gap-3 border-warning/30 bg-warning-muted/40 p-4">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
                <div className="text-sm">
                  <p className="font-medium text-foreground">
                    Giving has outrun the pool by {formatMoney(Math.abs(sum.pool_balance))}
                  </p>
                  <p className="text-foreground-muted">
                    The company has covered the difference out of its own funds. The pool
                    refills as future months&apos; profit is distributed.
                  </p>
                </div>
              </Card>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="p-6">
                <h3 className="mb-4 text-sm font-semibold text-foreground">
                  Where it goes
                </h3>
                {sum.by_recipient.length === 0 ? (
                  <p className="text-sm text-foreground-muted">Nothing recorded yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {sum.by_recipient.map((r) => (
                      <li key={r.to} className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {r.to}
                          </p>
                          <p className="text-xs text-foreground-muted">
                            {r.count} gift{r.count === 1 ? "" : "s"}
                            {r.vouchers.length > 0 && ` · ${r.vouchers.join(", ")}`}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-medium text-foreground">
                          {formatMoney(r.total)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              <Card className="p-6">
                <h3 className="mb-4 text-sm font-semibold text-foreground">
                  Who vouched for it
                </h3>
                {sum.by_voucher.length === 0 ? (
                  <p className="text-sm text-foreground-muted">Nothing recorded yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {sum.by_voucher.map((v) => (
                      <li
                        key={v.vouched_by}
                        className="flex items-center justify-between gap-4"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {v.vouched_by}
                          </p>
                          <p className="truncate text-xs text-foreground-muted">
                            {v.recipients.join(", ")}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-medium text-foreground">
                          {formatMoney(v.total)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          </div>
        )}
      </QueryState>

      <Card className="p-0">
        <div className="border-b border-border px-6 py-4">
          <h3 className="text-sm font-semibold text-foreground">The ledger</h3>
          <p className="text-xs text-foreground-muted">
            Every gift, newest first. Donations draw down the giving pool — they never
            move the treasury balance a second time.
          </p>
        </div>
        {list.isLoading ? (
          <div className="p-6">
            <SkeletonStats count={3} />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title="No donations recorded"
            description={
              month
                ? `Nothing was given in ${month}.`
                : "Record the first one to start the ledger."
            }
            action={{ label: "Record a donation", onClick: () => setAdding(true) }}
          />
        ) : (
          <DataTable data={items} columns={columns} rowKey={(d) => d.id} />
        )}
      </Card>

      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title="Record a donation"
        description="Money already given. It draws down the giving pool rather than the treasury."
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="to">Donated to</Label>
            <Input id="to" placeholder="Old-age home" {...form.register("to")} />
            {form.formState.errors.to && (
              <p className="mt-1 text-xs text-danger">
                {form.formState.errors.to.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="amount">Amount (PKR)</Label>
            <Input id="amount" inputMode="decimal" placeholder="15,000" {...form.register("amount")} />
            {form.formState.errors.amount && (
              <p className="mt-1 text-xs text-danger">
                {form.formState.errors.amount.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="vouched_by_name">Vouched by</Label>
            <Input
              id="vouched_by_name"
              placeholder="Arham"
              {...form.register("vouched_by_name")}
            />
            <p className="mt-1 text-xs text-foreground-subtle">
              Who stands behind this one. Leave blank if nobody does.
            </p>
          </div>
          <div>
            <Label htmlFor="note">Note</Label>
            <Textarea id="note" rows={2} {...form.register("note")} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "Recording…" : "Record"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

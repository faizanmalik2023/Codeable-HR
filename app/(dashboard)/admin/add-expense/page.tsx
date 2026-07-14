"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Delete,
  Paperclip,
  Repeat,
  X,
  Loader2,
  FileText,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils";
import { toWireDate, formatMoney } from "@/lib/format";
import { CURRENCY_SYMBOL, type ExpenseCurrency } from "@/lib/enums";
import { uploadFile } from "@/lib/api/uploads";
import { prettify, type ExpenseBody } from "@/lib/api/admin-expenses";
import { useAddExpense } from "./use-add-expense";

/* ------------------------------------------------------------------ */
/* Schema                                                              */
/* ------------------------------------------------------------------ */
const schema = z.object({
  amount: z.number().positive("Enter an amount greater than 0").max(999_999_999_999),
  currency: z.enum(["PKR", "USD"]),
  type: z.string().min(1, "Select a category"),
  frequency: z.enum(["one_time", "recurring"]),
  recurringType: z.enum(["fixed", "variable"]),
  name: z.string().min(1, "Expense name is required"),
  date: z.string().min(1, "Select a date"),
  reimburse_to_employee_code: z.string().optional(),
  item: z.string().min(1, "Item is required"),
  vendor: z.string().optional(),
  description: z.string().max(1000, "Keep it under 1000 characters").optional(),
  payment_method: z.string().optional(),
  attachment: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

const STEPS = ["Amount", "Category", "Details", "More details", "Review"] as const;
const STEP_FIELDS: (keyof FormValues)[][] = [
  ["amount", "currency"],
  ["type", "frequency", "recurringType"],
  ["name", "date", "reimburse_to_employee_code"],
  ["item", "vendor", "description", "payment_method", "attachment"],
  [],
];

/* Grouped display of the raw keypad string. */
function groupDisplay(s: string): string {
  if (!s) return "0";
  const [int, dec] = s.split(".");
  const gi = Number(int || "0").toLocaleString("en-US");
  return s.includes(".") ? `${gi}.${dec ?? ""}` : gi;
}

/* Append/backspace on the raw amount string with limits (12 int, 2 dec). */
function pushKey(cur: string, key: string): string {
  if (key === "back") return cur.slice(0, -1);
  if (key === ".") {
    if (cur.includes(".")) return cur;
    return cur === "" ? "0." : cur + ".";
  }
  const next = cur + key;
  const [int, dec] = next.split(".");
  if ((int ?? "").replace(/^0+(?=\d)/, "").length > 12) return cur;
  if (dec !== undefined && dec.length > 2) return cur;
  return next.replace(/^0+(?=\d)/, "");
}

export default function AddExpensePage() {
  const {
    isEditing,
    editing,
    categoryOptions,
    paymentOptions,
    employeeOptions,
    create,
    update,
  } = useAddExpense();

  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [amountStr, setAmountStr] = React.useState("");
  const [uploading, setUploading] = React.useState(false);

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: 0,
      currency: "PKR",
      type: "",
      frequency: "one_time",
      recurringType: "fixed",
      name: "",
      date: toWireDate(new Date()),
      reimburse_to_employee_code: "",
      item: "",
      vendor: "",
      description: "",
      payment_method: "",
      attachment: "",
    },
  });

  // Prefill in edit mode.
  React.useEffect(() => {
    const d = editing.data;
    if (!d) return;
    const frequency = d.is_recurring ? "recurring" : "one_time";
    const recurringType =
      d.amount_type === "variable" ? "variable" : "fixed";
    reset({
      amount: d.amount ?? 0,
      currency: (d.currency as ExpenseCurrency) ?? "PKR",
      type: d.type ?? "",
      frequency,
      recurringType,
      name: d.name ?? "",
      date: d.date ?? toWireDate(new Date()),
      reimburse_to_employee_code: d.reimburse_to_employee_code ?? "",
      item: d.item ?? "",
      vendor: d.vendor ?? "",
      description: d.description ?? "",
      payment_method: d.payment_method ?? "",
      attachment: d.attachment ?? "",
    });
    setAmountStr(d.amount ? String(d.amount) : "");
  }, [editing.data, reset]);

  const values = watch();
  const pending = create.isPending || update.isPending;
  const isLast = step === STEPS.length - 1;

  const toBody = (v: FormValues): ExpenseBody => ({
    name: v.name,
    type: v.type,
    amount: v.amount,
    item: v.item,
    date: v.date,
    payment_method: v.payment_method || undefined,
    vendor: v.vendor || undefined,
    description: v.description || undefined,
    is_recurring: v.frequency === "recurring",
    amount_type: v.frequency === "one_time" ? "one_time" : v.recurringType,
    reimburse_to_employee_code: v.reimburse_to_employee_code || undefined,
    attachment: v.attachment || undefined,
    currency: v.currency,
  });

  const onSubmit = handleSubmit((v) =>
    (isEditing ? update : create).mutate(toBody(v)),
  );

  const next = async () => {
    const ok = await trigger(STEP_FIELDS[step]);
    if (ok) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const setAmount = (raw: string) => {
    setAmountStr(raw);
    setValue("amount", Number(raw || "0"), { shouldValidate: true });
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadFile(file, "company-expenses");
      setValue("attachment", res.url, { shouldValidate: true });
    } catch {
      // uploadFile surfaces its own errors upstream; keep the field empty.
    } finally {
      setUploading(false);
    }
  };

  if (isEditing && editing.isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-28">
      <PageHeader title={isEditing ? "Edit Expense" : "Add Expense"} back />

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                i < step
                  ? "bg-primary text-primary-foreground"
                  : i === step
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-foreground-muted",
              )}
            >
              {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 rounded-full",
                  i < step ? "bg-primary" : "bg-border",
                )}
              />
            )}
          </div>
        ))}
      </div>
      <p className="text-sm font-medium text-foreground-muted">
        Step {step + 1} of {STEPS.length} · {STEPS[step]}
      </p>

      <Card className="space-y-6 p-6">
        {/* ---------------- Step 0: Amount ---------------- */}
        {step === 0 && (
          <div className="space-y-6">
            {/* Currency toggle */}
            <Controller
              control={control}
              name="currency"
              render={({ field }) => (
                <div className="flex justify-center gap-2">
                  {(["PKR", "USD"] as ExpenseCurrency[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => field.onChange(c)}
                      className={cn(
                        "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                        field.value === c
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-foreground-muted hover:border-border-hover hover:text-foreground",
                      )}
                    >
                      {CURRENCY_SYMBOL[c]} {c}
                    </button>
                  ))}
                </div>
              )}
            />

            {/* Big amount display */}
            <div className="py-4 text-center">
              <p className="text-sm font-medium text-foreground-muted">Amount</p>
              <p className="mt-1 text-5xl font-bold tracking-tight text-foreground">
                <span className="text-foreground-muted">
                  {CURRENCY_SYMBOL[values.currency]}
                </span>
                {groupDisplay(amountStr)}
              </p>
              {errors.amount && (
                <p className="mt-2 text-xs text-destructive">{errors.amount.message}</p>
              )}
            </div>

            {/* Keypad */}
            <div className="mx-auto grid max-w-xs grid-cols-3 gap-2">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "back"].map(
                (k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setAmount(pushKey(amountStr, k))}
                    className="flex h-14 items-center justify-center rounded-[var(--radius-lg)] border border-border text-lg font-semibold text-foreground transition-colors hover:bg-secondary active:scale-95"
                  >
                    {k === "back" ? <Delete className="h-5 w-5" /> : k}
                  </button>
                ),
              )}
            </div>
          </div>
        )}

        {/* ---------------- Step 1: Category ---------------- */}
        {step === 1 && (
          <div className="space-y-6">
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <Select
                  label="Category"
                  placeholder="Select a category"
                  options={categoryOptions}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.type?.message}
                />
              )}
            />

            {/* Frequency / amount type */}
            <div>
              <Label className="mb-2 block">Frequency</Label>
              <Controller
                control={control}
                name="frequency"
                render={({ field }) => (
                  <div className="grid grid-cols-2 gap-3">
                    <FreqCard
                      active={field.value === "one_time"}
                      onClick={() => field.onChange("one_time")}
                      title="One-time"
                      description="A single, non-repeating expense"
                    />
                    <FreqCard
                      active={field.value === "recurring"}
                      onClick={() => field.onChange("recurring")}
                      title="Recurring"
                      description="Repeats on a schedule"
                      icon={<Repeat className="h-4 w-4" />}
                    />
                  </div>
                )}
              />
            </div>

            {values.frequency === "recurring" && (
              <div>
                <Label className="mb-2 block">Recurring amount</Label>
                <Controller
                  control={control}
                  name="recurringType"
                  render={({ field }) => (
                    <div className="grid grid-cols-2 gap-3">
                      <FreqCard
                        active={field.value === "fixed"}
                        onClick={() => field.onChange("fixed")}
                        title="Fixed"
                        description="Same amount every period"
                      />
                      <FreqCard
                        active={field.value === "variable"}
                        onClick={() => field.onChange("variable")}
                        title="Variable"
                        description="Amount entered each period"
                      />
                    </div>
                  )}
                />
              </div>
            )}
          </div>
        )}

        {/* ---------------- Step 2: Details ---------------- */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <Label className="mb-2 block" required>
                Expense name
              </Label>
              <Input placeholder="e.g. Office internet" {...register("name")} />
              {errors.name && (
                <p className="mt-1.5 text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label className="mb-2 block" required>
                Date
              </Label>
              <Controller
                control={control}
                name="date"
                render={({ field }) => (
                  <DatePicker
                    value={field.value ? new Date(`${field.value}T00:00:00`) : null}
                    onChange={(d) => field.onChange(d ? toWireDate(d) : "")}
                    error={errors.date?.message}
                  />
                )}
              />
            </div>

            <div>
              <Label className="mb-2 block" optional>
                Reimburse to
              </Label>
              <Controller
                control={control}
                name="reimburse_to_employee_code"
                render={({ field }) => (
                  <Select
                    placeholder="Select an employee"
                    options={employeeOptions}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
          </div>
        )}

        {/* ---------------- Step 3: More details ---------------- */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <Label className="mb-2 block" required>
                Item
              </Label>
              <Input placeholder="What was purchased?" {...register("item")} />
              {errors.item && (
                <p className="mt-1.5 text-xs text-destructive">{errors.item.message}</p>
              )}
            </div>

            <div>
              <Label className="mb-2 block" optional>
                Vendor
              </Label>
              <Input placeholder="e.g. PTCL" {...register("vendor")} />
            </div>

            <div>
              <Label className="mb-2 block" optional>
                Payment method
              </Label>
              <Controller
                control={control}
                name="payment_method"
                render={({ field }) => (
                  <Select
                    placeholder="Select a payment method"
                    options={paymentOptions}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label optional>Description</Label>
                <span
                  className={cn(
                    "text-xs",
                    (values.description?.length ?? 0) > 1000
                      ? "text-destructive"
                      : "text-foreground-subtle",
                  )}
                >
                  {values.description?.length ?? 0}/1000
                </span>
              </div>
              <Textarea rows={4} placeholder="Add any notes…" {...register("description")} />
              {errors.description && (
                <p className="mt-1.5 text-xs text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Attachment */}
            <div>
              <Label className="mb-2 block" optional>
                Invoice attachment
              </Label>
              {values.attachment ? (
                <div className="flex items-center justify-between rounded-[var(--radius-lg)] border border-border p-3">
                  <a
                    href={values.attachment}
                    target="_blank"
                    rel="noreferrer"
                    className="flex min-w-0 items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <FileText className="h-4 w-4 shrink-0" />
                    <span className="truncate">View attachment</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setValue("attachment", "")}
                    className="rounded-full p-1 text-foreground-muted hover:bg-secondary hover:text-foreground"
                    aria-label="Remove attachment"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label
                  className={cn(
                    "flex cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-border p-4 text-sm text-foreground-muted transition-colors hover:border-border-hover hover:text-foreground",
                    uploading && "pointer-events-none opacity-60",
                  )}
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Paperclip className="h-4 w-4" />
                  )}
                  {uploading ? "Uploading…" : "Upload image or PDF"}
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => onFile(e.target.files?.[0])}
                  />
                </label>
              )}
            </div>
          </div>
        )}

        {/* ---------------- Step 4: Review ---------------- */}
        {step === 4 && (
          <div className="space-y-1">
            <div className="pb-3 text-center">
              <p className="text-sm font-medium text-foreground-muted">
                {prettify(values.type) || "Uncategorized"}
              </p>
              <p className="mt-1 text-4xl font-bold text-foreground">
                {formatMoney(values.amount, values.currency)}
              </p>
              <p className="mt-1 text-sm text-foreground-muted">{values.name}</p>
            </div>
            <ReviewRow label="Category" value={prettify(values.type)} />
            <ReviewRow
              label="Frequency"
              value={
                values.frequency === "one_time"
                  ? "One-time"
                  : `Recurring · ${prettify(values.recurringType)}`
              }
            />
            <ReviewRow label="Date" value={values.date} />
            <ReviewRow label="Item" value={values.item} />
            {values.vendor && <ReviewRow label="Vendor" value={values.vendor} />}
            {values.payment_method && (
              <ReviewRow label="Payment method" value={prettify(values.payment_method)} />
            )}
            {values.reimburse_to_employee_code && (
              <ReviewRow
                label="Reimburse to"
                value={
                  employeeOptions.find(
                    (e) => e.value === values.reimburse_to_employee_code,
                  )?.label ?? values.reimburse_to_employee_code
                }
              />
            )}
            {values.description && (
              <ReviewRow label="Description" value={values.description} />
            )}
            {values.attachment && <ReviewRow label="Attachment" value="1 file" />}
          </div>
        )}
      </Card>

      {/* Sticky footer nav */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/90 backdrop-blur-sm md:pl-[240px]">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 p-4">
          {step === 0 ? (
            <Button
              variant="outline"
              onClick={() => router.push("/admin/expenses")}
              disabled={pending}
            >
              Cancel
            </Button>
          ) : (
            <Button variant="outline" onClick={back} disabled={pending}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          )}
          {isLast ? (
            <Button onClick={onSubmit} isLoading={pending}>
              <Check className="h-4 w-4" /> {isEditing ? "Save changes" : "Save expense"}
            </Button>
          ) : (
            <Button onClick={next} disabled={pending}>
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Pieces                                                              */
/* ------------------------------------------------------------------ */
function FreqCard({
  active,
  onClick,
  title,
  description,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  description: string;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-[var(--radius-lg)] border p-4 text-left transition-colors",
        active
          ? "border-primary bg-primary-muted"
          : "border-border hover:border-border-hover",
      )}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span
          className={cn(
            "font-semibold",
            active ? "text-primary" : "text-foreground",
          )}
        >
          {title}
        </span>
      </div>
      <p className="mt-1 text-xs text-foreground-muted">{description}</p>
    </button>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-2.5 last:border-0">
      <span className="text-sm text-foreground-muted">{label}</span>
      <span className="max-w-[60%] text-right text-sm font-medium text-foreground">
        {value}
      </span>
    </div>
  );
}

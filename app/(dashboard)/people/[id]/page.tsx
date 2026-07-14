"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Building2,
  Mail,
  Phone,
  TrendingUp,
  ArrowUpCircle,
  Pencil,
  UserX,
  FileText,
  Gift,
  Landmark,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Sheet, SheetFooter } from "@/components/ui/sheet";
import { ConfirmModal } from "@/components/ui/modal";
import { PageHeader } from "@/components/shared/page-header";
import { QueryState } from "@/components/shared/query-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useEnums, toOptions } from "@/lib/api/enums";
import {
  EMPLOYMENT_TYPE_LABELS,
  ROLE_LABELS,
  SALARY_REVISION_LABELS,
} from "@/lib/enums";
import { formatMoney, formatOrdinalDate, parseAmount, toWireDate } from "@/lib/format";
import { uploadFile } from "@/lib/api/uploads";
import { useEmployee } from "./use-employee";
import type { EmployeeInfo } from "@/lib/api/employees";

const STATUS_TONE: Record<string, "success" | "warning" | "muted" | "destructive"> = {
  active: "success",
  on_leave: "warning",
  probation: "warning",
  inactive: "muted",
  terminated: "destructive",
};

const statusLabel = (s: string) =>
  s.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

const labelize = (v?: string | null) =>
  v ? v.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "—";

type ActionSheet = "edit" | "promote" | "increment" | null;

export default function EmployeeDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const {
    query,
    update,
    promote,
    increment,
    deactivate,
    designationOptions,
    departmentOptions,
    managerOptions,
  } = useEmployee(id);

  const [sheet, setSheet] = React.useState<ActionSheet>(null);
  const [confirmDeactivate, setConfirmDeactivate] = React.useState(false);

  return (
    <div className="space-y-6">
      <PageHeader title="Employee" back />

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        data={query.data}
        onRetry={() => query.refetch()}
        skeleton={
          <div className="space-y-4">
            <Skeleton className="h-28" />
            <Skeleton className="h-64" />
          </div>
        }
      >
        {(employee) => (
          <div className="space-y-6">
            {/* Header */}
            <Card className="p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <Avatar
                    name={employee.full_name}
                    src={employee.avatar ?? undefined}
                    size="xl"
                    className="h-20 w-20 text-xl"
                  />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-bold text-foreground">{employee.full_name}</h2>
                      <Badge variant={STATUS_TONE[employee.status] ?? "muted"}>
                        {statusLabel(employee.status)}
                      </Badge>
                    </div>
                    <p className="text-foreground-muted">{employee.designation?.name ?? "—"}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-foreground-subtle">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5" />
                        {employee.department?.name ?? "—"}
                      </span>
                      <span className="text-xs">{employee.employee_code}</span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSheet("promote")}>
                    <TrendingUp className="h-4 w-4" /> Promote
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setSheet("increment")}>
                    <ArrowUpCircle className="h-4 w-4" /> Increment
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setSheet("edit")}>
                    <Pencil className="h-4 w-4" /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setConfirmDeactivate(true)}
                    disabled={employee.status === "inactive" || employee.status === "terminated"}
                  >
                    <UserX className="h-4 w-4" /> Deactivate
                  </Button>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Personal Info */}
              <Section title="Personal Info">
                <Field label="Full Name" value={employee.full_name} />
                <Field label="Father's Name" value={employee.father_name} />
                <Field label="Gender" value={labelize(employee.gender)} />
                <Field label="Date of Birth" value={dateOrDash(employee.dob)} />
                <Field label="CNIC" value={employee.cnic} />
                <Field label="Email" value={employee.email} icon={<Mail className="h-3.5 w-3.5" />} />
                <Field label="Personal Email" value={employee.personal_email} />
                <Field label="Phone" value={employee.phone} icon={<Phone className="h-3.5 w-3.5" />} />
                <Field label="Role" value={ROLE_LABELS[employee.role as keyof typeof ROLE_LABELS] ?? labelize(employee.role)} />
              </Section>

              {/* Employment (read-only) */}
              <Section title="Employment">
                <Field label="Designation" value={employee.designation?.name} />
                <Field label="Department" value={employee.department?.name} />
                <Field
                  label="Employment Type"
                  value={
                    EMPLOYMENT_TYPE_LABELS[
                      employee.employment?.employment_type as keyof typeof EMPLOYMENT_TYPE_LABELS
                    ] ?? labelize(employee.employment?.employment_type)
                  }
                />
                <Field label="Date of Joining" value={dateOrDash(employee.employment?.joined_at)} />
                <Field label="Manager" value={employee.manager?.full_name} />
              </Section>

              {/* Bank Details */}
              <Section title="Bank Details" icon={<Landmark className="h-4 w-4 text-foreground-muted" />}>
                <Field label="Bank Name" value={employee.bank_name} />
                <Field label="Account Number" value={employee.account_number} />
                <Field label="Payment Method" value={labelize(employee.payment_method)} />
              </Section>

              {/* Emergency Contact */}
              <Section
                title="Emergency Contact"
                icon={<ShieldAlert className="h-4 w-4 text-foreground-muted" />}
              >
                <Field label="Name" value={employee.emergency_contact?.name} />
                <Field label="Phone" value={employee.emergency_contact?.phone} />
                <Field label="Relation" value={labelize(employee.emergency_contact?.relation)} />
              </Section>
            </div>

            {/* Documents */}
            <Section title="Documents" icon={<FileText className="h-4 w-4 text-foreground-muted" />} full>
              <div className="col-span-full grid grid-cols-1 gap-4 sm:grid-cols-3">
                <DocumentImage label="CNIC Front" src={employee.cnic_front_image} />
                <DocumentImage label="CNIC Back" src={employee.cnic_back_image} />
                <DocumentLink label="Contract" href={employee.contract_document} />
              </div>
            </Section>

            {/* Salary & Promotion */}
            <SalarySection employee={employee} />

            {/* Perks */}
            <Section title="Perks" icon={<Gift className="h-4 w-4 text-foreground-muted" />} full>
              {employee.perks && employee.perks.length > 0 ? (
                <div className="col-span-full grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {employee.perks.map((perk, i) => (
                    <div key={i} className="rounded-[var(--radius)] border border-border bg-secondary/30 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-foreground">{perk.title}</p>
                        {perk.status && (
                          <Badge variant="muted" className="text-xs">
                            {labelize(perk.status)}
                          </Badge>
                        )}
                      </div>
                      {perk.description && (
                        <p className="mt-1 text-sm text-foreground-muted">{perk.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="col-span-full text-sm text-foreground-muted">No perks recorded.</p>
              )}
            </Section>

            {/* Action sheets */}
            <EditEmployeeSheet
              open={sheet === "edit"}
              onClose={() => setSheet(null)}
              employee={employee}
              designationOptions={designationOptions}
              departmentOptions={departmentOptions}
              managerOptions={managerOptions}
              isPending={update.isPending}
              onSubmit={(body) =>
                update.mutate(body, { onSuccess: () => setSheet(null) })
              }
            />

            <PromoteSheet
              open={sheet === "promote"}
              onClose={() => setSheet(null)}
              designationOptions={designationOptions}
              isPending={promote.isPending}
              onSubmit={(body) =>
                promote.mutate(body, { onSuccess: () => setSheet(null) })
              }
            />

            <IncrementSheet
              open={sheet === "increment"}
              onClose={() => setSheet(null)}
              isPending={increment.isPending}
              onSubmit={(body) =>
                increment.mutate(body, { onSuccess: () => setSheet(null) })
              }
            />

            <ConfirmModal
              open={confirmDeactivate}
              onClose={() => setConfirmDeactivate(false)}
              onConfirm={() =>
                deactivate.mutate(undefined, { onSettled: () => setConfirmDeactivate(false) })
              }
              title="Deactivate employee?"
              description={`${employee.full_name} will lose access and be marked inactive.`}
              confirmLabel="Deactivate"
              variant="destructive"
              isLoading={deactivate.isPending}
            />
          </div>
        )}
      </QueryState>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Display helpers                                                     */
/* ------------------------------------------------------------------ */

function dateOrDash(v?: string | null) {
  return v ? formatOrdinalDate(v) : "—";
}

function Section({
  title,
  icon,
  full,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card className={full ? "p-5" : "p-5"}>
      <div className="mb-4 flex items-center gap-2">
        {icon}
        <h3 className="font-semibold text-foreground">{title}</h3>
      </div>
      <div className={full ? "" : "grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2"}>
        {children}
      </div>
    </Card>
  );
}

function Field({
  label,
  value,
  icon,
}: {
  label: string;
  value?: string | null;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-0.5 text-xs font-medium uppercase tracking-wide text-foreground-muted">
        {label}
      </p>
      <p className="flex items-center gap-1.5 text-sm text-foreground">
        {icon}
        <span className="break-words">{value || "—"}</span>
      </p>
    </div>
  );
}

function DocumentImage({ label, src }: { label: string; src?: string | null }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-foreground-muted">
        {label}
      </p>
      {src ? (
        <a href={src} target="_blank" rel="noopener noreferrer" className="block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={label}
            className="h-36 w-full rounded-[var(--radius)] border border-border object-cover transition-opacity hover:opacity-90"
          />
        </a>
      ) : (
        <div className="flex h-36 w-full items-center justify-center rounded-[var(--radius)] border border-dashed border-border text-sm text-foreground-subtle">
          Not uploaded
        </div>
      )}
    </div>
  );
}

function DocumentLink({ label, href }: { label: string; href?: string | null }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-foreground-muted">
        {label}
      </p>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-36 w-full flex-col items-center justify-center gap-2 rounded-[var(--radius)] border border-border text-sm text-primary transition-colors hover:bg-secondary/40"
        >
          <FileText className="h-6 w-6" />
          View document
        </a>
      ) : (
        <div className="flex h-36 w-full items-center justify-center rounded-[var(--radius)] border border-dashed border-border text-sm text-foreground-subtle">
          Not uploaded
        </div>
      )}
    </div>
  );
}

function SalarySection({ employee }: { employee: EmployeeInfo }) {
  const components = employee.salary?.components ?? [];
  const gross = components.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const history = [...(employee.salary_history ?? [])].sort(
    (a, b) => new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime()
  );

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-foreground-muted" />
        <h3 className="font-semibold text-foreground">Salary &amp; Promotion</h3>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Breakdown */}
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-foreground-muted">
            Current Breakdown
          </p>
          {components.length > 0 ? (
            <div className="space-y-2">
              {components.map((c, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-foreground-muted">{c.label ?? labelize(c.type)}</span>
                  <span className="font-medium text-foreground">{formatMoney(c.amount)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-border pt-2 text-sm">
                <span className="font-semibold text-foreground">Gross</span>
                <span className="font-semibold text-foreground">{formatMoney(gross)}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-foreground-muted">No salary structure recorded.</p>
          )}
        </div>

        {/* History timeline */}
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-foreground-muted">
            Salary History
          </p>
          {history.length > 0 ? (
            <div className="space-y-0">
              {history.map((h, i) => (
                <div key={i} className="relative pb-5 pl-6 last:pb-0">
                  {i < history.length - 1 && (
                    <span className="absolute left-[5px] top-3 h-full w-0.5 bg-border" />
                  )}
                  <span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-foreground">{formatMoney(h.amount)}</span>
                    <Badge variant="muted" className="text-xs">
                      {SALARY_REVISION_LABELS[h.type as keyof typeof SALARY_REVISION_LABELS] ??
                        labelize(h.type)}
                    </Badge>
                  </div>
                  <p className="text-xs text-foreground-subtle">
                    {formatOrdinalDate(h.effective_date)}
                    {h.designation ? ` · ${h.designation}` : ""}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-foreground-muted">No revisions yet.</p>
          )}
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Edit sheet                                                          */
/* ------------------------------------------------------------------ */

const editSchema = z.object({
  full_name: z.string().min(1, "Name is required"),
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  phone: z.string().min(1, "Phone is required"),
  cnic: z.string().optional(),
  personal_email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  gender: z.string().optional(),
  role: z.string().optional(),
  employment_type: z.string().optional(),
  department_id: z.string().optional(),
  designation_id: z.string().optional(),
  manager_id: z.string().optional(),
  bank_name: z.string().optional(),
  account_number: z.string().optional(),
  payment_method: z.string().optional(),
  ec_name: z.string().optional(),
  ec_phone: z.string().optional(),
  ec_relation: z.string().optional(),
  dob: z.string().optional(),
  joined_at: z.string().optional(),
});
type EditValues = z.infer<typeof editSchema>;

interface Opt {
  value: string;
  label: string;
  description?: string;
}

function EditEmployeeSheet({
  open,
  onClose,
  employee,
  designationOptions,
  departmentOptions,
  managerOptions,
  isPending,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  employee: EmployeeInfo;
  designationOptions: Opt[];
  departmentOptions: Opt[];
  managerOptions: Opt[];
  isPending: boolean;
  onSubmit: (body: import("@/lib/api/employees").UpdateEmployeeBody) => void;
}) {
  const enums = useEnums();
  const genderOptions = toOptions(enums.data?.gender);
  const paymentOptions = toOptions(enums.data?.payment_method);
  const roleOptions = toOptions(enums.data?.roles, ROLE_LABELS);
  const employmentOptions = toOptions(enums.data?.employment_type, EMPLOYMENT_TYPE_LABELS);

  const { control, register, handleSubmit, reset, formState: { errors } } = useForm<EditValues>({
    resolver: zodResolver(editSchema),
  });

  React.useEffect(() => {
    if (open) {
      reset({
        full_name: employee.full_name ?? "",
        email: employee.email ?? "",
        phone: employee.phone ?? "",
        cnic: employee.cnic ?? "",
        personal_email: employee.personal_email ?? "",
        gender: employee.gender ?? "",
        role: (employee.role as string) ?? "",
        employment_type: (employee.employment?.employment_type as string) ?? "",
        department_id: employee.department?.id ?? "",
        designation_id: employee.designation?.id ?? "",
        manager_id: employee.manager?.id ?? "",
        bank_name: employee.bank_name ?? "",
        account_number: employee.account_number ?? "",
        payment_method: employee.payment_method ?? "",
        ec_name: employee.emergency_contact?.name ?? "",
        ec_phone: employee.emergency_contact?.phone ?? "",
        ec_relation: employee.emergency_contact?.relation ?? "",
        dob: employee.dob ?? "",
        joined_at: employee.employment?.joined_at ?? "",
      });
    }
  }, [open, employee, reset]);

  const submit = handleSubmit((v) => {
    onSubmit({
      full_name: v.full_name,
      email: v.email,
      phone: v.phone,
      cnic: v.cnic || undefined,
      personal_email: v.personal_email || undefined,
      gender: v.gender || undefined,
      role: v.role || undefined,
      employment_type: v.employment_type || undefined,
      department_id: v.department_id || undefined,
      designation_id: v.designation_id || undefined,
      manager_id: v.manager_id || undefined,
      bank_name: v.bank_name || undefined,
      account_number: v.account_number || undefined,
      payment_method: v.payment_method || undefined,
      dob: v.dob || undefined,
      joined_at: v.joined_at || undefined,
      emergency_contact:
        v.ec_name || v.ec_phone || v.ec_relation
          ? { name: v.ec_name ?? "", phone: v.ec_phone ?? "", relation: v.ec_relation ?? "" }
          : undefined,
    });
  });

  return (
    <Sheet open={open} onClose={onClose} title="Edit Employee" size="lg">
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label="Full Name" required error={errors.full_name?.message} {...register("full_name")} />
          <TextField label="Email" required error={errors.email?.message} {...register("email")} />
          <TextField label="Phone" required error={errors.phone?.message} {...register("phone")} />
          <TextField label="CNIC" {...register("cnic")} />
          <TextField label="Personal Email" error={errors.personal_email?.message} {...register("personal_email")} />
          <SelectField control={control} name="gender" label="Gender" options={genderOptions} />
          <SelectField control={control} name="role" label="Role" options={roleOptions} />
          <SelectField control={control} name="employment_type" label="Employment Type" options={employmentOptions} />
          <SelectField control={control} name="department_id" label="Department" options={departmentOptions} />
          <SelectField control={control} name="designation_id" label="Designation" options={designationOptions} />
          <SelectField control={control} name="manager_id" label="Manager" options={managerOptions} />
          <DateField control={control} name="dob" label="Date of Birth" />
          <DateField control={control} name="joined_at" label="Date of Joining" />
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold text-foreground">Bank Details</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField label="Bank Name" {...register("bank_name")} />
            <TextField label="Account Number" {...register("account_number")} />
            <SelectField control={control} name="payment_method" label="Payment Method" options={paymentOptions} />
          </div>
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold text-foreground">Emergency Contact</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField label="Name" {...register("ec_name")} />
            <TextField label="Phone" {...register("ec_phone")} />
            <TextField label="Relation" {...register("ec_relation")} />
          </div>
        </div>
      </div>

      <SheetFooter>
        <Button variant="outline" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button onClick={submit} isLoading={isPending}>
          Save Changes
        </Button>
      </SheetFooter>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/* Promote sheet                                                       */
/* ------------------------------------------------------------------ */

const promoteSchema = z.object({
  new_salary: z.string().min(1, "New salary is required"),
  effective_date: z.string().min(1, "Please select a date"),
  designation_id: z.string().optional(),
});
type PromoteValues = z.infer<typeof promoteSchema>;

function PromoteSheet({
  open,
  onClose,
  designationOptions,
  isPending,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  designationOptions: Opt[];
  isPending: boolean;
  onSubmit: (body: import("@/lib/api/employees").PromoteBody) => void;
}) {
  const { control, register, handleSubmit, reset, formState: { errors } } = useForm<PromoteValues>({
    resolver: zodResolver(promoteSchema),
    defaultValues: { new_salary: "", effective_date: "", designation_id: "" },
  });

  React.useEffect(() => {
    if (open) reset({ new_salary: "", effective_date: "", designation_id: "" });
  }, [open, reset]);

  const submit = handleSubmit((v) =>
    onSubmit({
      new_salary: parseAmount(v.new_salary),
      effective_date: v.effective_date,
      designation_id: v.designation_id || undefined,
    })
  );

  return (
    <Sheet open={open} onClose={onClose} title="Promote Employee" size="md">
      <div className="space-y-4">
        <TextField
          label="New Salary"
          required
          inputMode="numeric"
          placeholder="e.g. 250000"
          error={errors.new_salary?.message}
          {...register("new_salary")}
        />
        <SelectField
          control={control}
          name="designation_id"
          label="New Designation (optional)"
          options={designationOptions}
        />
        <DateField
          control={control}
          name="effective_date"
          label="Effective Date"
          required
          error={errors.effective_date?.message}
        />
      </div>
      <SheetFooter>
        <Button variant="outline" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button onClick={submit} isLoading={isPending}>
          <TrendingUp className="h-4 w-4" /> Promote
        </Button>
      </SheetFooter>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/* Increment sheet                                                     */
/* ------------------------------------------------------------------ */

const incrementSchema = z.object({
  new_salary: z.string().min(1, "New salary is required"),
  effective_date: z.string().min(1, "Please select a date"),
});
type IncrementValues = z.infer<typeof incrementSchema>;

function IncrementSheet({
  open,
  onClose,
  isPending,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  isPending: boolean;
  onSubmit: (body: import("@/lib/api/employees").IncrementBody) => void;
}) {
  const { control, register, handleSubmit, reset, formState: { errors } } = useForm<IncrementValues>({
    resolver: zodResolver(incrementSchema),
    defaultValues: { new_salary: "", effective_date: "" },
  });

  React.useEffect(() => {
    if (open) reset({ new_salary: "", effective_date: "" });
  }, [open, reset]);

  const submit = handleSubmit((v) =>
    onSubmit({ new_salary: parseAmount(v.new_salary), effective_date: v.effective_date })
  );

  return (
    <Sheet open={open} onClose={onClose} title="Salary Increment" size="md">
      <div className="space-y-4">
        <TextField
          label="New Salary"
          required
          inputMode="numeric"
          placeholder="e.g. 220000"
          error={errors.new_salary?.message}
          {...register("new_salary")}
        />
        <DateField
          control={control}
          name="effective_date"
          label="Effective Date"
          required
          error={errors.effective_date?.message}
        />
      </div>
      <SheetFooter>
        <Button variant="outline" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button onClick={submit} isLoading={isPending}>
          <ArrowUpCircle className="h-4 w-4" /> Apply Increment
        </Button>
      </SheetFooter>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/* Shared form fields                                                  */
/* ------------------------------------------------------------------ */

const TextField = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label: string; required?: boolean; error?: string }
>(({ label, required, error, ...props }, ref) => (
  <div>
    <Label className="mb-2 block" required={required}>
      {label}
    </Label>
    <Input ref={ref} error={error} {...props} />
  </div>
));
TextField.displayName = "TextField";

function SelectField({
  control,
  name,
  label,
  options,
  required,
  error,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any;
  name: string;
  label: string;
  options: Opt[];
  required?: boolean;
  error?: string;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Select
          label={label + (required ? " *" : "")}
          options={options}
          value={field.value}
          onChange={field.onChange}
          error={error}
          placeholder="Select an option"
        />
      )}
    />
  );
}

function DateField({
  control,
  name,
  label,
  required,
  error,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any;
  name: string;
  label: string;
  required?: boolean;
  error?: string;
}) {
  return (
    <div>
      <Label className="mb-2 block" required={required}>
        {label}
      </Label>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <DatePicker
            value={field.value ? new Date(field.value) : null}
            onChange={(d) => field.onChange(d ? toWireDate(d) : "")}
            error={error}
          />
        )}
      />
    </div>
  );
}

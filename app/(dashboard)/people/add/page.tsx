"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserPlus, Upload, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DatePicker } from "@/components/ui/date-picker";
import { PageHeader } from "@/components/shared/page-header";
import { useEnums, toOptions } from "@/lib/api/enums";
import { EMPLOYMENT_TYPE_LABELS, PERK_TYPE_LABELS, type PerkType } from "@/lib/enums";
import { toWireDate, parseAmount } from "@/lib/format";
import { uploadFile } from "@/lib/api/uploads";
import type {
  CreateEmployeeBody,
  CreateEmployeePerk,
} from "@/lib/api/employees";
import { useAddEmployee } from "./use-add-employee";

const schema = z.object({
  full_name: z.string().min(1, "Name is required"),
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  phone: z.string().min(1, "Phone is required"),
  cnic1: z.string().min(1, "CNIC is required"),
  cnic2: z.string().min(1, "CNIC is required"),
  cnic3: z.string().min(1, "CNIC is required"),
  dob: z.string().min(1, "Birthday is required"),
  designation_id: z.string().min(1, "Please select a position"),
  department_id: z.string().min(1, "Please select a department"),
  manager_id: z.string().optional(),
  role: z.string().min(1, "Please select a role"),
  employment_type: z.string().min(1, "Please select an employment type"),
  joined_at: z.string().optional(),
  ec_name: z.string().min(1, "Emergency contact name is required"),
  ec_phone: z.string().min(1, "Emergency contact phone is required"),
  ec_relation: z.string().optional(),
  sal_basic: z.string().min(1, "Basic salary is required"),
  sal_house_rent: z.string().optional(),
  sal_medical: z.string().optional(),
  sal_transport: z.string().optional(),
  sal_utility: z.string().optional(),
  sal_tax: z.string().optional(),
  sal_provident_fund: z.string().optional(),
  sal_insurance: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

const ROLE_OPTIONS = [
  { value: "employee", label: "Employee" },
  { value: "hr", label: "HR" },
];

/** Named salary keys accepted by createEmployeeSchema (folded into components). */
type SalaryKey =
  | "basic_salary"
  | "house_rent"
  | "medical"
  | "transport"
  | "utility"
  | "tax"
  | "provident_fund"
  | "insurance";

/** `key` is the create-body wire field name (createEmployeeSchema salaryFields). */
const SALARY_FIELDS: {
  name: keyof FormValues;
  label: string;
  key: SalaryKey;
  required?: boolean;
}[] = [
  { name: "sal_basic", label: "Basic", key: "basic_salary", required: true },
  { name: "sal_house_rent", label: "House Rent", key: "house_rent" },
  { name: "sal_medical", label: "Medical", key: "medical" },
  { name: "sal_transport", label: "Transport", key: "transport" },
  { name: "sal_utility", label: "Utility", key: "utility" },
  { name: "sal_tax", label: "Tax", key: "tax" },
  { name: "sal_provident_fund", label: "Provident Fund", key: "provident_fund" },
  { name: "sal_insurance", label: "Insurance", key: "insurance" },
];

const PERK_TYPES = Object.keys(PERK_TYPE_LABELS) as PerkType[];

interface PerkState {
  enabled: boolean;
  amount: string;
  percentage: string;
}

export default function AddEmployeePage() {
  const { create, designationOptions, departmentOptions, managerOptions } = useAddEmployee();
  const enums = useEnums();

  const employmentOptions = enums.data?.employment_type?.length
    ? toOptions(enums.data.employment_type, EMPLOYMENT_TYPE_LABELS)
    : Object.entries(EMPLOYMENT_TYPE_LABELS).map(([value, label]) => ({ value, label }));

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: "", email: "", phone: "", cnic1: "", cnic2: "", cnic3: "", dob: "",
      designation_id: "", department_id: "", manager_id: "", role: "", employment_type: "",
      joined_at: "", ec_name: "", ec_phone: "", ec_relation: "",
      sal_basic: "", sal_house_rent: "", sal_medical: "", sal_transport: "",
      sal_utility: "", sal_tax: "", sal_provident_fund: "", sal_insurance: "",
    },
  });

  // Documents (uploaded on submit)
  const [cnicFront, setCnicFront] = React.useState<File | null>(null);
  const [cnicBack, setCnicBack] = React.useState<File | null>(null);
  const [contract, setContract] = React.useState<File | null>(null);

  // Perks
  const [perks, setPerks] = React.useState<Record<string, PerkState>>(() =>
    Object.fromEntries(PERK_TYPES.map((t) => [t, { enabled: false, amount: "", percentage: "" }]))
  );
  const setPerk = (type: string, patch: Partial<PerkState>) =>
    setPerks((prev) => ({ ...prev, [type]: { ...prev[type], ...patch } }));

  const [isUploading, setIsUploading] = React.useState(false);
  const pending = isUploading || create.isPending;

  const onSubmit = handleSubmit(async (v) => {
    setIsUploading(true);
    try {
      const [frontRes, backRes, contractRes] = await Promise.all([
        cnicFront ? uploadFile(cnicFront, "cnic") : Promise.resolve(null),
        cnicBack ? uploadFile(cnicBack, "cnic") : Promise.resolve(null),
        contract ? uploadFile(contract, "contracts") : Promise.resolve(null),
      ]);

      // Named salary fields — createEmployeeSchema folds these into components server-side.
      const salaryFields: Partial<Record<SalaryKey, number>> = {};
      SALARY_FIELDS.forEach((f) => {
        const raw = (v[f.name] as string) ?? "";
        if (raw.trim()) salaryFields[f.key] = parseAmount(raw);
      });

      const perksBody: CreateEmployeePerk[] = PERK_TYPES.filter((t) => perks[t].enabled).map(
        (t) => ({
          key: t,
          enabled: true,
          amount: perks[t].amount.trim() ? parseAmount(perks[t].amount) : undefined,
          percentage: perks[t].percentage.trim() ? Number(perks[t].percentage) : undefined,
        })
      );

      const body: CreateEmployeeBody = {
        full_name: v.full_name,
        email: v.email,
        phone: v.phone,
        cnic: `${v.cnic1}-${v.cnic2}-${v.cnic3}`,
        dob: v.dob,
        designation_id: v.designation_id,
        department_id: v.department_id,
        role: v.role,
        employment_type: v.employment_type,
        joined_at: v.joined_at || undefined,
        emergency_contact: {
          name: v.ec_name,
          phone: v.ec_phone,
          relation: v.ec_relation ?? "",
        },
        cnic_front_image: frontRes?.url ?? undefined,
        cnic_back_image: backRes?.url ?? undefined,
        contract_document: contractRes?.url ?? undefined,
        ...salaryFields,
        perks: perksBody,
      };

      create.mutate(body);
    } finally {
      setIsUploading(false);
    }
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-24">
      <PageHeader title="Add Employee" description="Onboard a new team member" back />

      {/* Personal */}
      <SectionCard title="Personal">
        <TextField label="Full Name" required error={errors.full_name?.message} {...register("full_name")} />
        <TextField label="Email" required type="email" error={errors.email?.message} {...register("email")} />
        <TextField label="Phone" required error={errors.phone?.message} {...register("phone")} />
        <div>
          <Label className="mb-2 block" required>CNIC</Label>
          <div className="flex items-center gap-2">
            <Input placeholder="35202" inputMode="numeric" {...register("cnic1")} />
            <span className="text-foreground-subtle">-</span>
            <Input placeholder="1234567" inputMode="numeric" {...register("cnic2")} />
            <span className="text-foreground-subtle">-</span>
            <Input placeholder="1" inputMode="numeric" className="max-w-[64px]" {...register("cnic3")} />
          </div>
          {(errors.cnic1 || errors.cnic2 || errors.cnic3) && (
            <p className="mt-1.5 text-xs text-destructive">CNIC is required</p>
          )}
        </div>
        <DateField control={control} name="dob" label="Birthday" required error={errors.dob?.message} />
      </SectionCard>

      {/* Position & Role */}
      <SectionCard title="Position & Role">
        <SelectField control={control} name="designation_id" label="Position" required
          options={designationOptions} placeholder="Select a position" error={errors.designation_id?.message} />
        <SelectField control={control} name="department_id" label="Department" required
          options={departmentOptions} placeholder="Select a department" error={errors.department_id?.message} />
        <SelectField control={control} name="manager_id" label="Manager"
          options={managerOptions} placeholder="Select a manager" />
        <SelectField control={control} name="role" label="Role" required
          options={ROLE_OPTIONS} placeholder="Select a role" error={errors.role?.message} />
        <SelectField control={control} name="employment_type" label="Employment Type" required
          options={employmentOptions} placeholder="Select a type" error={errors.employment_type?.message} />
        <DateField control={control} name="joined_at" label="Date of Joining" />
      </SectionCard>

      {/* Emergency Contact */}
      <SectionCard title="Emergency Contact">
        <TextField label="Name" required error={errors.ec_name?.message} {...register("ec_name")} />
        <TextField label="Phone" required error={errors.ec_phone?.message} {...register("ec_phone")} />
        <TextField label="Relation" {...register("ec_relation")} />
      </SectionCard>

      {/* Documents */}
      <Card className="p-5">
        <h3 className="mb-4 font-semibold text-foreground">Documents</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FileField label="CNIC Front" accept="image/*" file={cnicFront} onChange={setCnicFront} />
          <FileField label="CNIC Back" accept="image/*" file={cnicBack} onChange={setCnicBack} />
          <FileField label="Contract (PDF)" accept="application/pdf" file={contract} onChange={setContract} />
        </div>
      </Card>

      {/* Salary Structure */}
      <Card className="p-5">
        <h3 className="mb-4 font-semibold text-foreground">Salary Structure</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {SALARY_FIELDS.map((f) => (
            <TextField
              key={f.name}
              label={f.label}
              required={f.required}
              inputMode="numeric"
              placeholder="0"
              error={f.required ? errors[f.name]?.message : undefined}
              {...register(f.name)}
            />
          ))}
        </div>
      </Card>

      {/* Perks */}
      <Card className="p-5">
        <h3 className="mb-4 font-semibold text-foreground">Perks</h3>
        <div className="space-y-3">
          {PERK_TYPES.map((t) => {
            const p = perks[t];
            return (
              <div key={t} className="rounded-[var(--radius)] border border-border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{PERK_TYPE_LABELS[t]}</span>
                  <Switch
                    checked={p.enabled}
                    onChange={(checked) => setPerk(t, { enabled: checked })}
                    aria-label={`Toggle ${PERK_TYPE_LABELS[t]}`}
                  />
                </div>
                {p.enabled && (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <Label className="mb-1.5 block text-xs">Amount</Label>
                      <Input
                        inputMode="numeric"
                        placeholder="0"
                        value={p.amount}
                        onChange={(e) => setPerk(t, { amount: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="mb-1.5 block text-xs">Percentage</Label>
                      <Input
                        inputMode="numeric"
                        placeholder="0"
                        value={p.percentage}
                        onChange={(e) => setPerk(t, { percentage: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Sticky footer */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/90 backdrop-blur-sm md:pl-[240px]">
        <div className="mx-auto flex max-w-3xl items-center justify-end gap-3 p-4">
          <Button onClick={onSubmit} isLoading={pending}>
            <UserPlus className="h-4 w-4" /> Add Employee
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Fields                                                              */
/* ------------------------------------------------------------------ */

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-5">
      <h3 className="mb-4 font-semibold text-foreground">{title}</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </Card>
  );
}

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
  placeholder,
  required,
  error,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any;
  name: string;
  label: string;
  options: { value: string; label: string; description?: string }[];
  placeholder?: string;
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
          placeholder={placeholder}
          error={error}
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

function FileField({
  label,
  accept,
  file,
  onChange,
}: {
  label: string;
  accept: string;
  file: File | null;
  onChange: (file: File | null) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  return (
    <div>
      <Label className="mb-2 block">{label}</Label>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
      {file ? (
        <div className="flex items-center justify-between gap-2 rounded-[var(--radius)] border border-border bg-secondary/30 px-3 py-2.5">
          <span className="truncate text-sm text-foreground">{file.name}</span>
          <button
            type="button"
            onClick={() => {
              onChange(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="shrink-0 rounded-full p-1 text-foreground-muted hover:bg-secondary"
            aria-label="Remove file"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-1.5 rounded-[var(--radius)] border border-dashed border-border py-6 text-sm text-foreground-muted transition-colors hover:border-border-hover hover:text-foreground"
        >
          <Upload className="h-5 w-5" />
          Upload
        </button>
      )}
    </div>
  );
}

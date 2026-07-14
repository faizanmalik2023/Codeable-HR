"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Sheet, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { employeesApi } from "@/lib/api/employees";
import { adminDeviceKeys, type AddMappingBody, type DeviceModel } from "@/lib/api/admin-devices";

const schema = z.object({
  device_id: z.string().min(1, "Select a device"),
  pin: z.string().trim().min(1, "PIN is required").max(32),
  user_id: z.string().min(1, "Select an employee"),
});
type FormValues = z.infer<typeof schema>;

interface AddMappingSheetProps {
  open: boolean;
  onClose: () => void;
  /** Fixed device (detail page). When omitted, `devices` drives a picker. */
  deviceId?: string;
  /** Devices to pick from (unmapped page). */
  devices?: DeviceModel[];
  /** Prefill the PIN field (from an unmapped punch). */
  initialPin?: string;
  /** Called with the chosen device id + mapping body. */
  onSubmit: (deviceId: string, body: AddMappingBody) => void;
  isPending?: boolean;
}

/** Reusable sheet to map a device PIN to an employee. */
export function AddMappingSheet({
  open,
  onClose,
  deviceId,
  devices,
  initialPin,
  onSubmit,
  isPending,
}: AddMappingSheetProps) {
  const pickDevice = !deviceId && !!devices;

  const employees = useQuery({
    queryKey: adminDeviceKeys.employees(),
    queryFn: () => employeesApi.list({ limit: 100 }),
    enabled: open,
    staleTime: 60_000,
  });

  const employeeOptions = React.useMemo(
    () =>
      (employees.data?.items ?? []).map((e) => ({
        value: e.id,
        label: e.full_name,
        description: e.employee_code,
      })),
    [employees.data]
  );

  const deviceOptions = React.useMemo(
    () =>
      (devices ?? []).map((d) => ({
        value: d.id,
        label: d.name,
        description: d.serial_number,
      })),
    [devices]
  );

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { device_id: "", pin: "", user_id: "" },
  });

  React.useEffect(() => {
    if (!open) return;
    reset({
      device_id: deviceId ?? "",
      pin: initialPin ?? "",
      user_id: "",
    });
  }, [open, deviceId, initialPin, reset]);

  const submit = handleSubmit((v) =>
    onSubmit(v.device_id, { pin: v.pin.trim(), user_id: v.user_id })
  );

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Add Mapping"
      description="Map a device PIN to an employee"
      size="md"
    >
      <form onSubmit={submit} className="space-y-5">
        {pickDevice && (
          <Controller
            control={control}
            name="device_id"
            render={({ field }) => (
              <Select
                label="Device"
                placeholder="Select a device"
                options={deviceOptions}
                value={field.value}
                onChange={field.onChange}
                error={errors.device_id?.message}
              />
            )}
          />
        )}

        <div>
          <Label className="mb-2 block" required>
            PIN
          </Label>
          <Input placeholder="Device PIN" error={errors.pin?.message} {...register("pin")} />
        </div>

        <Controller
          control={control}
          name="user_id"
          render={({ field }) => (
            <Select
              label="Employee"
              placeholder={employees.isFetching ? "Loading…" : "Select an employee"}
              options={employeeOptions}
              value={field.value}
              onChange={field.onChange}
              error={errors.user_id?.message}
            />
          )}
        />
        {!employees.isFetching && employeeOptions.length === 0 && (
          <p className="text-sm text-foreground-muted">No employees available.</p>
        )}

        <SheetFooter className="-mx-6 -mb-5 mt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isPending}>
            Add Mapping
          </Button>
        </SheetFooter>
      </form>
    </Sheet>
  );
}

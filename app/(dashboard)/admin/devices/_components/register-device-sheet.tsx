"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sheet, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CreateDeviceBody } from "@/lib/api/admin-devices";

const schema = z.object({
  serial_number: z.string().trim().min(1, "Serial number is required").max(64),
  name: z.string().trim().min(1, "Name is required").max(120),
  location: z.string().trim().max(120).optional(),
  model: z.string().trim().max(120).optional(),
  comm_key: z.string().trim().max(64).optional(),
});
type FormValues = z.infer<typeof schema>;

interface RegisterDeviceSheetProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (body: CreateDeviceBody) => void;
  isPending?: boolean;
}

/** Sheet to register a new biometric device. */
export function RegisterDeviceSheet({
  open,
  onClose,
  onSubmit,
  isPending,
}: RegisterDeviceSheetProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { serial_number: "", name: "", location: "", model: "", comm_key: "" },
  });

  React.useEffect(() => {
    if (open) reset({ serial_number: "", name: "", location: "", model: "", comm_key: "" });
  }, [open, reset]);

  const submit = handleSubmit((v) =>
    onSubmit({
      serial_number: v.serial_number.trim(),
      name: v.name.trim(),
      location: v.location?.trim() || undefined,
      model: v.model?.trim() || undefined,
      comm_key: v.comm_key?.trim() || undefined,
    })
  );

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Register Device"
      description="Add a biometric attendance device"
      size="md"
    >
      <form onSubmit={submit} className="space-y-5">
        <div>
          <Label className="mb-2 block" required>
            Serial number
          </Label>
          <Input
            placeholder="e.g. ZK-A1B2C3"
            error={errors.serial_number?.message}
            {...register("serial_number")}
          />
        </div>
        <div>
          <Label className="mb-2 block" required>
            Name
          </Label>
          <Input placeholder="e.g. Main Entrance" error={errors.name?.message} {...register("name")} />
        </div>
        <div>
          <Label className="mb-2 block" optional>
            Location
          </Label>
          <Input placeholder="e.g. Ground Floor" error={errors.location?.message} {...register("location")} />
        </div>
        <div>
          <Label className="mb-2 block" optional>
            Model
          </Label>
          <Input placeholder="e.g. ZKTeco K40" error={errors.model?.message} {...register("model")} />
        </div>
        <div>
          <Label className="mb-2 block" optional>
            Comm key
          </Label>
          <Input placeholder="Communication key" error={errors.comm_key?.message} {...register("comm_key")} />
        </div>

        <SheetFooter className="-mx-6 -mb-5 mt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isPending}>
            Register Device
          </Button>
        </SheetFooter>
      </form>
    </Sheet>
  );
}

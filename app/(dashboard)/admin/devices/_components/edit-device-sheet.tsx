"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sheet, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DeviceModel, UpdateDeviceBody } from "@/lib/api/admin-devices";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  location: z.string().trim().max(120).optional(),
  comm_key: z.string().trim().max(64).optional(),
});
type FormValues = z.infer<typeof schema>;

interface EditDeviceSheetProps {
  open: boolean;
  onClose: () => void;
  device: DeviceModel | undefined;
  onSubmit: (body: UpdateDeviceBody) => void;
  isPending?: boolean;
}

/** Sheet to edit a device's name / location / comm key. */
export function EditDeviceSheet({ open, onClose, device, onSubmit, isPending }: EditDeviceSheetProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", location: "", comm_key: "" },
  });

  React.useEffect(() => {
    if (!open) return;
    reset({
      name: device?.name ?? "",
      location: device?.location ?? "",
      comm_key: device?.comm_key ?? "",
    });
  }, [open, device, reset]);

  const submit = handleSubmit((v) =>
    onSubmit({
      name: v.name.trim(),
      location: v.location?.trim() || undefined,
      comm_key: v.comm_key?.trim() || undefined,
    })
  );

  return (
    <Sheet open={open} onClose={onClose} title="Edit Device" size="md">
      <form onSubmit={submit} className="space-y-5">
        <div>
          <Label className="mb-2 block" required>
            Name
          </Label>
          <Input placeholder="Device name" error={errors.name?.message} {...register("name")} />
        </div>
        <div>
          <Label className="mb-2 block" optional>
            Location
          </Label>
          <Input placeholder="Location" error={errors.location?.message} {...register("location")} />
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
            Save
          </Button>
        </SheetFooter>
      </form>
    </Sheet>
  );
}

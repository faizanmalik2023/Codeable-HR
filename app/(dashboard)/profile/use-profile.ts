"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  profileApi,
  type ProfileUpdateBody,
  type AvatarUpdate,
} from "@/lib/api/profile";
import { qk } from "@/lib/query/keys";
import { ApiRequestError } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth-store";
import type { ProfileModel } from "@/types";

const errMsg = (e: unknown, fallback: string) =>
  e instanceof ApiRequestError ? e.message : fallback;

/** Profile page hook — loads the profile and exposes the editable mutations. */
export function useProfile() {
  const qc = useQueryClient();
  const updateUser = useAuthStore((s) => s.updateUser);

  const query = useQuery({
    queryKey: qk.profile,
    queryFn: () => profileApi.get(),
  });

  const update = useMutation({
    mutationFn: (body: ProfileUpdateBody) => profileApi.update(body),
    onSuccess: (data) => {
      qc.setQueryData<ProfileModel>(qk.profile, (prev) => ({ ...prev, ...data }));
      qc.invalidateQueries({ queryKey: qk.profile });
      toast.success("Profile updated");
    },
    onError: (e) => toast.error(errMsg(e, "Couldn't update your profile")),
  });

  const syncAvatar = (res: AvatarUpdate) => {
    const avatar = "avatar" in res ? res.avatar ?? null : null;
    qc.setQueryData<ProfileModel>(qk.profile, (prev) =>
      prev ? { ...prev, avatar } : prev
    );
    updateUser({ avatar });
  };

  const uploadAvatar = useMutation({
    mutationFn: (file: File) => profileApi.uploadAvatar(file),
    onSuccess: (res) => {
      syncAvatar(res);
      toast.success("Photo updated");
    },
    onError: (e) => toast.error(errMsg(e, "Couldn't update your photo")),
  });

  const deleteAvatar = useMutation({
    mutationFn: () => profileApi.deleteAvatar(),
    onSuccess: () => {
      qc.setQueryData<ProfileModel>(qk.profile, (prev) =>
        prev ? { ...prev, avatar: null } : prev
      );
      updateUser({ avatar: null });
      toast.success("Photo removed");
    },
    onError: (e) => toast.error(errMsg(e, "Couldn't remove your photo")),
  });

  return {
    query,
    profile: query.data,
    update,
    uploadAvatar,
    deleteAvatar,
  };
}

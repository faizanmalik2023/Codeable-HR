import { api } from "@/lib/api/client";
import type {
  EmergencyContact,
  NotificationPreferences,
  ProfileModel,
} from "@/types";
import type { Language } from "@/lib/enums";

/** PATCH `/profile` — only phone + emergency contact are employee-editable. */
export interface ProfileUpdateBody {
  phone?: string;
  emergency_contact?: EmergencyContact;
}

/** PATCH `/profile/preferences` body. */
export interface PreferencesUpdateBody {
  notifications_enabled?: boolean;
  language?: Language;
}

/** Avatar mutations may echo just the new URL or the full profile. */
export type AvatarUpdate = { avatar?: string | null } | ProfileModel;

export const profileApi = {
  get: () => api.get<ProfileModel>("/profile"),

  update: (body: ProfileUpdateBody) => api.patch<ProfileModel>("/profile", body),

  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.upload<AvatarUpdate>("/profile/avatar", form);
  },

  deleteAvatar: () => api.delete<AvatarUpdate>("/profile/avatar"),

  deleteAccount: () => api.delete<void>("/profile"),

  getPreferences: () => api.get<NotificationPreferences>("/profile/preferences"),

  updatePreferences: (body: PreferencesUpdateBody) =>
    api.patch<NotificationPreferences>("/profile/preferences", body),
};

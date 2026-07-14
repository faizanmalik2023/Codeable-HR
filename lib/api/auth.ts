import { api } from "@/lib/api/client";
import type { AuthTokens, UserModel } from "@/types";

interface LoginResponse {
  user: UserModel;
  tokens: AuthTokens;
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>("/auth/login", { email, password }, { auth: false }),

  google: (id_token: string) =>
    api.post<LoginResponse>("/auth/google", { id_token }, { auth: false }),

  logout: () => api.post<void>("/auth/logout"),

  forgotPassword: (email: string) =>
    api.post<void>("/auth/forgot-password", { email }, { auth: false }),

  verifyOtp: (email: string, otp: string) =>
    api.post<{ reset_grant: string }>("/auth/verify-otp", { email, otp }, { auth: false }),

  resetPassword: (reset_grant: string, new_password: string) =>
    api.post<void>("/auth/reset-password", { reset_grant, new_password }, { auth: false }),

  changePassword: (current_password: string, new_password: string) =>
    api.post<void>("/auth/password/change", { current_password, new_password }),
};

import { api } from "@/lib/api/client";
import type { AuthTokens, UserModel } from "@/types";

interface LoginResponse {
  user: UserModel;
  tokens: AuthTokens;
}

// Google is the only way in — accounts carry no password, so the backend has no
// /auth/login, forgot-password, OTP or change-password routes to call.
export const authApi = {
  google: (id_token: string) =>
    api.post<LoginResponse>("/auth/google", { id_token }, { auth: false }),

  logout: () => api.post<void>("/auth/logout"),
};

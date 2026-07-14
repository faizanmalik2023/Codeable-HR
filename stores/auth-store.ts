import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthTokens, UserModel } from "@/types";
import { ROLE_LANDING, type UserRole } from "@/lib/enums";

export type { UserRole };

interface AuthState {
  user: UserModel | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  /** Hydration flag — true once persisted state has loaded on the client. */
  hydrated: boolean;
  setSession: (user: UserModel, tokens: AuthTokens) => void;
  setTokens: (tokens: AuthTokens) => void;
  setUser: (user: UserModel) => void;
  updateUser: (updates: Partial<UserModel>) => void;
  clear: () => void;
  setHydrated: () => void;
}

/** Role hierarchy — higher roles include lower-role permissions. */
export const roleHierarchy: Record<UserRole, number> = {
  employee: 1,
  manager: 2,
  hr: 3,
  admin: 4,
};

export const hasRole = (role: UserRole, min: UserRole): boolean =>
  roleHierarchy[role] >= roleHierarchy[min];

export const hasAnyRole = (role: UserRole, roles: UserRole[]): boolean =>
  roles.includes(role);

/** A user is a "manager" if their role is manager+ or the backend flags them. */
export const isManagerUser = (user: UserModel | null): boolean =>
  !!user && (user.is_manager === true || hasRole(user.role, "manager"));

export const landingForRole = (role: UserRole | undefined): string =>
  ROLE_LANDING[role ?? "employee"];

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      hydrated: false,
      setSession: (user, tokens) => set({ user, tokens, isAuthenticated: true }),
      setTokens: (tokens) => set({ tokens }),
      setUser: (user) => set({ user, isAuthenticated: true }),
      updateUser: (updates) =>
        set((s) => (s.user ? { user: { ...s.user, ...updates } } : {})),
      clear: () => set({ user: null, tokens: null, isAuthenticated: false }),
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "codeablehr-auth",
      partialize: (s) => ({
        user: s.user,
        tokens: s.tokens,
        isAuthenticated: s.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    }
  )
);

/** Non-hook token accessors for the HTTP client (outside React). */
export const authTokens = () => useAuthStore.getState().tokens;
export const forceLogout = () => {
  useAuthStore.getState().clear();
  if (typeof window !== "undefined") window.location.href = "/login";
};

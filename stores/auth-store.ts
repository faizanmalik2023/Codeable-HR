import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserRole = "employee" | "manager" | "hr" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department?: string;
  title?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

// Role hierarchy - higher roles include lower role permissions
export const roleHierarchy: Record<UserRole, number> = {
  employee: 1,
  manager: 2,
  hr: 3,
  admin: 4,
};

// Check if a user has at least a certain role level
export const hasRole = (userRole: UserRole, requiredRole: UserRole): boolean => {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};

// Check if user has any of the specified roles
export const hasAnyRole = (userRole: UserRole, roles: UserRole[]): boolean => {
  return roles.includes(userRole);
};

// Demo users for each role
export const demoUsers: Record<string, User> = {
  "employee@codeable.com": {
    id: "emp-001",
    name: "John Developer",
    email: "employee@codeable.com",
    role: "employee",
    department: "Engineering",
    title: "Software Developer",
  },
  "manager@codeable.com": {
    id: "mgr-001",
    name: "Sarah Manager",
    email: "manager@codeable.com",
    role: "manager",
    department: "Engineering",
    title: "Engineering Manager",
  },
  "hr@codeable.com": {
    id: "hr-001",
    name: "Emily HR",
    email: "hr@codeable.com",
    role: "hr",
    department: "Human Resources",
    title: "HR Business Partner",
  },
  "admin@codeable.com": {
    id: "admin-001",
    name: "Alex Admin",
    email: "admin@codeable.com",
    role: "admin",
    department: "IT",
    title: "System Administrator",
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: "auth-storage",
    }
  )
);

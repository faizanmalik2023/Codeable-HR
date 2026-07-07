import { create } from "zustand";
import { persist } from "zustand/middleware";

// Connection to the Codeable Ticketing backend (a separate Express API).
// Identity is a Personal Access Token (cdbl_pat_...) minted on that server;
// the backend resolves the token to a user/email and enforces feature
// access server-side, so nothing here is trust-sensitive.

export interface TicketingFeatures {
  features: string[];
  isFeatureAdmin: boolean;
  email: string | null;
}

interface TicketingState {
  pat: string | null;
  features: string[];
  isFeatureAdmin: boolean;
  email: string | null;
  featuresLoaded: boolean;
  connect: (pat: string) => void;
  disconnect: () => void;
  setFeatures: (f: TicketingFeatures) => void;
  setFeaturesLoaded: (loaded: boolean) => void;
}

export const FEATURE_SRS = "srs_generation";
export const FEATURE_VELOCITY = "velocity_stats";

export const useTicketingStore = create<TicketingState>()(
  persist(
    (set) => ({
      pat: null,
      features: [],
      isFeatureAdmin: false,
      email: null,
      featuresLoaded: false,
      connect: (pat) => set({ pat, featuresLoaded: false }),
      disconnect: () =>
        set({
          pat: null,
          features: [],
          isFeatureAdmin: false,
          email: null,
          featuresLoaded: false,
        }),
      setFeatures: (f) =>
        set({
          features: f.features,
          isFeatureAdmin: f.isFeatureAdmin,
          email: f.email,
          featuresLoaded: true,
        }),
      setFeaturesLoaded: (featuresLoaded) => set({ featuresLoaded }),
    }),
    {
      name: "ticketing-storage",
      // Only persist the token; entitlements are re-fetched each session
      partialize: (state) => ({ pat: state.pat }),
    }
  )
);

"use client";

import { useEffect } from "react";
import { useTicketingStore } from "@/stores/ticketing-store";
import { getMyFeatures } from "./client";

// Resolves the connected user's ticketing entitlements once per session.
// Safe to call from multiple components (sidebar + pages); it only
// fetches when a PAT is present and features haven't loaded yet.
export function useTicketing() {
  const store = useTicketingStore();

  useEffect(() => {
    let cancelled = false;
    if (!store.pat || store.featuresLoaded) return;
    getMyFeatures(store.pat)
      .then((data) => {
        if (!cancelled) {
          store.setFeatures({
            features: data.features || [],
            isFeatureAdmin: !!data.isFeatureAdmin,
            email: data.email || null,
          });
        }
      })
      .catch((error) => {
        console.error("Failed to resolve ticketing features:", error);
        if (!cancelled) {
          // Invalid/expired token: drop it so the connect card reappears
          if (error?.status === 401) store.disconnect();
          else store.setFeaturesLoaded(true);
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.pat, store.featuresLoaded]);

  return {
    connected: !!store.pat,
    pat: store.pat,
    features: store.features,
    isFeatureAdmin: store.isFeatureAdmin,
    email: store.email,
    featuresLoaded: store.featuresLoaded,
    disconnect: store.disconnect,
  };
}

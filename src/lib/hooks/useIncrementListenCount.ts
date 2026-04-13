"use client";

import { useRef } from "react";

interface UseIncrementListenCountOptions {
  id: string;
  type: "audio" | "playlist";
  incrementMutation: {
    mutate: (
      params: { id: string },
      options?: { onSuccess?: () => void },
    ) => void;
  };
}

/**
 * Hook to increment listen count only once within 2 hours per browser/tab
 * Uses localStorage to track last listen time
 */
export function useIncrementListenCount({
  id,
  type,
  incrementMutation,
}: UseIncrementListenCountOptions) {
  const hasIncrementedRef = useRef(false);
  const lastIdRef = useRef<string | null>(null);

  // Check if this is a new audio/playlist or if we need to reset
  const currentKey = `${type}_${id}`;
  if (lastIdRef.current !== currentKey) {
    hasIncrementedRef.current = false;
    lastIdRef.current = currentKey;
  }

  // Only attempt to increment if we haven't already done so for this item
  // Also check if we're in the browser (not SSR)
  if (!hasIncrementedRef.current && typeof window !== "undefined") {
    const storageKey = `${type}_listen_${id}`;
    const lastListenStr = localStorage.getItem(storageKey);
    const now = Date.now();
    const twoHoursInMs = 2 * 60 * 60 * 1000;

    // Check if we've listened within the last 2 hours
    if (lastListenStr) {
      const lastListen = parseInt(lastListenStr, 10);
      if (now - lastListen < twoHoursInMs) {
        // Already counted within 2 hours, don't increment
        hasIncrementedRef.current = true;
        return;
      }
    }

    // Increment the counter and update localStorage
    hasIncrementedRef.current = true; // Set immediately to prevent multiple calls
    incrementMutation.mutate(
      { id },
      {
        onSuccess: () => {
          localStorage.setItem(storageKey, now.toString());
        },
      },
    );
  }
}

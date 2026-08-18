"use client";

import { useSyncExternalStore } from "react";
import { useProgressStore } from "@/features/progress/store";

function subscribe(onChange: () => void): () => void {
  return useProgressStore.persist.onFinishHydration(onChange);
}

function getClientSnapshot(): boolean {
  return useProgressStore.persist.hasHydrated();
}

function getServerSnapshot(): boolean {
  return false;
}

export function useStoreHydrated(): boolean {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}

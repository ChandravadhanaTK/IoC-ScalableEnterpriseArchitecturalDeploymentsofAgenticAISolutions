import { useSyncExternalStore } from "react";
import { getState, subscribe } from "@/services/db";
import type { AppState } from "@/types";

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, getState, getState);
}

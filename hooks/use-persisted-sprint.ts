"use client";

import { useCallback, useSyncExternalStore } from "react";

const SPRINT_STORAGE_KEY = "jira-sprint-selected-id";
const SPRINT_EVENT = "jira-sprint-selection-change";

let storageCacheKey: string | null = null;
let cachedSnapshot: number | null = null;

function readStoredSprintId(): number | null {
  const raw = sessionStorage.getItem(SPRINT_STORAGE_KEY);
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function getSnapshot(): number | null {
  const raw = sessionStorage.getItem(SPRINT_STORAGE_KEY);
  const cacheKey = raw ?? "";
  if (storageCacheKey === cacheKey) {
    return cachedSnapshot;
  }
  storageCacheKey = cacheKey;
  cachedSnapshot = readStoredSprintId();
  return cachedSnapshot;
}

function getServerSnapshot(): number | null {
  return null;
}

function subscribe(onStoreChange: () => void) {
  const onUpdate = () => {
    storageCacheKey = null;
    onStoreChange();
  };
  window.addEventListener(SPRINT_EVENT, onUpdate);
  return () => window.removeEventListener(SPRINT_EVENT, onUpdate);
}

export function usePersistedSprintSelection() {
  const selectedSprintId = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const setSelectedSprintId = useCallback((sprintId: number | null) => {
    if (sprintId == null) {
      sessionStorage.removeItem(SPRINT_STORAGE_KEY);
    } else {
      sessionStorage.setItem(SPRINT_STORAGE_KEY, String(sprintId));
    }
    storageCacheKey = null;
    window.dispatchEvent(new Event(SPRINT_EVENT));
  }, []);

  return { selectedSprintId, setSelectedSprintId };
}

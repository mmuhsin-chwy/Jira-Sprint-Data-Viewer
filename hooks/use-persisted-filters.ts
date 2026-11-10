"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  defaultFilters,
  type TaskFiltersState,
} from "@/lib/filters";

const FILTER_STORAGE_KEY = "jira-sprint-task-filters";
const FILTER_EVENT = "jira-sprint-filters-change";

/** `null` means cache miss; otherwise matches sessionStorage raw string (including ""). */
let storageCacheKey: string | null = null;
let cachedSnapshot: TaskFiltersState = defaultFilters;

function parseStoredFilters(raw: string): TaskFiltersState {
  try {
    const parsed = JSON.parse(raw) as Partial<TaskFiltersState>;
    return {
      assignee: parsed.assignee ?? defaultFilters.assignee,
      jiraStatus: parsed.jiraStatus ?? defaultFilters.jiraStatus,
      storyPoints: parsed.storyPoints ?? defaultFilters.storyPoints,
      ticketIdSearch: parsed.ticketIdSearch ?? defaultFilters.ticketIdSearch,
      titleSearch: parsed.titleSearch ?? defaultFilters.titleSearch,
    };
  } catch {
    return defaultFilters;
  }
}

function getSnapshot(): TaskFiltersState {
  const raw = sessionStorage.getItem(FILTER_STORAGE_KEY) ?? "";
  if (storageCacheKey === raw) {
    return cachedSnapshot;
  }
  storageCacheKey = raw;
  cachedSnapshot = raw ? parseStoredFilters(raw) : defaultFilters;
  return cachedSnapshot;
}

function getServerSnapshot(): TaskFiltersState {
  return defaultFilters;
}

function subscribe(onStoreChange: () => void) {
  const onUpdate = () => {
    storageCacheKey = null;
    onStoreChange();
  };
  window.addEventListener(FILTER_EVENT, onUpdate);
  return () => window.removeEventListener(FILTER_EVENT, onUpdate);
}

export function usePersistedFilters() {
  const filters = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const setFilters = useCallback((next: TaskFiltersState) => {
    sessionStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(next));
    storageCacheKey = null;
    window.dispatchEvent(new Event(FILTER_EVENT));
  }, []);

  return { filters, setFilters };
}

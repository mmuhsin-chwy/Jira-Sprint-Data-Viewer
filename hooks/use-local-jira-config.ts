"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AppConfig } from "@/types/task";
import {
  mergeUserConfigWithDefaults,
  type UserConfigOverrides,
} from "@/lib/jira/merge-config";
import { parseProjectKeys } from "@/lib/jira/project-keys";

const STORAGE_KEY = "jira-sprint-viewer-user-config";
const CONFIG_EVENT = "jira-sprint-user-config-change";

export interface LocalConfigForm {
  jiraBaseUrl: string;
  boardId: string;
  projectKey: string;
  storyPointsFieldId: string;
}

function readOverrides(): UserConfigOverrides | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserConfigOverrides;
  } catch {
    return null;
  }
}

function overridesToForm(effective: AppConfig): LocalConfigForm {
  return {
    jiraBaseUrl: effective.jiraBaseUrl,
    boardId: effective.boardId ? String(effective.boardId) : "",
    projectKey: effective.projectKeys.join(", "),
    storyPointsFieldId: effective.storyPointsFieldId,
  };
}

function formToOverrides(form: LocalConfigForm): UserConfigOverrides {
  return {
    jiraBaseUrl: form.jiraBaseUrl.trim(),
    boardId: form.boardId ? Number(form.boardId) : null,
    projectKeys: parseProjectKeys(form.projectKey),
    storyPointsFieldId: form.storyPointsFieldId.trim(),
  };
}

export function useLocalJiraConfig() {
  const [defaults, setDefaults] = useState<Partial<AppConfig>>({});
  const [overrides, setOverrides] = useState<UserConfigOverrides | null>(() =>
    typeof window !== "undefined" ? readOverrides() : null,
  );
  const [ready, setReady] = useState(false);
  const [storageRevision, setStorageRevision] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/jira/config-defaults")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setDefaults(data.defaults ?? {});
          setReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onStorage = () => {
      setOverrides(readOverrides());
      setStorageRevision((v) => v + 1);
    };
    window.addEventListener(CONFIG_EVENT, onStorage);
    return () => window.removeEventListener(CONFIG_EVENT, onStorage);
  }, []);

  const effectiveConfig = useMemo(
    () => mergeUserConfigWithDefaults(defaults, overrides),
    [defaults, overrides],
  );

  const saveForm = useCallback((form: LocalConfigForm) => {
    const next = formToOverrides(form);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setOverrides(next);
    setStorageRevision((v) => v + 1);
    window.dispatchEvent(new Event(CONFIG_EVENT));
  }, []);

  const clearLocalOverrides = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setOverrides(null);
    setStorageRevision((v) => v + 1);
    window.dispatchEvent(new Event(CONFIG_EVENT));
  }, []);

  const formFromEffective = useMemo(
    () => overridesToForm(effectiveConfig),
    [effectiveConfig],
  );

  return {
    ready,
    defaults,
    overrides,
    effectiveConfig,
    formFromEffective,
    saveForm,
    clearLocalOverrides,
    storageRevision,
  };
}

export function getLocalConfigForReport(): UserConfigOverrides | null {
  if (typeof window === "undefined") return null;
  return readOverrides();
}

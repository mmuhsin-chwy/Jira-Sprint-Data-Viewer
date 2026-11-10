import type { JiraSessionAuth } from "@/lib/session";
import type { AppConfig } from "@/types/task";
import { parseProjectKeys } from "@/lib/jira/project-keys";
import {
  hasUserConfigOverrides,
  mergeUserConfigWithDefaults,
  type UserConfigOverrides,
} from "@/lib/jira/merge-config";

function trim(value: string | undefined): string {
  return (value ?? "").trim();
}

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/$/, "");
}

/** Jira API credentials from environment (server-only). */
export function getEnvJiraAuth(): JiraSessionAuth | null {
  const baseUrl = trim(process.env.JIRA_BASE_URL);
  const email = trim(process.env.JIRA_EMAIL);
  const token = trim(process.env.JIRA_API_TOKEN);

  if (!baseUrl || !email || !token) {
    return null;
  }

  return {
    authType: "token",
    accessToken: token,
    email,
    baseUrl: normalizeBaseUrl(baseUrl),
  };
}

export function isEnvJiraAuthConfigured(): boolean {
  return getEnvJiraAuth() !== null;
}

/** Non-secret defaults from environment (safe to expose to the browser). */
export function getEnvAppConfigPartial(): Partial<AppConfig> {
  const baseUrl = trim(process.env.JIRA_BASE_URL);
  const boardRaw = trim(process.env.JIRA_BOARD_ID);
  const projectKeys = parseProjectKeys(process.env.JIRA_PROJECT_KEY);
  const storyPointsFieldId = trim(process.env.JIRA_STORY_POINTS_FIELD);

  const partial: Partial<AppConfig> = {};

  if (baseUrl) partial.jiraBaseUrl = normalizeBaseUrl(baseUrl);
  if (boardRaw) {
    const boardId = Number(boardRaw);
    if (!Number.isNaN(boardId) && boardId > 0) {
      partial.boardId = boardId;
    }
  }
  if (projectKeys.length > 0) partial.projectKeys = projectKeys;
  if (storyPointsFieldId) partial.storyPointsFieldId = storyPointsFieldId;

  return partial;
}

export function resolveAppConfig(
  userOverrides?: UserConfigOverrides | null,
): AppConfig {
  return mergeUserConfigWithDefaults(
    getEnvAppConfigPartial(),
    userOverrides,
  );
}

export type JiraConfigSource = "env" | "local" | "mixed";

export function describeConfigSource(
  userOverrides?: UserConfigOverrides | null,
): JiraConfigSource {
  const hasEnv = Object.keys(getEnvAppConfigPartial()).length > 0;
  const hasUser = hasUserConfigOverrides(userOverrides);
  if (hasEnv && hasUser) return "mixed";
  if (hasUser) return "local";
  if (hasEnv) return "env";
  return "env";
}

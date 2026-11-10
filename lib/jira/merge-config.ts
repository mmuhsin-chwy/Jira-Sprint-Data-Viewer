import type { AppConfig } from "@/types/task";
import { parseProjectKeys } from "@/lib/jira/project-keys";

export type UserConfigOverrides = Partial<AppConfig> & {
  projectKey?: string;
};

function userDefinesProjectKeys(
  user?: UserConfigOverrides | null,
): boolean {
  if (!user) return false;
  return (
    Object.prototype.hasOwnProperty.call(user, "projectKeys") ||
    Boolean(user.projectKey?.trim())
  );
}

/** Merge browser/local overrides on top of defaults (from env via API). */
export function mergeUserConfigWithDefaults(
  defaults: Partial<AppConfig>,
  user?: UserConfigOverrides | null,
): AppConfig {
  const userBase = user?.jiraBaseUrl?.trim() ?? "";
  const userSp = user?.storyPointsFieldId?.trim() ?? "";
  const userBoard =
    user?.boardId != null && user.boardId > 0 ? user.boardId : null;

  let projectKeys: string[];
  if (userDefinesProjectKeys(user)) {
    projectKeys = user?.projectKeys ?? parseProjectKeys(user?.projectKey);
  } else {
    projectKeys = defaults.projectKeys ?? [];
  }

  return {
    jiraBaseUrl: userBase || defaults.jiraBaseUrl || "",
    boardId: userBoard ?? defaults.boardId ?? null,
    projectKeys,
    storyPointsFieldId: userSp || defaults.storyPointsFieldId || "",
  };
}

export function hasUserConfigOverrides(
  user?: UserConfigOverrides | null,
): boolean {
  if (!user) return false;
  return Boolean(
    user.jiraBaseUrl?.trim() ||
      (user.boardId != null && user.boardId > 0) ||
      user.storyPointsFieldId?.trim() ||
      userDefinesProjectKeys(user),
  );
}

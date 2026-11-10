import type { UserConfigOverrides } from "@/lib/jira/merge-config";
import { ensureJiraAuth } from "@/lib/jira/auth-refresh";
import {
  getActiveSprint,
  getBoard,
  getSprint,
} from "@/lib/jira/sprints";
import {
  fetchSprintIssues,
  getCurrentUser,
  mapIssueToTask,
} from "@/lib/jira/issues";
import { discoverStoryPointsFieldId } from "@/lib/jira/fields";
import { resolveAppConfig } from "@/lib/jira/env-config";
import { issueMatchesProjectKeys } from "@/lib/jira/project-keys";
import { isExcludedJiraStatus } from "@/lib/jira/status";
import type { SprintReportMeta, SprintTask } from "@/types/task";
import type { JiraSprint } from "@/types/jira";

export interface SprintReportResponse {
  meta: SprintReportMeta & {
    sprintId: number | null;
    currentUserAccountId: string;
  };
  tasks: SprintTask[];
}

async function resolveSprint(
  auth: Awaited<ReturnType<typeof ensureJiraAuth>>,
  boardId: number,
  sprintId?: number | null,
): Promise<JiraSprint | null> {
  if (!auth) return null;
  if (sprintId != null) {
    const sprint = await getSprint(auth, sprintId);
    if (sprint) return sprint;
  }
  return getActiveSprint(auth, boardId);
}

export async function buildSprintReport(
  userConfig?: UserConfigOverrides | null,
  sprintId?: number | null,
): Promise<
  | { ok: true; data: SprintReportResponse }
  | { ok: false; status: number; message: string }
> {
  const auth = await ensureJiraAuth();
  if (!auth) {
    return {
      ok: false,
      status: 401,
      message:
        "Not authenticated with Jira. Set JIRA_* environment variables or sign in.",
    };
  }

  const config = resolveAppConfig(userConfig);

  if (!config.boardId) {
    return {
      ok: false,
      status: 400,
      message:
        "Jira board ID is not configured. Set JIRA_BOARD_ID or update Settings (saved in this browser).",
    };
  }

  let storyPointsFieldId = config.storyPointsFieldId;
  if (!storyPointsFieldId) {
    const discovered = await discoverStoryPointsFieldId(auth);
    if (discovered) {
      storyPointsFieldId = discovered;
    }
  }

  if (!storyPointsFieldId) {
    return {
      ok: false,
      status: 400,
      message:
        "Story points field is not configured. Set JIRA_STORY_POINTS_FIELD or update Settings (saved in this browser).",
    };
  }

  const user = auth.user ?? (await getCurrentUser(auth));

  const boardId = config.boardId;
  const sprint = await resolveSprint(auth, boardId, sprintId);
  if (!sprint) {
    const label =
      sprintId != null
        ? `Sprint ${sprintId} was not found.`
        : "No active sprint found for this board.";
    return {
      ok: false,
      status: 404,
      message: label,
    };
  }

  const board = await getBoard(auth, boardId);
  let issues = await fetchSprintIssues(auth, sprint.id, storyPointsFieldId);

  if (config.projectKeys.length > 0) {
    issues = issues.filter((issue) =>
      issueMatchesProjectKeys(issue.key, config.projectKeys),
    );
  }

  issues = issues.filter(
    (issue) => !isExcludedJiraStatus(issue.fields.status.name),
  );

  const tasks: SprintTask[] = issues.map((issue) =>
    mapIssueToTask(issue, sprint.name, storyPointsFieldId, auth),
  );

  return {
    ok: true,
    data: {
      meta: {
        userDisplayName: user.displayName,
        boardName: board?.name ?? `Board ${boardId}`,
        sprintName: sprint.name,
        sprintId: sprint.id,
        sprintState: sprint.state ?? null,
        sprintStartDate: sprint.startDate ?? null,
        sprintEndDate: sprint.endDate ?? null,
        totalTasksLoaded: tasks.length,
        currentUserAccountId: user.accountId,
      },
      tasks,
    },
  };
}

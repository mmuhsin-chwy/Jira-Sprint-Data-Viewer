import { jiraJson } from "./client";
import type { JiraSessionAuth } from "@/lib/session";
import type { JiraBoard, JiraSprint } from "@/types/jira";

interface BoardListResponse {
  values: JiraBoard[];
}

interface SprintListResponse {
  values: JiraSprint[];
  startAt?: number;
  maxResults?: number;
  isLast?: boolean;
  total?: number;
}

const SPRINT_PAGE_SIZE = 50;
const ALL_SPRINT_STATES = "active,closed";

export async function listBoards(auth: JiraSessionAuth): Promise<JiraBoard[]> {
  const data = await jiraJson<BoardListResponse>(
    auth,
    "/rest/agile/1.0/board?maxResults=50",
  );
  return data.values ?? [];
}

export async function listBoardSprints(
  auth: JiraSessionAuth,
  boardId: number,
): Promise<JiraSprint[]> {
  const all: JiraSprint[] = [];
  let startAt = 0;

  while (true) {
    const data = await jiraJson<SprintListResponse>(
      auth,
      `/rest/agile/1.0/board/${boardId}/sprint?state=${ALL_SPRINT_STATES}&startAt=${startAt}&maxResults=${SPRINT_PAGE_SIZE}`,
    );
    const batch = data.values ?? [];
    all.push(...batch);

    const isLast =
      data.isLast === true ||
      batch.length === 0 ||
      (data.total != null && all.length >= data.total) ||
      batch.length < SPRINT_PAGE_SIZE;

    if (isLast) break;
    startAt += batch.length;
  }

  return all;
}

export async function getSprint(
  auth: JiraSessionAuth,
  sprintId: number,
): Promise<JiraSprint | null> {
  try {
    return await jiraJson<JiraSprint>(
      auth,
      `/rest/agile/1.0/sprint/${sprintId}`,
    );
  } catch {
    return null;
  }
}

export async function getActiveSprint(
  auth: JiraSessionAuth,
  boardId: number,
): Promise<JiraSprint | null> {
  const data = await jiraJson<SprintListResponse>(
    auth,
    `/rest/agile/1.0/board/${boardId}/sprint?state=active`,
  );
  return data.values?.[0] ?? null;
}

export async function getBoard(
  auth: JiraSessionAuth,
  boardId: number,
): Promise<JiraBoard | null> {
  try {
    return await jiraJson<JiraBoard>(auth, `/rest/agile/1.0/board/${boardId}`);
  } catch {
    return null;
  }
}

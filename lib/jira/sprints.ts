import { jiraJson } from "./client";
import type { JiraSessionAuth } from "@/lib/session";
import type { JiraBoard, JiraSprint } from "@/types/jira";

interface BoardListResponse {
  values: JiraBoard[];
}

interface SprintListResponse {
  values: JiraSprint[];
}

export async function listBoards(auth: JiraSessionAuth): Promise<JiraBoard[]> {
  const data = await jiraJson<BoardListResponse>(
    auth,
    "/rest/agile/1.0/board?maxResults=50",
  );
  return data.values ?? [];
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

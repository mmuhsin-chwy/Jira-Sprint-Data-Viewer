import { issueBrowseUrl, jiraJson } from "./client";
import type { JiraSessionAuth } from "@/lib/session";
import type { JiraIssue, JiraSprintIssuesResponse, JiraUser } from "@/types/jira";
import type { SprintTask } from "@/types/task";

export async function getCurrentUser(auth: JiraSessionAuth): Promise<JiraUser> {
  const me = await jiraJson<{
    accountId: string;
    displayName: string;
    emailAddress?: string;
  }>(auth, "/rest/api/3/myself");
  return {
    accountId: me.accountId,
    displayName: me.displayName,
    emailAddress: me.emailAddress,
  };
}

export async function fetchSprintIssues(
  auth: JiraSessionAuth,
  sprintId: number,
  storyPointsFieldId: string,
): Promise<JiraIssue[]> {
  const all: JiraIssue[] = [];
  let startAt = 0;
  const maxResults = 100;

  while (true) {
    const path = `/rest/agile/1.0/sprint/${sprintId}/issue?startAt=${startAt}&maxResults=${maxResults}&fields=summary,status,assignee,${encodeURIComponent(storyPointsFieldId)}`;
    const page = await jiraJson<JiraSprintIssuesResponse>(auth, path);
    const issues = page.issues ?? [];
    all.push(...issues);
    if (startAt + issues.length >= page.total) break;
    startAt += maxResults;
  }

  return all;
}

export function mapIssueToTask(
  issue: JiraIssue,
  sprintName: string,
  storyPointsFieldId: string,
  auth: JiraSessionAuth,
): SprintTask {
  const spRaw = issue.fields[storyPointsFieldId];
  const storyPoints =
    typeof spRaw === "number"
      ? spRaw
      : spRaw != null && !Number.isNaN(Number(spRaw))
        ? Number(spRaw)
        : null;

  return {
    issueId: issue.id,
    issueKey: issue.key,
    title: issue.fields.summary,
    assignee: issue.fields.assignee?.displayName ?? "Unassigned",
    assigneeAccountId: issue.fields.assignee?.accountId ?? null,
    status: issue.fields.status.name,
    statusCategory: issue.fields.status.statusCategory?.key ?? null,
    storyPoints,
    sprintName,
    issueUrl: issueBrowseUrl(auth, issue.key),
  };
}

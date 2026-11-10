import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/jira/auth-refresh", () => ({
  ensureJiraAuth: vi.fn(),
}));

vi.mock("@/lib/jira/sprints", () => ({
  getActiveSprint: vi.fn(),
  getSprint: vi.fn(),
  getBoard: vi.fn(),
}));

vi.mock("@/lib/jira/issues", () => ({
  fetchSprintIssues: vi.fn(),
  getCurrentUser: vi.fn(),
  mapIssueToTask: vi.fn(),
}));

vi.mock("@/lib/jira/fields", () => ({
  discoverStoryPointsFieldId: vi.fn(),
}));

vi.mock("@/lib/jira/env-config", () => ({
  resolveAppConfig: vi.fn(),
}));

import { buildSprintReport } from "./sprint-report";
import { ensureJiraAuth } from "@/lib/jira/auth-refresh";
import { getActiveSprint, getBoard, getSprint } from "@/lib/jira/sprints";
import { fetchSprintIssues, mapIssueToTask } from "@/lib/jira/issues";
import { resolveAppConfig } from "@/lib/jira/env-config";

describe("buildSprintReport", () => {
  beforeEach(() => {
    vi.mocked(getActiveSprint).mockReset();
    vi.mocked(getSprint).mockReset();
    vi.mocked(ensureJiraAuth).mockResolvedValue({
      authType: "token",
      accessToken: "t",
      user: { accountId: "u1", displayName: "User" },
    });
    vi.mocked(resolveAppConfig).mockReturnValue({
      jiraBaseUrl: "https://x.atlassian.net",
      boardId: 1,
      projectKeys: [],
      storyPointsFieldId: "customfield_1",
    });
    vi.mocked(getBoard).mockResolvedValue({
      id: 1,
      name: "Board",
      type: "scrum",
    });
    vi.mocked(fetchSprintIssues).mockResolvedValue([]);
    vi.mocked(mapIssueToTask).mockReturnValue({
      issueId: "1",
      issueKey: "P-1",
      title: "Task",
      assignee: "A",
      assigneeAccountId: null,
      status: "Open",
      statusCategory: null,
      storyPoints: null,
      sprintName: "S1",
      issueUrl: "https://x",
    });
  });

  it("uses active sprint when no sprintId", async () => {
    vi.mocked(getActiveSprint).mockResolvedValue({
      id: 10,
      name: "Active",
      state: "active",
    });
    const result = await buildSprintReport();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.meta.sprintId).toBe(10);
    }
    expect(getSprint).not.toHaveBeenCalled();
    expect(fetchSprintIssues).toHaveBeenCalledWith(
      expect.anything(),
      10,
      "customfield_1",
    );
  });

  it("loads closed sprint when sprintId provided", async () => {
    vi.mocked(getSprint).mockResolvedValue({
      id: 20,
      name: "Closed",
      state: "closed",
    });
    const result = await buildSprintReport(undefined, 20);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.meta.sprintState).toBe("closed");
    }
    expect(getActiveSprint).not.toHaveBeenCalled();
    expect(fetchSprintIssues).toHaveBeenCalledWith(
      expect.anything(),
      20,
      "customfield_1",
    );
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(ensureJiraAuth).mockResolvedValue(null);
    const result = await buildSprintReport();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(401);
  });

  it("returns empty tasks for empty sprint", async () => {
    vi.mocked(getSprint).mockResolvedValue({
      id: 30,
      name: "Empty",
      state: "future",
    });
    vi.mocked(fetchSprintIssues).mockResolvedValue([]);
    const result = await buildSprintReport(undefined, 30);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.tasks).toHaveLength(0);
      expect(result.data.meta.totalTasksLoaded).toBe(0);
    }
  });
});

import type { SprintPullRequest } from "@/types/github";
import type { SprintTask } from "@/types/task";
import { formatPullRequestsForExport } from "./pr-export";

export interface ExportRow {
  issueKey: string;
  title: string;
  assignee: string;
  status: string;
  storyPoints: string;
  sprintName: string;
  pullRequestSummary: string;
  pullRequestLinks: string;
  issueUrl: string;
}

const HEADERS: (keyof ExportRow)[] = [
  "issueKey",
  "title",
  "assignee",
  "status",
  "storyPoints",
  "sprintName",
  "pullRequestSummary",
  "pullRequestLinks",
  "issueUrl",
];

const HEADER_LABELS: Record<keyof ExportRow, string> = {
  issueKey: "Jira Ticket ID",
  title: "Jira Ticket Title",
  assignee: "Assignee",
  status: "Jira Status",
  storyPoints: "Story Points",
  sprintName: "Sprint",
  pullRequestSummary: "GitHub PRs",
  pullRequestLinks: "GitHub PR Links",
  issueUrl: "Jira URL",
};

function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function tasksToExportRows(
  tasks: SprintTask[],
  pullRequestsByTicket?: Record<string, SprintPullRequest[]>,
): ExportRow[] {
  return tasks.map((task) => {
    const pr = formatPullRequestsForExport(
      pullRequestsByTicket?.[task.issueKey],
    );
    return {
      issueKey: task.issueKey,
      title: task.title,
      assignee: task.assignee,
      status: task.status,
      storyPoints: task.storyPoints?.toString() ?? "",
      sprintName: task.sprintName,
      pullRequestSummary: pr.pullRequestSummary,
      pullRequestLinks: pr.pullRequestLinks,
      issueUrl: task.issueUrl,
    };
  });
}

export function buildCsv(
  tasks: SprintTask[],
  pullRequestsByTicket?: Record<string, SprintPullRequest[]>,
): string {
  const rows = tasksToExportRows(tasks, pullRequestsByTicket);
  const lines = [
    HEADERS.map((h) => HEADER_LABELS[h]).join(","),
    ...rows.map((row) =>
      HEADERS.map((h) => escapeCsv(row[h])).join(","),
    ),
  ];
  return lines.join("\n");
}

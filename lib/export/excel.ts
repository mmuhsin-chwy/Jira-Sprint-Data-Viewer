import ExcelJS from "exceljs";
import type { SprintPullRequest } from "@/types/github";
import type { SprintTask } from "@/types/task";
import { tasksToExportRows } from "./csv";

const HEADER_LABELS = [
  "Jira Ticket ID",
  "Jira Ticket Title",
  "Assignee",
  "Jira Status",
  "Story Points",
  "Sprint",
  "GitHub PRs",
  "GitHub PR Links",
  "Jira URL",
];

function applyHyperlinkCell(cell: ExcelJS.Cell, url: string) {
  cell.value = { text: url, hyperlink: url };
  cell.font = { color: { argb: "FF0563C1" }, underline: true };
}

export async function buildExcelBuffer(
  tasks: SprintTask[],
  pullRequestsByTicket?: Record<string, SprintPullRequest[]>,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Sprint Report");

  sheet.addRow(HEADER_LABELS);
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };

  const rows = tasksToExportRows(tasks, pullRequestsByTicket);
  for (const row of rows) {
    const added = sheet.addRow([
      row.issueKey,
      row.title,
      row.assignee,
      row.status,
      row.storyPoints,
      row.sprintName,
      row.pullRequestSummary,
      row.pullRequestLinks,
      row.issueUrl,
    ]);
    const prLinksCell = added.getCell(8);
    const firstPrUrl = row.pullRequestLinks.split(" | ")[0]?.trim();
    if (firstPrUrl && !row.pullRequestLinks.includes(" | ")) {
      applyHyperlinkCell(prLinksCell, firstPrUrl);
    }
    const jiraUrlCell = added.getCell(9);
    if (row.issueUrl) {
      applyHyperlinkCell(jiraUrlCell, row.issueUrl);
    }
  }

  sheet.columns.forEach((col) => {
    col.width = 18;
  });
  sheet.getColumn(2).width = 40;
  sheet.getColumn(7).width = 28;
  sheet.getColumn(8).width = 52;
  sheet.getColumn(9).width = 48;

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

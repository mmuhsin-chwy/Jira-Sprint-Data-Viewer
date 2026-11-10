import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { buildCsv } from "@/lib/export/csv";
import type { SprintPullRequest } from "@/types/github";
import type { SprintTask } from "@/types/task";
import { reportFilenameDate } from "@/lib/date-utils";

const sprintPullRequestSchema = z.object({
  number: z.number(),
  title: z.string(),
  url: z.string(),
  repository: z.string(),
  state: z.enum(["OPEN", "MERGED", "CLOSED"]),
});

const bodySchema = z.object({
  tasks: z.array(z.custom<SprintTask>()),
  pullRequestsByTicket: z
    .record(z.string(), z.array(sprintPullRequestSchema))
    .optional(),
});

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid export payload" }, { status: 400 });
  }

  const csv = buildCsv(
    parsed.data.tasks,
    parsed.data.pullRequestsByTicket as
      | Record<string, SprintPullRequest[]>
      | undefined,
  );
  const filename = `jira-sprint-report-${reportFilenameDate()}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

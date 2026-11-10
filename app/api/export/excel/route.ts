import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { buildExcelBuffer } from "@/lib/export/excel";
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

  const buffer = await buildExcelBuffer(
    parsed.data.tasks,
    parsed.data.pullRequestsByTicket as
      | Record<string, SprintPullRequest[]>
      | undefined,
  );
  const filename = `jira-sprint-report-${reportFilenameDate()}.xlsx`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

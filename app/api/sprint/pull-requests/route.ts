import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ensureJiraAuth } from "@/lib/jira/auth-refresh";
import { buildSprintPullRequests } from "@/lib/sprint-pull-requests";
import { buildSprintReport } from "@/lib/sprint-report";
import { parseProjectKeys } from "@/lib/jira/project-keys";

const userConfigSchema = z
  .object({
    jiraBaseUrl: z.string().optional(),
    boardId: z.number().int().positive().optional().nullable(),
    projectKeys: z.array(z.string()).optional(),
    projectKey: z.string().optional(),
    storyPointsFieldId: z.string().optional(),
  })
  .optional();

const ticketSchema = z.object({
  issueKey: z.string(),
  issueId: z.string(),
});

async function handle(
  userConfig: z.infer<typeof userConfigSchema>,
  tickets?: z.infer<typeof ticketSchema>[],
) {
  const jiraAuth = await ensureJiraAuth();
  if (!jiraAuth) {
    return NextResponse.json({ error: "Not authenticated with Jira." }, { status: 401 });
  }

  let ticketList = tickets;
  if (!ticketList?.length) {
    const report = await buildSprintReport(userConfig);
    if (!report.ok) {
      return NextResponse.json(
        { error: report.message },
        { status: report.status },
      );
    }
    ticketList = report.data.tasks.map((t) => ({
      issueKey: t.issueKey,
      issueId: t.issueId,
    }));
  }

  const data = await buildSprintPullRequests(jiraAuth, ticketList);
  return NextResponse.json(data);
}

export async function GET() {
  return handle(undefined);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const configParsed = userConfigSchema.safeParse(body.config);
  if (!configParsed.success) {
    return NextResponse.json({ error: "Invalid config" }, { status: 400 });
  }

  const config = configParsed.data
    ? {
        ...configParsed.data,
        projectKeys:
          configParsed.data.projectKeys ??
          (configParsed.data.projectKey
            ? parseProjectKeys(configParsed.data.projectKey)
            : undefined),
      }
    : undefined;

  const ticketsParsed = z
    .array(ticketSchema)
    .optional()
    .safeParse(body.tickets);

  if (!ticketsParsed.success) {
    return NextResponse.json({ error: "Invalid tickets" }, { status: 400 });
  }

  return handle(config, ticketsParsed.data);
}

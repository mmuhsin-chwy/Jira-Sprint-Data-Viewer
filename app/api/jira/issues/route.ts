import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
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

async function runReport(userConfig: z.infer<typeof userConfigSchema>) {
  const normalized = userConfig
    ? {
        ...userConfig,
        projectKeys:
          userConfig.projectKeys ??
          (userConfig.projectKey
            ? parseProjectKeys(userConfig.projectKey)
            : undefined),
      }
    : undefined;

  const result = await buildSprintReport(normalized);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.message },
      { status: result.status },
    );
  }
  return NextResponse.json(result.data);
}

export async function GET() {
  return runReport(undefined);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const parsed = userConfigSchema.safeParse(body.config);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid config" }, { status: 400 });
  }
  return runReport(parsed.data);
}

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

const bodySchema = z.object({
  config: userConfigSchema,
  sprintId: z.number().int().positive().optional(),
});

async function runReport(
  userConfig: z.infer<typeof userConfigSchema>,
  sprintId?: number,
) {
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

  const result = await buildSprintReport(normalized, sprintId);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.message },
      { status: result.status },
    );
  }
  return NextResponse.json(result.data);
}

export async function GET(request: NextRequest) {
  const sprintParam = request.nextUrl.searchParams.get("sprintId");
  const sprintId = sprintParam ? Number(sprintParam) : undefined;
  return runReport(
    undefined,
    sprintId && !Number.isNaN(sprintId) ? sprintId : undefined,
  );
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    const legacy = userConfigSchema.safeParse(body.config ?? body);
    if (!legacy.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    return runReport(legacy.data, body.sprintId);
  }
  return runReport(parsed.data.config, parsed.data.sprintId);
}

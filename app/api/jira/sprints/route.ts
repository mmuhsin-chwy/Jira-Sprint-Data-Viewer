import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ensureJiraAuth } from "@/lib/jira/auth-refresh";
import { listBoardSprints, getBoard } from "@/lib/jira/sprints";
import { resolveAppConfig } from "@/lib/jira/env-config";
import { parseProjectKeys } from "@/lib/jira/project-keys";
import type { UserConfigOverrides } from "@/lib/jira/merge-config";

const userConfigSchema = z
  .object({
    jiraBaseUrl: z.string().optional(),
    boardId: z.number().int().positive().optional().nullable(),
    projectKeys: z.array(z.string()).optional(),
    projectKey: z.string().optional(),
    storyPointsFieldId: z.string().optional(),
  })
  .optional();

export async function GET(request: NextRequest) {
  const auth = await ensureJiraAuth();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const boardParam = request.nextUrl.searchParams.get("boardId");
  const boardId = boardParam
    ? Number(boardParam)
    : resolveAppConfig().boardId;

  if (!boardId || Number.isNaN(boardId)) {
    return NextResponse.json({ error: "boardId required" }, { status: 400 });
  }

  const [sprints, board] = await Promise.all([
    listBoardSprints(auth, boardId),
    getBoard(auth, boardId),
  ]);

  return NextResponse.json({
    sprints,
    board,
  });
}

export async function POST(request: NextRequest) {
  const auth = await ensureJiraAuth();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = userConfigSchema.safeParse(body.config);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid config" }, { status: 400 });
  }

  const userConfig = parsed.data
    ? ({
        ...parsed.data,
        projectKeys:
          parsed.data.projectKeys ??
          (parsed.data.projectKey
            ? parseProjectKeys(parsed.data.projectKey)
            : undefined),
      } satisfies UserConfigOverrides)
    : undefined;

  const config = resolveAppConfig(userConfig);
  const boardId = config.boardId;
  if (!boardId) {
    return NextResponse.json({ error: "boardId required" }, { status: 400 });
  }

  const [sprints, board] = await Promise.all([
    listBoardSprints(auth, boardId),
    getBoard(auth, boardId),
  ]);

  return NextResponse.json({ sprints, board });
}

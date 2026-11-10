import { NextRequest, NextResponse } from "next/server";
import { ensureJiraAuth } from "@/lib/jira/auth-refresh";
import { getActiveSprint, getBoard } from "@/lib/jira/sprints";
import { resolveAppConfig } from "@/lib/jira/env-config";

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

  const sprint = await getActiveSprint(auth, boardId);
  const board = await getBoard(auth, boardId);
  return NextResponse.json({
    sprint,
    board,
  });
}

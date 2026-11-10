import { NextResponse } from "next/server";
import { ensureJiraAuth } from "@/lib/jira/auth-refresh";
import { listBoards } from "@/lib/jira/sprints";

export async function GET() {
  const auth = await ensureJiraAuth();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const boards = await listBoards(auth);
    return NextResponse.json(boards);
  } catch {
    return NextResponse.json(
      { error: "Failed to load boards." },
      { status: 502 },
    );
  }
}

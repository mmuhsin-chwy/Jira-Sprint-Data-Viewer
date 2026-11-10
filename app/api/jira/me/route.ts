import { NextResponse } from "next/server";
import { ensureJiraAuth } from "@/lib/jira/auth-refresh";
import { getCurrentUser } from "@/lib/jira/issues";

export async function GET() {
  const auth = await ensureJiraAuth();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = auth.user ?? (await getCurrentUser(auth));
  return NextResponse.json(user);
}

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { jiraTokenLoginSchema } from "@/lib/validators";
import { getCurrentUser } from "@/lib/jira/issues";
import type { JiraSessionAuth } from "@/lib/session";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = jiraTokenLoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { jiraBaseUrl, jiraEmail, jiraApiToken } = parsed.data;
  const auth: JiraSessionAuth = {
    authType: "token",
    accessToken: jiraApiToken,
    email: jiraEmail,
    baseUrl: jiraBaseUrl.replace(/\/$/, ""),
  };

  try {
    const user = await getCurrentUser(auth);
    const session = await getSession();
    session.jira = { ...auth, user };
    await session.save();
    return NextResponse.json({ ok: true, user });
  } catch {
    return NextResponse.json(
      { error: "Invalid Jira credentials or site URL." },
      { status: 401 },
    );
  }
}

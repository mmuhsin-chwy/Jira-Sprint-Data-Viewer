import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { isEnvJiraAuthConfigured } from "@/lib/jira/env-config";

export async function GET() {
  const session = await getSession();
  const jira = session.jira;
  const envAuth = isEnvJiraAuthConfigured();

  return NextResponse.json({
    authenticated: envAuth || Boolean(jira),
    authType: envAuth ? "env" : (jira?.authType ?? null),
    user: jira?.user ?? null,
    envAuth,
  });
}

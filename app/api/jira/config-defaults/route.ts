import { NextResponse } from "next/server";
import {
  getEnvAppConfigPartial,
  isEnvJiraAuthConfigured,
} from "@/lib/jira/env-config";

export async function GET() {
  const defaults = getEnvAppConfigPartial();
  return NextResponse.json({
    defaults,
    envAuth: isEnvJiraAuthConfigured(),
  });
}

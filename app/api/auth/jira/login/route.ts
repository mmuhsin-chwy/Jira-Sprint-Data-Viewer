import { NextResponse } from "next/server";
import { buildAuthorizeUrl } from "@/lib/jira/oauth";
import { cookies } from "next/headers";
import crypto from "crypto";

export async function GET() {
  if (!process.env.ATLASSIAN_CLIENT_ID) {
    return NextResponse.json(
      { error: "OAuth is not configured. Use API token login on the login page." },
      { status: 503 },
    );
  }
  const state = crypto.randomBytes(16).toString("hex");
  const jar = await cookies();
  jar.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return NextResponse.redirect(buildAuthorizeUrl(state));
}

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  exchangeCodeForTokens,
  fetchAccessibleResources,
} from "@/lib/jira/oauth";
import { getSession } from "@/lib/session";
import { getCurrentUser } from "@/lib/jira/issues";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error)}`, request.url),
    );
  }

  const jar = await cookies();
  const expectedState = jar.get("oauth_state")?.value;
  jar.delete("oauth_state");

  if (!code || !state || state !== expectedState) {
    return NextResponse.redirect(new URL("/login?error=invalid_state", request.url));
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const resources = await fetchAccessibleResources(tokens.access_token);
    const site = resources[0];
    if (!site) {
      return NextResponse.redirect(new URL("/login?error=no_site", request.url));
    }

    const session = await getSession();
    session.jira = {
      authType: "oauth",
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + tokens.expires_in * 1000,
      cloudId: site.id,
      baseUrl: site.url,
    };

    const user = await getCurrentUser(session.jira);
    session.jira.user = user;
    await session.save();

    return NextResponse.redirect(new URL("/", request.url));
  } catch {
    return NextResponse.redirect(new URL("/login?error=oauth_failed", request.url));
  }
}

import { getSession, type JiraSessionAuth } from "@/lib/session";
import { refreshAccessToken } from "./oauth";
import { getEnvJiraAuth } from "./env-config";

export async function ensureJiraAuth(): Promise<JiraSessionAuth | null> {
  const envAuth = getEnvJiraAuth();
  if (envAuth) {
    return envAuth;
  }

  const session = await getSession();
  const jira = session.jira;
  if (!jira) return null;

  if (jira.authType === "oauth" && jira.refreshToken && jira.expiresAt) {
    const now = Date.now();
    if (now >= jira.expiresAt - 60_000) {
      try {
        const tokens = await refreshAccessToken(jira.refreshToken);
        session.jira = {
          ...jira,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token ?? jira.refreshToken,
          expiresAt: Date.now() + tokens.expires_in * 1000,
        };
        await session.save();
        return session.jira;
      } catch {
        return null;
      }
    }
  }

  return jira;
}

export async function isJiraAuthenticated(): Promise<boolean> {
  return (await ensureJiraAuth()) !== null;
}

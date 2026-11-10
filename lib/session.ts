import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import type { JiraUser } from "@/types/jira";

export type JiraAuthType = "oauth" | "token";

export interface JiraSessionAuth {
  authType: JiraAuthType;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  cloudId?: string;
  baseUrl?: string;
  email?: string;
  user?: JiraUser;
}

export interface SessionData {
  jira?: JiraSessionAuth;
  boardName?: string;
}

const sessionPassword =
  process.env.SESSION_SECRET ??
  "development-only-session-secret-32ch";

const sessionOptions: SessionOptions = {
  password: sessionPassword,
  cookieName: "jira_sprint_viewer_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
  },
};

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

export function assertSessionSecret(): void {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET must be set to a random string of at least 32 characters.",
    );
  }
}

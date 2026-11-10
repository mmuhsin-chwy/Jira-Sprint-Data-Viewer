import type { JiraSessionAuth } from "@/lib/session";

export class JiraApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "JiraApiError";
  }
}

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/$/, "");
}

export function jiraApiBase(auth: JiraSessionAuth): string {
  if (auth.authType === "oauth" && auth.cloudId) {
    return `https://api.atlassian.com/ex/jira/${auth.cloudId}`;
  }
  if (auth.baseUrl) {
    return normalizeBaseUrl(auth.baseUrl);
  }
  throw new Error("Jira base URL or cloud ID is not configured.");
}

export async function jiraFetch(
  auth: JiraSessionAuth,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const base = jiraApiBase(auth);
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;

  const headers: HeadersInit = {
    Accept: "application/json",
    ...init?.headers,
  };

  if (auth.authType === "oauth") {
    (headers as Record<string, string>).Authorization =
      `Bearer ${auth.accessToken}`;
  } else {
    const email = auth.email ?? "";
    const token = Buffer.from(`${email}:${auth.accessToken}`).toString(
      "base64",
    );
    (headers as Record<string, string>).Authorization = `Basic ${token}`;
  }

  const res = await fetch(url, { ...init, headers, cache: "no-store" });
  return res;
}

export async function jiraJson<T>(
  auth: JiraSessionAuth,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await jiraFetch(auth, path, init);
  if (!res.ok) {
    const text = await res.text();
    throw new JiraApiError(
      text || `Jira API error ${res.status}`,
      res.status,
    );
  }
  return res.json() as Promise<T>;
}

export function issueBrowseUrl(auth: JiraSessionAuth, issueKey: string): string {
  if (auth.authType === "token" && auth.baseUrl) {
    return `${normalizeBaseUrl(auth.baseUrl)}/browse/${issueKey}`;
  }
  const site = process.env.JIRA_BASE_URL;
  if (site) {
    return `${normalizeBaseUrl(site)}/browse/${issueKey}`;
  }
  return `https://www.atlassian.com/browse/${issueKey}`;
}

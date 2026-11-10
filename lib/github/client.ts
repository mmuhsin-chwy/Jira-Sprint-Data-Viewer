export class GitHubApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public rateLimited?: boolean,
  ) {
    super(message);
    this.name = "GitHubApiError";
  }
}

export async function githubFetch(
  token: string,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const url = path.startsWith("http")
    ? path
    : `https://api.github.com${path.startsWith("/") ? path : `/${path}`}`;

  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (res.status === 403 || res.status === 429) {
    const remaining = res.headers.get("x-ratelimit-remaining");
    if (remaining === "0") {
      const reset = res.headers.get("x-ratelimit-reset");
      throw new GitHubApiError(
        `GitHub rate limit exceeded${reset ? `; resets at ${new Date(Number(reset) * 1000).toISOString()}` : ""}`,
        res.status,
        true,
      );
    }
  }

  return res;
}

export async function githubJson<T>(
  token: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await githubFetch(token, path, init);
  if (!res.ok) {
    const text = await res.text();
    throw new GitHubApiError(
      text || `GitHub API error ${res.status}`,
      res.status,
    );
  }
  return res.json() as Promise<T>;
}

export async function githubJsonPaginated<T>(
  token: string,
  path: string,
  maxPages = 5,
): Promise<T[]> {
  const all: T[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const sep = path.includes("?") ? "&" : "?";
    const batch = await githubJson<T[]>(
      token,
      `${path}${sep}per_page=100&page=${page}`,
    );
    if (!batch.length) break;
    all.push(...batch);
    if (batch.length < 100) break;
  }
  return all;
}

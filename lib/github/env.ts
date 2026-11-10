function trim(value: string | undefined): string {
  return (value ?? "").trim();
}

function parseRepoList(value: string | undefined): string[] {
  if (!value?.trim()) return [];
  return [
    ...new Set(
      value
        .split(/[,;\s]+/)
        .map((r) => r.trim())
        .filter(Boolean),
    ),
  ];
}

export interface GitHubConfig {
  token: string;
  org: string;
  /** Owner used in REST paths (defaults to GITHUB_ORG). */
  owner: string;
  repos: string[];
}

export function getGitHubConfig(): GitHubConfig | null {
  const token = trim(process.env.GITHUB_TOKEN);
  const org = trim(process.env.GITHUB_ORG);
  if (!token || !org) return null;

  const repos = parseRepoList(process.env.GITHUB_REPOS);
  const owner = trim(process.env.GITHUB_OWNER) || org;

  return { token, org, owner, repos };
}

export function assertGitHubConfig(): GitHubConfig {
  const config = getGitHubConfig();
  if (!config) {
    throw new Error(
      "GitHub is not configured. Set GITHUB_TOKEN and GITHUB_ORG in server environment variables.",
    );
  }
  return config;
}

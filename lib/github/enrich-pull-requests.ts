import type { SprintPullRequest } from "@/types/github";
import type { GitHubConfig } from "./env";
import { parsePullUrl, pullRequestDedupeKey } from "./issue-matching";
import { fetchPullRequestDetail } from "./pull-requests";

function hasLoc(pr: SprintPullRequest): boolean {
  return (
    pr.additions != null &&
    pr.deletions != null &&
    pr.totalChanges != null
  );
}

function hasGithubDates(pr: SprintPullRequest): boolean {
  return Boolean(pr.createdAt || pr.updatedAt || pr.mergedAt);
}

export async function enrichPullRequestsFromGitHub(
  pullRequests: SprintPullRequest[],
  github: GitHubConfig,
): Promise<SprintPullRequest[]> {
  const cache = new Map<string, SprintPullRequest>();

  async function loadFromGitHub(owner: string, repo: string, number: number) {
    const key = pullRequestDedupeKey(owner, repo, number);
    if (cache.has(key)) return cache.get(key);
    try {
      const detail = await fetchPullRequestDetail(
        github.token,
        owner,
        repo,
        number,
      );
      cache.set(key, detail);
      return detail;
    } catch {
      return undefined;
    }
  }

  const enriched: SprintPullRequest[] = [];

  for (const pr of pullRequests) {
    const parsed = parsePullUrl(pr.url);
    if (!parsed) {
      enriched.push(pr);
      continue;
    }

    const needsEnrichment = !hasLoc(pr) || !hasGithubDates(pr);
    if (!needsEnrichment) {
      enriched.push(pr);
      continue;
    }

    const gh = await loadFromGitHub(parsed.owner, parsed.repo, parsed.number);
    if (!gh) {
      enriched.push(pr);
      continue;
    }

    enriched.push({
      ...pr,
      title: pr.title || gh.title,
      state: pr.state ?? gh.state,
      createdAt: pr.createdAt ?? gh.createdAt,
      updatedAt: pr.updatedAt ?? gh.updatedAt,
      mergedAt: pr.mergedAt ?? gh.mergedAt,
      additions: pr.additions ?? gh.additions,
      deletions: pr.deletions ?? gh.deletions,
      totalChanges: pr.totalChanges ?? gh.totalChanges,
      source: pr.source ?? "jira",
    });
  }

  return enriched;
}

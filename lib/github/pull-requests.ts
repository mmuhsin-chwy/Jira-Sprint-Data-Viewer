import type { SprintPullRequest } from "@/types/github";
import { githubJson } from "./client";
import { computeTotalChanges } from "./loc";
import { toGitHubPrState } from "./state";
import { cacheGet, cacheKey, cacheSet } from "./cache";

const PR_DETAIL_TTL_MS = 10 * 60 * 1000;
const PR_INDEX_TTL_MS = 5 * 60 * 1000;

interface GithubPullListItem {
  number: number;
  title: string;
  html_url: string;
  state: string;
  created_at: string;
  updated_at: string;
  merged_at: string | null;
  user: { login: string };
  body: string | null;
  head: { ref: string };
}

interface GithubPullDetail extends GithubPullListItem {
  additions: number;
  deletions: number;
  changed_files: number;
  merged: boolean;
}

export interface PullRef {
  owner: string;
  repo: string;
  number: number;
}

export function mapPullDetail(
  owner: string,
  repo: string,
  pr: GithubPullDetail,
): SprintPullRequest {
  const additions = pr.additions ?? 0;
  const deletions = pr.deletions ?? 0;
  return {
    number: pr.number,
    title: pr.title,
    url: pr.html_url,
    repository: repo,
    state: toGitHubPrState(pr.merged, pr.state),
    createdAt: pr.created_at,
    updatedAt: pr.updated_at,
    mergedAt: pr.merged_at,
    additions,
    deletions,
    totalChanges: computeTotalChanges(additions, deletions),
  };
}

export async function fetchPullRequestDetail(
  token: string,
  owner: string,
  repo: string,
  number: number,
): Promise<SprintPullRequest> {
  const id = cacheKey(["pr", owner, repo, number]);
  const cached = cacheGet<SprintPullRequest>(id);
  if (cached) return cached;

  const pr = await githubJson<GithubPullDetail>(
    token,
    `/repos/${owner}/${repo}/pulls/${number}`,
  );
  const mapped = mapPullDetail(owner, repo, pr);
  cacheSet(id, mapped, PR_DETAIL_TTL_MS);
  return mapped;
}

export type ListedPull = GithubPullListItem & { repo: string };

export async function listRepositoryPullRequests(
  token: string,
  owner: string,
  repo: string,
  maxPages = 2,
): Promise<ListedPull[]> {
  const listed: ListedPull[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const batch = await githubJson<GithubPullListItem[]>(
      token,
      `/repos/${owner}/${repo}/pulls?state=all&sort=updated&direction=desc&per_page=100&page=${page}`,
    );
    if (!batch.length) break;
    listed.push(...batch.map((p) => ({ ...p, repo })));
    if (batch.length < 100) break;
  }
  return listed;
}

export async function buildOrgPullIndex(
  token: string,
  org: string,
  repos: string[],
): Promise<ListedPull[]> {
  const cacheId = cacheKey(["pr-index", org, repos.join(",")]);
  const cached = cacheGet<ListedPull[]>(cacheId);
  if (cached) return cached;

  const batches = await Promise.all(
    repos.map((repo) => listRepositoryPullRequests(token, org, repo)),
  );
  const all = batches.flat();
  cacheSet(cacheId, all, PR_INDEX_TTL_MS);
  return all;
}

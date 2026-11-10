import { githubJson } from "./client";
import { GitHubApiError } from "./client";
import {
  issueKeyInPullRequestText,
  pullRequestDedupeKey,
} from "./issue-matching";
import type { PullRef } from "./pull-requests";

interface SearchItem {
  number: number;
  title: string;
  body: string | null;
  repository_url: string;
}

interface SearchResponse {
  total_count: number;
  items: SearchItem[];
}

function parseRepoFromApiUrl(repositoryUrl: string): { owner: string; repo: string } | null {
  const match = repositoryUrl.match(/\/repos\/([^/]+)\/([^/]+)$/i);
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}

async function runIssueSearch(
  token: string,
  query: string,
  issueKey: string,
  seen: Set<string>,
  refs: PullRef[],
): Promise<void> {
  const data = await githubJson<SearchResponse>(
    token,
    `/search/issues?q=${encodeURIComponent(query)}`,
  );
  for (const item of data.items ?? []) {
    if (!issueKeyInPullRequestText(issueKey, item.title, item.body, null)) {
      continue;
    }
    const parsed = parseRepoFromApiUrl(item.repository_url);
    if (!parsed) continue;
    const key = pullRequestDedupeKey(parsed.owner, parsed.repo, item.number);
    if (seen.has(key)) continue;
    seen.add(key);
    refs.push({
      owner: parsed.owner,
      repo: parsed.repo,
      number: item.number,
    });
  }
}

export async function searchPullRequestsForIssueKey(
  token: string,
  issueKey: string,
  owner: string,
  repos: string[],
): Promise<PullRef[]> {
  const refs: PullRef[] = [];
  const seen = new Set<string>();

  if (repos.length > 0) {
    for (const repo of repos) {
      const query = `${issueKey} in:title,body is:pr repo:${owner}/${repo}`;
      try {
        await runIssueSearch(token, query, issueKey, seen, refs);
      } catch (e) {
        if (e instanceof GitHubApiError && (e.status === 422 || e.status === 403)) {
          continue;
        }
        throw e;
      }
    }
    return refs;
  }

  const query = `${issueKey} in:title,body is:pr`;
  try {
    await runIssueSearch(token, query, issueKey, seen, refs);
  } catch (e) {
    if (e instanceof GitHubApiError && (e.status === 422 || e.status === 403)) {
      return [];
    }
    throw e;
  }
  return refs;
}

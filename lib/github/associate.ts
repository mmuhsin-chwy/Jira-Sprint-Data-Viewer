import {
  issueKeyInPullRequestText,
  parsePullUrl,
  pullRequestDedupeKey,
} from "./issue-matching";
import type { PullRef } from "./pull-requests";
import type { ListedPull } from "./pull-requests";

/** Used by discovery tests; sprint PRs now come from Jira dev-status. */
export function collectPullRefsForIssue(
  issueKey: string,
  owner: string,
  devUrls: { url: string; number?: number; name?: string }[],
  index: ListedPull[],
): PullRef[] {
  const refs = new Map<string, PullRef>();

  for (const hint of devUrls) {
    const parsed = parsePullUrl(hint.url);
    if (parsed) {
      const key = pullRequestDedupeKey(
        parsed.owner,
        parsed.repo,
        parsed.number,
      );
      refs.set(key, parsed);
    }
  }

  for (const pr of index) {
    if (
      issueKeyInPullRequestText(issueKey, pr.title, pr.body, pr.head?.ref)
    ) {
      const key = pullRequestDedupeKey(owner, pr.repo, pr.number);
      if (!refs.has(key)) {
        refs.set(key, { owner, repo: pr.repo, number: pr.number });
      }
    }
  }

  return [...refs.values()];
}

import type { SprintPullRequest } from "@/types/github";

export function formatPullRequestsForExport(
  pullRequests: SprintPullRequest[] | undefined,
): { pullRequestSummary: string; pullRequestLinks: string } {
  if (!pullRequests?.length) {
    return { pullRequestSummary: "", pullRequestLinks: "" };
  }

  const pullRequestSummary = pullRequests
    .map((pr) => `#${pr.number} ${pr.state}`)
    .join("; ");

  const pullRequestLinks = pullRequests.map((pr) => pr.url).join(" | ");

  return { pullRequestSummary, pullRequestLinks };
}

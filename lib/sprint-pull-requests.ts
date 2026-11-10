import type { JiraSessionAuth } from "@/lib/session";
import { fetchDevelopmentPanelPullRequests } from "@/lib/jira/dev-status/dev-status-service";
import { getGitHubConfig } from "@/lib/github/env";
import { enrichPullRequestsFromGitHub } from "@/lib/github/enrich-pull-requests";
import type { SprintPullRequestsResponse, TicketPullRequests } from "@/types/github";

export interface SprintTicketRef {
  issueKey: string;
  issueId: string;
}

async function mapInBatches<T, R>(
  items: T[],
  batchSize: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const slice = items.slice(i, i + batchSize);
    const batch = await Promise.all(slice.map(fn));
    out.push(...batch);
  }
  return out;
}

export async function buildSprintPullRequests(
  jiraAuth: JiraSessionAuth,
  tickets: SprintTicketRef[],
): Promise<SprintPullRequestsResponse> {
  const github = getGitHubConfig();

  const rows = await mapInBatches(tickets, 8, async (ticket) => {
    const dev = await fetchDevelopmentPanelPullRequests(
      jiraAuth,
      ticket.issueId,
      ticket.issueKey,
    );
    let pullRequests = dev.pullRequests;
    if (github && pullRequests.length > 0) {
      pullRequests = await enrichPullRequestsFromGitHub(pullRequests, github);
    }
    return {
      ticketKey: ticket.issueKey,
      pullRequests,
      dev,
    };
  });

  const warnings: string[] = [];
  const mismatches = rows.filter(
    (r) => r.dev.summaryCount > 0 && r.pullRequests.length === 0,
  );
  if (mismatches.length > 0) {
    warnings.push(
      `Jira reports linked PRs for ${mismatches.length} ticket(s) but detail could not be loaded. Ensure your Atlassian account can view development information (try OAuth login).`,
    );
  }

  const ticketsOut: TicketPullRequests[] = rows.map((r) => ({
    ticketKey: r.ticketKey,
    pullRequests: r.pullRequests,
  }));

  return {
    tickets: ticketsOut,
    meta: {
      source: "jira-development-panel",
      githubEnrichmentEnabled: Boolean(github),
      repositoriesScanned: 0,
      cached: false,
      warning: warnings.length > 0 ? warnings.join(" ") : undefined,
    },
  };
}

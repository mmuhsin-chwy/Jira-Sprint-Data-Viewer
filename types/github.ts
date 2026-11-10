export type GitHubPrState = "OPEN" | "MERGED" | "CLOSED";

export interface SprintPullRequest {
  number: number;
  title: string;
  url: string;
  repository: string;
  state: GitHubPrState;
  createdAt?: string | null;
  updatedAt?: string | null;
  mergedAt?: string | null;
  additions?: number | null;
  deletions?: number | null;
  totalChanges?: number | null;
  /** Where base metadata came from before optional GitHub enrichment */
  source?: "jira" | "github";
}

export interface TicketPullRequests {
  ticketKey: string;
  pullRequests: SprintPullRequest[];
}

export interface SprintPullRequestsResponse {
  tickets: TicketPullRequests[];
  meta?: {
    source?: "jira-development-panel";
    githubEnrichmentEnabled?: boolean;
    githubOrg?: string;
    repositoriesScanned: number;
    cached: boolean;
    warning?: string;
  };
}

/** Internal shapes from Jira dev-status (undocumented; do not leak to UI types). */

export interface DevStatusSummaryResponse {
  errors?: unknown[];
  configErrors?: unknown[];
  summary?: {
    pullrequest?: {
      overall?: {
        count?: number;
        lastUpdated?: string | null;
        state?: string | null;
      };
      byInstanceType?: Record<
        string,
        { count?: number; name?: string }
      >;
    };
  };
}

export interface DevStatusDetailResponse {
  errors?: unknown[];
  detail?: DevStatusDetailBlock[];
}

export interface DevStatusDetailBlock {
  pullRequests?: DevStatusRawPullRequest[];
  repositories?: { pullRequests?: DevStatusRawPullRequest[] }[];
}

export interface DevStatusRawPullRequest {
  url?: string;
  name?: string;
  id?: string;
  status?: string;
  lastUpdate?: string;
  createdOn?: string;
  createdDate?: string;
  updatedOn?: string;
  repositoryName?: string;
  repositoryUrl?: string;
  linesAdded?: number;
  linesRemoved?: number;
  additions?: number;
  deletions?: number;
}

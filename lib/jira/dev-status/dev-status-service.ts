import { JiraApiError, jiraJson } from "@/lib/jira/client";
import type { JiraSessionAuth } from "@/lib/session";
import type { SprintPullRequest } from "@/types/github";
import { devStatusLog } from "./logger";
import { mapRawDevStatusPull } from "./map-pull-request";
import type {
  DevStatusDetailBlock,
  DevStatusDetailResponse,
  DevStatusRawPullRequest,
  DevStatusSummaryResponse,
} from "./types";

const SUMMARY_PATHS = [
  "/rest/dev-status/latest/issue/summary",
  "/rest/dev-status/1.0/issue/summary",
] as const;

const DETAIL_PATHS = [
  "/rest/dev-status/latest/issue/detail",
  "/rest/dev-status/1.0/issue/detail",
] as const;

const FALLBACK_APPLICATION_TYPES = [
  "GitHub",
  "github",
  "oAuth-com.github.integration.production",
] as const;

function collectRawPullRequests(blocks: DevStatusDetailBlock[]): DevStatusRawPullRequest[] {
  const out: DevStatusRawPullRequest[] = [];
  for (const block of blocks) {
    if (block.pullRequests?.length) {
      out.push(...block.pullRequests);
    }
    for (const repo of block.repositories ?? []) {
      if (repo.pullRequests?.length) {
        out.push(...repo.pullRequests);
      }
    }
  }
  return out;
}

function applicationTypesFromSummary(
  summary: DevStatusSummaryResponse,
): string[] {
  const byInstance = summary.summary?.pullrequest?.byInstanceType;
  if (!byInstance) return [];
  return Object.entries(byInstance)
    .filter(([, meta]) => (meta.count ?? 0) > 0)
    .map(([key]) => key);
}

async function fetchSummary(
  auth: JiraSessionAuth,
  issueId: string,
): Promise<DevStatusSummaryResponse | null> {
  const query = `issueId=${encodeURIComponent(issueId)}`;
  for (const base of SUMMARY_PATHS) {
    try {
      const data = await jiraJson<DevStatusSummaryResponse>(
        auth,
        `${base}?${query}`,
      );
      devStatusLog("summary loaded", {
        issueId,
        path: base,
        prCount: data.summary?.pullrequest?.overall?.count ?? 0,
      });
      return data;
    } catch (e) {
      if (e instanceof JiraApiError && e.status === 404) continue;
      devStatusLog("summary failed", {
        issueId,
        path: base,
        status: e instanceof JiraApiError ? e.status : "error",
      });
    }
  }
  return null;
}

async function fetchDetailForApplicationType(
  auth: JiraSessionAuth,
  issueId: string,
  applicationType: string,
): Promise<DevStatusDetailBlock[]> {
  const params = new URLSearchParams({
    issueId,
    applicationType,
    dataType: "pullrequest",
  });

  for (const base of DETAIL_PATHS) {
    try {
      const data = await jiraJson<DevStatusDetailResponse>(
        auth,
        `${base}?${params.toString()}`,
      );
      if (data.errors?.length) {
        devStatusLog("detail returned errors", {
          issueId,
          applicationType,
          errorCount: data.errors.length,
        });
      }
      const blocks = data.detail ?? [];
      if (blocks.length > 0) {
        devStatusLog("detail loaded", {
          issueId,
          applicationType,
          path: base,
          blockCount: blocks.length,
        });
        return blocks;
      }
    } catch (e) {
      if (e instanceof JiraApiError && (e.status === 404 || e.status === 400)) {
        continue;
      }
      devStatusLog("detail failed", {
        issueId,
        applicationType,
        status: e instanceof JiraApiError ? e.status : "error",
      });
    }
  }
  return [];
}

export interface FetchDevelopmentPanelPullRequestsResult {
  pullRequests: SprintPullRequest[];
  summaryCount: number;
  applicationTypesTried: string[];
}

export async function fetchDevelopmentPanelPullRequests(
  auth: JiraSessionAuth,
  issueId: string,
  issueKey?: string,
): Promise<FetchDevelopmentPanelPullRequestsResult> {
  devStatusLog("fetch start", { issueId, issueKey: issueKey ?? null });

  const summary = await fetchSummary(auth, issueId);
  const summaryCount = summary?.summary?.pullrequest?.overall?.count ?? 0;

  let applicationTypes = summary
    ? applicationTypesFromSummary(summary)
    : [];

  if (applicationTypes.length === 0 && summaryCount > 0) {
    applicationTypes = [...FALLBACK_APPLICATION_TYPES];
    devStatusLog("using fallback application types", {
      issueId,
      summaryCount,
    });
  }

  if (applicationTypes.length === 0) {
    applicationTypes = [...FALLBACK_APPLICATION_TYPES];
  }

  const applicationTypesTried: string[] = [];
  const rawByUrl = new Map<string, DevStatusRawPullRequest>();

  for (const applicationType of applicationTypes) {
    applicationTypesTried.push(applicationType);
    const blocks = await fetchDetailForApplicationType(
      auth,
      issueId,
      applicationType,
    );
    for (const raw of collectRawPullRequests(blocks)) {
      if (raw.url) rawByUrl.set(raw.url, raw);
    }
  }

  const pullRequests = [...rawByUrl.values()]
    .map(mapRawDevStatusPull)
    .filter((p): p is SprintPullRequest => Boolean(p));

  pullRequests.sort((a, b) => a.number - b.number);

  devStatusLog("fetch complete", {
    issueId,
    issueKey: issueKey ?? null,
    summaryCount,
    mappedCount: pullRequests.length,
    applicationTypesTried: applicationTypesTried.join(","),
  });

  return {
    pullRequests,
    summaryCount,
    applicationTypesTried,
  };
}

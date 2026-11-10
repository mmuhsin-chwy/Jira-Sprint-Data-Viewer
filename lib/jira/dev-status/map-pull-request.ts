import type { SprintPullRequest } from "@/types/github";
import { parsePullUrl } from "@/lib/github/issue-matching";
import type { DevStatusRawPullRequest } from "./types";

export function parsePullNumber(
  url: string,
  id?: string,
): number | null {
  const fromUrl = parsePullUrl(url);
  if (fromUrl) return fromUrl.number;
  if (id) {
    const m = id.match(/#?(\d+)/);
    if (m) return Number(m[1]);
  }
  return null;
}

export function mapJiraDevStatusState(status: string | undefined): SprintPullRequest["state"] {
  const normalized = (status ?? "").toUpperCase();
  if (normalized === "MERGED") return "MERGED";
  if (normalized === "OPEN") return "OPEN";
  return "CLOSED";
}

function readOptionalLoc(
  pr: DevStatusRawPullRequest,
): { additions?: number; deletions?: number } {
  const additions =
    typeof pr.additions === "number"
      ? pr.additions
      : typeof pr.linesAdded === "number"
        ? pr.linesAdded
        : undefined;
  const deletions =
    typeof pr.deletions === "number"
      ? pr.deletions
      : typeof pr.linesRemoved === "number"
        ? pr.linesRemoved
        : undefined;
  if (additions === undefined && deletions === undefined) {
    return {};
  }
  return { additions, deletions };
}

function resolveRepository(
  url: string,
  repositoryName?: string,
): string {
  const parsed = parsePullUrl(url);
  if (parsed) return `${parsed.owner}/${parsed.repo}`;
  if (repositoryName?.includes("/")) return repositoryName;
  return repositoryName ?? "unknown";
}

export function mapRawDevStatusPull(
  pr: DevStatusRawPullRequest,
): SprintPullRequest | null {
  if (!pr.url?.trim()) return null;

  const number = parsePullNumber(pr.url, pr.id);
  if (number == null) return null;

  const loc = readOptionalLoc(pr);
  const createdAt =
    pr.createdOn ?? pr.createdDate ?? null;
  const updatedAt = pr.lastUpdate ?? pr.updatedOn ?? null;

  const totalChanges =
    loc.additions != null && loc.deletions != null
      ? loc.additions + loc.deletions
      : undefined;

  return {
    number,
    title: pr.name?.trim() || `Pull request #${number}`,
    url: pr.url,
    repository: resolveRepository(pr.url, pr.repositoryName),
    state: mapJiraDevStatusState(pr.status),
    createdAt: createdAt || null,
    updatedAt: updatedAt || null,
    mergedAt: null,
    additions: loc.additions ?? null,
    deletions: loc.deletions ?? null,
    totalChanges: totalChanges ?? null,
    source: "jira",
  };
}

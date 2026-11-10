import type { GitHubPrState } from "@/types/github";

export function toGitHubPrState(
  merged: boolean,
  state: string,
): GitHubPrState {
  if (merged) return "MERGED";
  if (state === "open") return "OPEN";
  return "CLOSED";
}

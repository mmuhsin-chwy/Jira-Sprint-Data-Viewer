import { Badge } from "@/components/ui/badge";
import type { GitHubPrState } from "@/types/github";

const LABELS: Record<GitHubPrState, string> = {
  OPEN: "Open",
  MERGED: "Merged",
  CLOSED: "Closed",
};

export function PRStatusBadge({ state }: { state: GitHubPrState }) {
  const variant =
    state === "MERGED"
      ? "success"
      : state === "OPEN"
        ? "warning"
        : state === "CLOSED"
          ? "danger"
          : "muted";

  return <Badge variant={variant}>{LABELS[state]}</Badge>;
}

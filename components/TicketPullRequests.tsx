"use client";

import { useState } from "react";
import type { SprintPullRequest } from "@/types/github";
import { PRStatusBadge } from "@/components/PRStatusBadge";
import { formatDisplayDate } from "@/lib/date-utils";
import { formatLocSummary } from "@/lib/github/loc";
import { ChevronDown, ChevronRight } from "lucide-react";

function summarize(prs: SprintPullRequest[]) {
  if (prs.length === 0) return "No PRs";
  const merged = prs.filter((p) => p.state === "MERGED").length;
  const open = prs.filter((p) => p.state === "OPEN").length;
  const closed = prs.filter((p) => p.state === "CLOSED").length;
  const parts = [`${prs.length} PR${prs.length === 1 ? "" : "s"}`];
  if (merged) parts.push(`${merged} merged`);
  if (open) parts.push(`${open} open`);
  if (closed) parts.push(`${closed} closed`);
  return parts.join(" · ");
}

export function TicketPullRequests({
  pullRequests,
  loading,
  error,
}: {
  pullRequests?: SprintPullRequest[];
  loading?: boolean;
  error?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const prs = pullRequests ?? [];

  if (loading) {
    return <span className="text-xs text-neutral-500">Loading PRs…</span>;
  }

  if (error) {
    return (
      <span className="text-xs text-red-600" title={error}>
        PR error
      </span>
    );
  }

  if (prs.length === 0) {
    return <span className="text-xs text-neutral-400">No PRs</span>;
  }

  return (
    <div className="min-w-[140px]">
      <button
        type="button"
        className="flex w-full items-center gap-1 text-left text-xs text-neutral-700 hover:text-neutral-900"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        )}
        <span>{summarize(prs)}</span>
      </button>
      {open && (
        <ul className="mt-2 space-y-2 border-l border-neutral-200 pl-2">
          {prs.map((pr) => (
            <li key={`${pr.repository}-${pr.number}`} className="text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <a
                  href={pr.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-blue-600 hover:underline"
                >
                  PR #{pr.number}
                </a>
                <span className="text-neutral-400">·</span>
                <a
                  href={pr.url}
                  target="_blank"
                  rel="noreferrer"
                  className="max-w-[200px] truncate text-neutral-700 hover:underline"
                  title={pr.title}
                >
                  {pr.title}
                </a>
              </div>
              <span className="mt-1 flex flex-wrap items-center gap-2 text-neutral-500">
                <PRStatusBadge state={pr.state} />
                <span>{pr.repository}</span>
              </span>
              {(pr.createdAt || pr.updatedAt || pr.mergedAt) && (
                <p className="mt-0.5 text-neutral-500">
                  {pr.createdAt
                    ? `Created: ${formatDisplayDate(pr.createdAt)}`
                    : null}
                  {pr.createdAt && pr.updatedAt ? " · " : null}
                  {pr.updatedAt
                    ? `Updated: ${formatDisplayDate(pr.updatedAt)}`
                    : null}
                  {pr.mergedAt
                    ? ` · Merged: ${formatDisplayDate(pr.mergedAt)}`
                    : null}
                </p>
              )}
              {(() => {
                const loc = formatLocSummary(pr.additions, pr.deletions);
                return loc ? (
                  <p className="text-neutral-600">{loc}</p>
                ) : null;
              })()}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

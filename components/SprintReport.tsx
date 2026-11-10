"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { usePersistedFilters } from "@/hooks/use-persisted-filters";
import type { SprintReportResponse } from "@/lib/sprint-report";
import type { SprintPullRequestsResponse } from "@/types/github";
import type { UserConfigOverrides } from "@/lib/jira/merge-config";
import { Button } from "@/components/ui/button";
import { JiraConnection } from "@/components/JiraConnection";
import { ExportButtons } from "@/components/ExportButtons";
import { TaskFilters } from "@/components/TaskFilters";
import { TaskTable, TaskTableSkeleton } from "@/components/TaskTable";
import { applyTaskFilters, collectAssignees } from "@/lib/filters";
import { getLocalConfigForReport } from "@/hooks/use-local-jira-config";
import { RefreshCw } from "lucide-react";

const CONFIG_EVENT = "jira-sprint-user-config-change";

async function fetchReport(
  userConfig: UserConfigOverrides | null,
): Promise<SprintReportResponse> {
  const res = await fetch("/api/jira/issues", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ config: userConfig ?? undefined }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Failed to load sprint report");
  }
  return res.json();
}

async function fetchPullRequests(
  userConfig: UserConfigOverrides | null,
  tickets: { issueKey: string; issueId: string }[],
): Promise<SprintPullRequestsResponse> {
  const res = await fetch("/api/sprint/pull-requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      config: userConfig ?? undefined,
      tickets,
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Failed to load pull requests");
  }
  return res.json();
}

export function SprintReport() {
  const { filters, setFilters } = usePersistedFilters();
  const [configVersion, setConfigVersion] = useState(0);

  useEffect(() => {
    const onConfig = () => setConfigVersion((v) => v + 1);
    window.addEventListener(CONFIG_EVENT, onConfig);
    return () => window.removeEventListener(CONFIG_EVENT, onConfig);
  }, []);

  const userConfig = useMemo(
    () => getLocalConfigForReport(),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- version bump reloads localStorage
    [configVersion],
  );

  const query = useQuery({
    queryKey: ["sprint-report", userConfig, configVersion],
    queryFn: () => fetchReport(userConfig),
  });

  const ticketRefs = useMemo(
    () =>
      (query.data?.tasks ?? []).map((t) => ({
        issueKey: t.issueKey,
        issueId: t.issueId,
      })),
    [query.data?.tasks],
  );

  const prQuery = useQuery({
    queryKey: [
      "sprint-pull-requests",
      userConfig,
      configVersion,
      query.data?.meta?.sprintId,
      ticketRefs.length,
    ],
    queryFn: () => fetchPullRequests(userConfig, ticketRefs),
    enabled: query.isSuccess && ticketRefs.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const tasks = useMemo(
    () => query.data?.tasks ?? [],
    [query.data?.tasks],
  );
  const meta = query.data?.meta;

  const pullRequestsByTicket = useMemo(() => {
    const map: Record<string, SprintPullRequestsResponse["tickets"][0]["pullRequests"]> = {};
    for (const row of prQuery.data?.tickets ?? []) {
      map[row.ticketKey] = row.pullRequests;
    }
    return map;
  }, [prQuery.data?.tickets]);

  const assignees = useMemo(() => collectAssignees(tasks), [tasks]);
  const filtered = useMemo(
    () =>
      applyTaskFilters(
        tasks,
        filters,
        meta?.currentUserAccountId ?? null,
      ),
    [tasks, filters, meta?.currentUserAccountId],
  );

  const refreshAll = () => {
    void query.refetch();
    if (query.isSuccess) void prQuery.refetch();
  };

  return (
    <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-4 border-b border-neutral-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Sprint Task Report
          </h1>
          <div className="mt-2 space-y-1 text-sm text-neutral-600">
            <p>
              Board:{" "}
              <strong className="text-neutral-900">
                {meta?.boardName ?? "—"}
              </strong>
            </p>
            <p>
              Active sprint:{" "}
              <strong className="text-neutral-900">
                {meta?.sprintName ?? "—"}
              </strong>
            </p>
          </div>
          <div className="mt-3">
            <JiraConnection userDisplayName={meta?.userDisplayName} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshAll}
            disabled={query.isFetching || prQuery.isFetching}
          >
            <RefreshCw
              className={`h-4 w-4 ${query.isFetching || prQuery.isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <ExportButtons
            tasks={filtered}
            pullRequestsByTicket={pullRequestsByTicket}
          />
        </div>
      </header>

      {prQuery.isError && (
        <p
          className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
          role="status"
        >
          GitHub: {(prQuery.error as Error).message}
        </p>
      )}

      {prQuery.isSuccess && prQuery.data.meta?.warning && (
        <p
          className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
          role="status"
        >
          GitHub: {prQuery.data.meta.warning}
        </p>
      )}

      <TaskFilters
        filters={filters}
        onChange={setFilters}
        assignees={assignees}
        resultCount={filtered.length}
      />

      {query.isLoading && <TaskTableSkeleton />}

      {query.isError && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          role="alert"
        >
          {(query.error as Error).message}
        </div>
      )}

      {query.isSuccess && (
        <TaskTable
          tasks={filtered}
          pullRequestsByTicket={pullRequestsByTicket}
          pullRequestsLoading={prQuery.isLoading}
          pullRequestsError={
            prQuery.isError ? (prQuery.error as Error).message : null
          }
        />
      )}
    </main>
  );
}

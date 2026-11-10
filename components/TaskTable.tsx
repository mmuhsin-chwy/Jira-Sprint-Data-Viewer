"use client";

import type { SprintTask } from "@/types/task";
import type { SprintPullRequest } from "@/types/github";
import { TaskStatusBadge } from "@/components/TaskStatusBadge";
import { TicketPullRequests } from "@/components/TicketPullRequests";
import { Skeleton } from "@/components/ui/skeleton";

function cell(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "-";
  return value;
}

export function TaskTableSkeleton() {
  return (
    <div className="space-y-2 rounded-lg border border-neutral-200 bg-white p-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

export function TaskTable({
  tasks,
  pullRequestsByTicket,
  pullRequestsLoading,
  pullRequestsError,
}: {
  tasks: SprintTask[];
  pullRequestsByTicket?: Record<string, SprintPullRequest[]>;
  pullRequestsLoading?: boolean;
  pullRequestsError?: string | null;
}) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-12 text-center text-sm text-neutral-500">
        No tasks match the current filters.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
      <table className="w-full min-w-[920px] text-left text-sm">
        <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-600">
          <tr>
            {[
              "Jira Ticket ID",
              "Jira Ticket Title",
              "Assignee",
              "Jira Status",
              "Story Points",
              "Pull Requests",
            ].map((h) => (
              <th key={h} className="px-3 py-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr
              key={task.issueKey}
              className="border-b border-neutral-100 align-top hover:bg-neutral-50/80"
            >
              <td className="px-3 py-2 font-medium">
                <a
                  href={task.issueUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {task.issueKey}
                </a>
              </td>
              <td className="max-w-md px-3 py-2">{task.title}</td>
              <td className="px-3 py-2">{task.assignee}</td>
              <td className="px-3 py-2">
                <TaskStatusBadge status={task.status} />
              </td>
              <td className="px-3 py-2">{cell(task.storyPoints)}</td>
              <td className="px-3 py-2">
                <TicketPullRequests
                  pullRequests={pullRequestsByTicket?.[task.issueKey]}
                  loading={pullRequestsLoading}
                  error={pullRequestsError}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

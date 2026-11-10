"use client";

import { Button } from "@/components/ui/button";
import type { SprintPullRequest } from "@/types/github";
import type { SprintTask } from "@/types/task";
import { useState } from "react";

async function downloadFromApi(
  path: string,
  tasks: SprintTask[],
  pullRequestsByTicket: Record<string, SprintPullRequest[]> | undefined,
  fallbackFilename: string,
) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tasks, pullRequestsByTicket }),
  });
  if (!res.ok) throw new Error("Export failed");
  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition");
  const match = disposition?.match(/filename="([^"]+)"/);
  const filename = match?.[1] ?? fallbackFilename;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportButtons({
  tasks,
  pullRequestsByTicket,
}: {
  tasks: SprintTask[];
  pullRequestsByTicket?: Record<string, SprintPullRequest[]>;
}) {
  const [loading, setLoading] = useState<"csv" | "xlsx" | null>(null);

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={tasks.length === 0 || loading !== null}
        onClick={async () => {
          setLoading("csv");
          try {
            await downloadFromApi(
              "/api/export/csv",
              tasks,
              pullRequestsByTicket,
              "jira-sprint-report.csv",
            );
          } finally {
            setLoading(null);
          }
        }}
      >
        {loading === "csv" ? "Exporting…" : "Export CSV"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={tasks.length === 0 || loading !== null}
        onClick={async () => {
          setLoading("xlsx");
          try {
            await downloadFromApi(
              "/api/export/excel",
              tasks,
              pullRequestsByTicket,
              "jira-sprint-report.xlsx",
            );
          } finally {
            setLoading(null);
          }
        }}
      >
        {loading === "xlsx" ? "Exporting…" : "Export Excel"}
      </Button>
    </div>
  );
}

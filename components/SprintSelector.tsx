"use client";

import type { JiraSprint } from "@/types/jira";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatSprintDateRange,
  formatSprintOptionLabel,
  formatSprintStateLabel,
  sortSprintsForDisplay,
} from "@/lib/sprint-selection";
export function SprintSelector({
  sprints,
  selectedSprintId,
  onSelect,
  loading,
  error,
  disabled,
  selectedSprintMeta,
  totalTasksLoaded,
}: {
  sprints: JiraSprint[];
  selectedSprintId: number | null;
  onSelect: (sprintId: number) => void;
  loading?: boolean;
  error?: string | null;
  disabled?: boolean;
  selectedSprintMeta?: {
    name: string;
    state?: string | null;
    startDate?: string | null;
    endDate?: string | null;
  };
  totalTasksLoaded?: number;
}) {
  const ordered = sortSprintsForDisplay(sprints);
  const value =
    selectedSprintId != null ? String(selectedSprintId) : undefined;

  return (
    <div className="space-y-2 rounded-lg border border-neutral-200 bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-[240px] flex-1 space-y-1.5">
          <Label htmlFor="sprint-select">Sprint</Label>
          <Select
            value={value}
            onValueChange={(v) => onSelect(Number(v))}
            disabled={disabled || loading || ordered.length === 0}
          >
            <SelectTrigger id="sprint-select" className="w-full sm:max-w-xl">
              <SelectValue
                placeholder={
                  loading
                    ? "Loading sprints…"
                    : ordered.length === 0
                      ? "No sprints"
                      : "Select sprint"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {ordered.map((sprint) => (
                <SelectItem key={sprint.id} value={String(sprint.id)}>
                  {formatSprintOptionLabel(sprint)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {error ? (
            <p className="text-xs text-red-600" role="alert">
              {error}
            </p>
          ) : null}
        </div>
        {selectedSprintMeta ? (
          <div className="text-sm text-neutral-600">
            <p>
              <span className="text-neutral-500">Status:</span>{" "}
              <strong className="text-neutral-900">
                {selectedSprintMeta.state
                  ? formatSprintStateLabel(selectedSprintMeta.state)
                  : "—"}
              </strong>
            </p>
            <p>
              <span className="text-neutral-500">Dates:</span>{" "}
              {selectedSprintMeta.startDate || selectedSprintMeta.endDate
                ? formatSprintDateRange({
                    id: 0,
                    name: "",
                    state: "",
                    startDate: selectedSprintMeta.startDate ?? undefined,
                    endDate: selectedSprintMeta.endDate ?? undefined,
                  })
                : "—"}
            </p>
            {totalTasksLoaded != null ? (
              <p>
                <span className="text-neutral-500">Tickets in sprint:</span>{" "}
                <strong className="text-neutral-900">{totalTasksLoaded}</strong>
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

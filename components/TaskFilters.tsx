"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  defaultFilters,
  type TaskFiltersState,
} from "@/lib/filters";

export function TaskFilters({
  filters,
  onChange,
  assignees,
  resultCount,
}: {
  filters: TaskFiltersState;
  onChange: (next: TaskFiltersState) => void;
  assignees: { id: string; name: string }[];
  resultCount: number;
}) {
  const set = (partial: Partial<TaskFiltersState>) =>
    onChange({ ...filters, ...partial });

  return (
    <div className="space-y-4 rounded-lg border border-neutral-200 bg-white p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-sm text-neutral-600">
          Showing <strong>{resultCount}</strong> task
          {resultCount === 1 ? "" : "s"}
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange({ ...defaultFilters })}
        >
          Clear filters
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <div className="space-y-1.5">
          <Label>Assignee</Label>
          <Select
            value={filters.assignee}
            onValueChange={(v) => set({ assignee: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="me">Me</SelectItem>
              {assignees.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Jira status</Label>
          <Select
            value={filters.jiraStatus}
            onValueChange={(v) =>
              set({ jiraStatus: v as TaskFiltersState["jiraStatus"] })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Story points</Label>
          <Input
            inputMode="decimal"
            placeholder="Exact points"
            value={filters.storyPoints}
            onChange={(e) => set({ storyPoints: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Ticket ID</Label>
          <Input
            placeholder="PROJ-123"
            value={filters.ticketIdSearch}
            onChange={(e) => set({ ticketIdSearch: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Title</Label>
          <Input
            placeholder="Search title"
            value={filters.titleSearch}
            onChange={(e) => set({ titleSearch: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

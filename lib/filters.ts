import type { SprintTask } from "@/types/task";

export interface TaskFiltersState {
  assignee: "me" | "all" | string;
  jiraStatus: "all" | "todo" | "in_progress" | "done";
  storyPoints: string;
  ticketIdSearch: string;
  titleSearch: string;
}

export const defaultFilters: TaskFiltersState = {
  assignee: "all",
  jiraStatus: "all",
  storyPoints: "",
  ticketIdSearch: "",
  titleSearch: "",
};

function statusCategoryMatches(
  category: string | null,
  filter: TaskFiltersState["jiraStatus"],
): boolean {
  if (filter === "all") return true;
  const cat = (category ?? "").toLowerCase();
  if (filter === "todo") return cat === "new" || cat === "undefined";
  if (filter === "in_progress") return cat === "indeterminate";
  if (filter === "done") return cat === "done";
  return true;
}

export function applyTaskFilters(
  tasks: SprintTask[],
  filters: TaskFiltersState,
  currentUserAccountId: string | null,
): SprintTask[] {
  return tasks.filter((task) => {
    if (filters.assignee === "me") {
      if (!currentUserAccountId || task.assigneeAccountId !== currentUserAccountId) {
        return false;
      }
    } else if (filters.assignee !== "all") {
      if (task.assigneeAccountId !== filters.assignee) return false;
    }

    if (!statusCategoryMatches(task.statusCategory, filters.jiraStatus)) {
      return false;
    }

    if (filters.storyPoints.trim() !== "") {
      const sp = Number(filters.storyPoints);
      if (!Number.isNaN(sp) && task.storyPoints !== sp) return false;
    }

    if (filters.ticketIdSearch.trim()) {
      const q = filters.ticketIdSearch.trim().toUpperCase();
      if (!task.issueKey.toUpperCase().includes(q)) return false;
    }

    if (filters.titleSearch.trim()) {
      const q = filters.titleSearch.trim().toLowerCase();
      if (!task.title.toLowerCase().includes(q)) return false;
    }

    return true;
  });
}

export function collectAssignees(tasks: SprintTask[]): { id: string; name: string }[] {
  const map = new Map<string, string>();
  for (const t of tasks) {
    if (t.assigneeAccountId) {
      map.set(t.assigneeAccountId, t.assignee);
    }
  }
  return [...map.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

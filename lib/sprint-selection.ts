import type { JiraSprint } from "@/types/jira";
import { formatDisplayDate } from "@/lib/date-utils";

export function pickDefaultSprintId(
  sprints: JiraSprint[],
  storedSprintId: number | null,
): number | null {
  if (storedSprintId != null) {
    const exists = sprints.some((s) => s.id === storedSprintId);
    if (exists) return storedSprintId;
  }
  const active = sprints.find(
    (s) => s.state.toLowerCase() === "active",
  );
  if (active) return active.id;
  return sprints[0]?.id ?? null;
}

export function formatSprintStateLabel(state: string): string {
  return state.replace(/_/g, " ").toUpperCase();
}

export function formatSprintDateRange(sprint: JiraSprint): string {
  const start = formatDisplayDate(sprint.startDate);
  const end = formatDisplayDate(sprint.endDate);
  if (start === "-" && end === "-") return "";
  if (start === "-") return `→ ${end}`;
  if (end === "-") return `${start} →`;
  return `${start} → ${end}`;
}

export function formatSprintOptionLabel(sprint: JiraSprint): string {
  const state = formatSprintStateLabel(sprint.state);
  const dates = formatSprintDateRange(sprint);
  return dates
    ? `${sprint.name} · ${state} · ${dates}`
    : `${sprint.name} · ${state}`;
}

export function sortSprintsForDisplay(sprints: JiraSprint[]): JiraSprint[] {
  const stateOrder = (state: string) => {
    const s = state.toLowerCase();
    if (s === "active") return 0;
    if (s === "future") return 1;
    return 2;
  };

  return [...sprints].sort((a, b) => {
    const order = stateOrder(a.state) - stateOrder(b.state);
    if (order !== 0) return order;
    const aTime = Date.parse(a.startDate ?? "") || 0;
    const bTime = Date.parse(b.startDate ?? "") || 0;
    return bTime - aTime;
  });
}

export function sprintReportQueryKeyParts(
  sprintId: number | null,
  configVersion: number,
  configHash: string,
): (string | number | null)[] {
  return ["sprint-report", configHash, configVersion, sprintId];
}

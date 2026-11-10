import { describe, expect, it } from "vitest";
import type { JiraSprint } from "@/types/jira";
import {
  formatSprintOptionLabel,
  pickDefaultSprintId,
  sortSprintsForDisplay,
  sprintReportQueryKeyParts,
} from "./sprint-selection";

const active: JiraSprint = {
  id: 1,
  name: "Sprint 10",
  state: "active",
  startDate: "2026-01-01",
  endDate: "2026-01-14",
};

const closed: JiraSprint = {
  id: 2,
  name: "Sprint 9",
  state: "closed",
  startDate: "2025-12-01",
  endDate: "2025-12-14",
};

const future: JiraSprint = {
  id: 3,
  name: "Sprint 11",
  state: "future",
  startDate: "2026-02-01",
  endDate: "2026-02-14",
};

describe("pickDefaultSprintId", () => {
  it("defaults to active sprint", () => {
    expect(pickDefaultSprintId([closed, active, future], null)).toBe(1);
  });

  it("keeps valid stored closed sprint", () => {
    expect(pickDefaultSprintId([closed, active, future], 2)).toBe(2);
  });

  it("keeps valid stored future sprint", () => {
    expect(pickDefaultSprintId([closed, active, future], 3)).toBe(3);
  });

  it("falls back to active when stored sprint is missing", () => {
    expect(pickDefaultSprintId([closed, active], 999)).toBe(1);
  });

  it("returns null for empty sprint list", () => {
    expect(pickDefaultSprintId([], null)).toBeNull();
  });
});

describe("sortSprintsForDisplay", () => {
  it("orders active before future before closed", () => {
    const sorted = sortSprintsForDisplay([closed, future, active]);
    expect(sorted.map((s) => s.id)).toEqual([1, 3, 2]);
  });
});

describe("formatSprintOptionLabel", () => {
  it("includes name, state, and dates", () => {
    expect(formatSprintOptionLabel(active)).toContain("Sprint 10");
    expect(formatSprintOptionLabel(active)).toContain("ACTIVE");
  });
});

describe("sprintReportQueryKeyParts", () => {
  it("includes sprint id for per-sprint cache", () => {
    expect(sprintReportQueryKeyParts(42, 1, "{}")).toEqual([
      "sprint-report",
      "{}",
      1,
      42,
    ]);
  });

  it("changes key when sprint changes", () => {
    const a = sprintReportQueryKeyParts(1, 0, "x").join("|");
    const b = sprintReportQueryKeyParts(2, 0, "x").join("|");
    expect(a).not.toBe(b);
  });
});

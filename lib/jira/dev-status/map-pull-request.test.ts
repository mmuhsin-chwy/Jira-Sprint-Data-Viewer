import { describe, expect, it } from "vitest";
import {
  mapJiraDevStatusState,
  mapRawDevStatusPull,
  parsePullNumber,
} from "./map-pull-request";

const AP1_5271_MERGED = {
  author: { name: "Mark Libby" },
  id: "#343",
  name: "Feature/ap1 5271 oms regression scenarios",
  status: "MERGED",
  url: "https://github.com/Chewy-Inc/autoship-external-event-processors/pull/343",
  lastUpdate: "2026-11-06T19:32:33.000+0000",
  repositoryName: "Chewy-Inc/autoship-external-event-processors",
};

const AP1_5271_DECLINED = {
  ...AP1_5271_MERGED,
  id: "#344",
  name: "merge lib changes to main",
  status: "DECLINED",
  url: "https://github.com/Chewy-Inc/autoship-external-event-processors/pull/344",
  lastUpdate: "2026-11-06T17:24:56.000+0000",
};

describe("parsePullNumber", () => {
  it("parses from GitHub URL", () => {
    expect(
      parsePullNumber(
        "https://github.com/Chewy-Inc/autoship-external-event-processors/pull/343",
        "#343",
      ),
    ).toBe(343);
  });
});

describe("mapJiraDevStatusState", () => {
  it("maps DECLINED to CLOSED", () => {
    expect(mapJiraDevStatusState("DECLINED")).toBe("CLOSED");
  });
});

describe("mapRawDevStatusPull", () => {
  it("maps Chewy GitHub for Jira integration payload", () => {
    const mapped = mapRawDevStatusPull(AP1_5271_MERGED);
    expect(mapped).toMatchObject({
      number: 343,
      state: "MERGED",
      repository: "Chewy-Inc/autoship-external-event-processors",
      updatedAt: "2026-11-06T19:32:33.000+0000",
      source: "jira",
    });
    expect(mapped?.additions).toBeNull();
    expect(mapped?.mergedAt).toBeNull();
  });

  it("does not fabricate LOC", () => {
    const mapped = mapRawDevStatusPull(AP1_5271_MERGED);
    expect(mapped?.totalChanges).toBeNull();
  });

  it("maps declined PRs", () => {
    const mapped = mapRawDevStatusPull(AP1_5271_DECLINED);
    expect(mapped?.state).toBe("CLOSED");
    expect(mapped?.number).toBe(344);
  });
});

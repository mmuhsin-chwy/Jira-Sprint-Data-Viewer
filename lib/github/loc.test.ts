import { describe, expect, it } from "vitest";
import { computeTotalChanges, formatLocSummary } from "./loc";

describe("LOC calculation", () => {
  it("computes totalChanges as additions plus deletions", () => {
    expect(computeTotalChanges(140, 4)).toBe(144);
  });

  it("formats LOC summary", () => {
    expect(formatLocSummary(140, 4)).toBe("LOC: 144 (140 + 4)");
  });

  it("returns null when LOC is unknown", () => {
    expect(formatLocSummary(null, 4)).toBeNull();
    expect(formatLocSummary(1, undefined)).toBeNull();
  });
});

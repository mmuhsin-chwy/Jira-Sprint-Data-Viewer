import { describe, expect, it } from "vitest";
import { formatPullRequestsForExport } from "./pr-export";

describe("formatPullRequestsForExport", () => {
  it("returns empty strings when no PRs", () => {
    expect(formatPullRequestsForExport(undefined)).toEqual({
      pullRequestSummary: "",
      pullRequestLinks: "",
    });
  });

  it("formats multiple PRs", () => {
    const result = formatPullRequestsForExport([
      {
        number: 343,
        title: "feat",
        url: "https://github.com/org/repo/pull/343",
        repository: "org/repo",
        state: "MERGED",
      },
      {
        number: 344,
        title: "fix",
        url: "https://github.com/org/repo/pull/344",
        repository: "org/repo",
        state: "CLOSED",
      },
    ]);
    expect(result.pullRequestSummary).toBe("#343 MERGED; #344 CLOSED");
    expect(result.pullRequestLinks).toBe(
      "https://github.com/org/repo/pull/343 | https://github.com/org/repo/pull/344",
    );
  });
});

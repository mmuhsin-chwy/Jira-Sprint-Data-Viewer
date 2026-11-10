import { describe, expect, it } from "vitest";
import {
  extractIssueKeysFromText,
  issueKeyInPullRequestText,
  parsePullUrl,
  pullRequestDedupeKey,
} from "./issue-matching";

describe("issue key extraction", () => {
  it("finds keys in title and branch", () => {
    expect(
      issueKeyInPullRequestText(
        "AP4-4755",
        "feat: AP4-4755 upgrade",
        null,
        "feature/AP4-4755-react-query",
      ),
    ).toBe(true);
  });

  it("returns false when key absent", () => {
    expect(
      issueKeyInPullRequestText("AP4-1", "unrelated", null, "main"),
    ).toBe(false);
  });

  it("extracts multiple keys", () => {
    expect(extractIssueKeysFromText("AP4-1 and AP1-2")).toEqual([
      "AP4-1",
      "AP1-2",
    ]);
  });
});

describe("parsePullUrl", () => {
  it("parses github pull urls", () => {
    expect(
      parsePullUrl("https://github.com/acme/payments/pull/123"),
    ).toEqual({ owner: "acme", repo: "payments", number: 123 });
  });
});

describe("dedupe", () => {
  it("uses stable dedupe keys", () => {
    expect(pullRequestDedupeKey("Acme", "Repo", 5)).toBe("acme/repo#5");
  });
});

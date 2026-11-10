import { describe, expect, it } from "vitest";
import { collectPullRefsForIssue } from "./associate";
import type { ListedPull } from "./pull-requests";

const index: ListedPull[] = [
  {
    number: 123,
    title: "feat: upgrade React Query AP4-4755",
    html_url: "https://github.com/org/repo/pull/123",
    state: "closed",
    created_at: "",
    updated_at: "",
    merged_at: "2026-01-01",
    user: { login: "dev" },
    body: null,
    head: { ref: "feature/AP4-4755" },
    repo: "repo",
  },
  {
    number: 99,
    title: "docs",
    html_url: "https://github.com/org/repo/pull/99",
    state: "open",
    created_at: "",
    updated_at: "",
    merged_at: null,
    user: { login: "dev" },
    body: null,
    head: { ref: "docs" },
    repo: "repo",
  },
];

describe("collectPullRefsForIssue", () => {
  it("returns empty for ticket with no PRs", () => {
    expect(
      collectPullRefsForIssue("AP4-9999", "org", [], index),
    ).toEqual([]);
  });

  it("matches one PR from index", () => {
    const refs = collectPullRefsForIssue("AP4-4755", "org", [], index);
    expect(refs).toHaveLength(1);
    expect(refs[0].number).toBe(123);
  });

  it("merges dev panel and index without duplicates", () => {
    const refs = collectPullRefsForIssue(
      "AP4-4755",
      "org",
      [
        {
          url: "https://github.com/org/repo/pull/123",
          number: 123,
        },
      ],
      index,
    );
    expect(refs).toHaveLength(1);
  });

  it("supports multiple PRs for one ticket", () => {
    const multi = [
      ...index,
      {
        ...index[0],
        number: 200,
        title: "AP4-4755 follow-up",
        html_url: "https://github.com/org/repo/pull/200",
      },
    ];
    const refs = collectPullRefsForIssue("AP4-4755", "org", [], multi);
    expect(refs.map((r) => r.number).sort()).toEqual([123, 200]);
  });
});

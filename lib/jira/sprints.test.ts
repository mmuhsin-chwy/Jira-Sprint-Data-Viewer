import { describe, expect, it, vi, beforeEach } from "vitest";
import type { JiraSessionAuth } from "@/lib/session";
import { listBoardSprints } from "./sprints";

vi.mock("./client", () => ({
  jiraJson: vi.fn(),
}));

import { jiraJson } from "./client";

const auth = { authType: "token", accessToken: "x" } as JiraSessionAuth;

describe("listBoardSprints", () => {
  beforeEach(() => {
    vi.mocked(jiraJson).mockReset();
  });

  it("paginates until isLast", async () => {
    vi.mocked(jiraJson)
      .mockResolvedValueOnce({
        values: Array.from({ length: 50 }, (_, i) => ({
          id: i + 1,
          name: `S${i + 1}`,
          state: "closed",
        })),
        isLast: false,
        total: 51,
      })
      .mockResolvedValueOnce({
        values: [{ id: 51, name: "B", state: "active" }],
        isLast: true,
        total: 51,
      });

    const sprints = await listBoardSprints(auth, 99);
    expect(sprints).toHaveLength(51);
    expect(jiraJson).toHaveBeenCalledTimes(2);
    expect(vi.mocked(jiraJson).mock.calls[1][1]).toContain("startAt=50");
  });

  it("returns empty list on empty board", async () => {
    vi.mocked(jiraJson).mockResolvedValueOnce({
      values: [],
      isLast: true,
    });
    expect(await listBoardSprints(auth, 1)).toEqual([]);
  });
});

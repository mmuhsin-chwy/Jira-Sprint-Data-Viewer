import { describe, expect, it } from "vitest";
import { toGitHubPrState } from "./state";

describe("PR state mapping", () => {
  it("maps merged", () => {
    expect(toGitHubPrState(true, "closed")).toBe("MERGED");
  });

  it("maps open", () => {
    expect(toGitHubPrState(false, "open")).toBe("OPEN");
  });

  it("maps closed without merge", () => {
    expect(toGitHubPrState(false, "closed")).toBe("CLOSED");
  });
});

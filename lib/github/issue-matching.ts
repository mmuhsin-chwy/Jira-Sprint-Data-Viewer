const ISSUE_KEY_REGEX = /\b([A-Z][A-Z0-9]+-\d+)\b/g;

export function extractIssueKeysFromText(text: string | null | undefined): string[] {
  if (!text) return [];
  const keys = new Set<string>();
  for (const match of text.matchAll(ISSUE_KEY_REGEX)) {
    keys.add(match[1].toUpperCase());
  }
  return [...keys];
}

export function issueKeyInPullRequestText(
  issueKey: string,
  title: string,
  body: string | null,
  headRef: string | null | undefined,
): boolean {
  const key = issueKey.toUpperCase();
  const haystack = `${title}\n${body ?? ""}\n${headRef ?? ""}`;
  return extractIssueKeysFromText(haystack).includes(key);
}

export function parsePullUrl(url: string): {
  owner: string;
  repo: string;
  number: number;
} | null {
  const match = url.match(
    /github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/i,
  );
  if (!match) return null;
  return {
    owner: match[1],
    repo: match[2],
    number: Number(match[3]),
  };
}

export function pullRequestDedupeKey(
  owner: string,
  repo: string,
  number: number,
): string {
  return `${owner.toLowerCase()}/${repo.toLowerCase()}#${number}`;
}

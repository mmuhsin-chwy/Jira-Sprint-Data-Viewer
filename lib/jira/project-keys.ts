/** Parse comma-, space-, or semicolon-separated Jira project keys. */
export function parseProjectKeys(value: string | undefined | null): string[] {
  if (!value?.trim()) return [];
  const keys = value
    .split(/[,;\s]+/)
    .map((k) => k.trim().toUpperCase())
    .filter(Boolean);
  return [...new Set(keys)];
}

export function issueMatchesProjectKeys(
  issueKey: string,
  projectKeys: string[],
): boolean {
  if (projectKeys.length === 0) return true;
  const upper = issueKey.toUpperCase();
  return projectKeys.some((pk) => upper.startsWith(`${pk}-`));
}

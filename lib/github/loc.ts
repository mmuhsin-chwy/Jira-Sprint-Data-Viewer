export function computeTotalChanges(
  additions: number,
  deletions: number,
): number {
  return additions + deletions;
}

export function formatLocSummary(
  additions: number | null | undefined,
  deletions: number | null | undefined,
): string | null {
  if (additions == null || deletions == null) return null;
  const total = computeTotalChanges(additions, deletions);
  return `LOC: ${total} (${additions} + ${deletions})`;
}

function normalizeStatusName(name: string): string {
  return name.trim().toLowerCase().replace(/['’`]/g, "");
}

const EXCLUDED_STATUSES = new Set(["wont do"]);

export function isExcludedJiraStatus(statusName: string): boolean {
  return EXCLUDED_STATUSES.has(normalizeStatusName(statusName));
}

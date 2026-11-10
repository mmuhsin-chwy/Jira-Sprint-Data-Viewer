const PREFIX = "[jira-dev-status]";

export function isDevStatusDebugEnabled(): boolean {
  return (
    process.env.DEBUG_JIRA_DEV_STATUS === "1" ||
    process.env.NODE_ENV === "development"
  );
}

export function devStatusLog(
  message: string,
  context?: Record<string, string | number | boolean | null | undefined>,
): void {
  if (!isDevStatusDebugEnabled()) return;
  if (context && Object.keys(context).length > 0) {
    console.info(PREFIX, message, context);
  } else {
    console.info(PREFIX, message);
  }
}

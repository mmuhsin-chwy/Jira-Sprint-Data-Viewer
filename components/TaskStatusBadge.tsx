import { Badge } from "@/components/ui/badge";

export function TaskStatusBadge({ status }: { status: string }) {
  const lower = status.toLowerCase();
  let variant: "default" | "success" | "warning" | "muted" = "default";
  if (lower.includes("done") || lower.includes("closed")) variant = "success";
  else if (lower.includes("progress")) variant = "warning";
  else if (lower.includes("to do") || lower.includes("todo")) variant = "muted";

  return <Badge variant={variant}>{status}</Badge>;
}

import { jiraJson } from "./client";
import type { JiraSessionAuth } from "@/lib/session";

interface JiraField {
  id: string;
  name: string;
  custom: boolean;
  schema?: { type?: string; custom?: string };
}

const STORY_POINTS_NAMES = [
  "story point estimate",
  "story points",
  "story point",
  "points",
];

export async function discoverStoryPointsFieldId(
  auth: JiraSessionAuth,
): Promise<string | null> {
  const fields = await jiraJson<JiraField[]>(auth, "/rest/api/3/field");
  const match = fields.find(
    (f) =>
      f.custom &&
      STORY_POINTS_NAMES.some((n) => f.name.toLowerCase().includes(n)),
  );
  return match?.id ?? null;
}

import { NextResponse } from "next/server";
import { ensureJiraAuth } from "@/lib/jira/auth-refresh";
import { discoverStoryPointsFieldId } from "@/lib/jira/fields";

export async function POST() {
  const auth = await ensureJiraAuth();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const fieldId = await discoverStoryPointsFieldId(auth);
  if (!fieldId) {
    return NextResponse.json(
      { error: "Could not auto-discover story points field." },
      { status: 404 },
    );
  }
  return NextResponse.json({ storyPointsFieldId: fieldId });
}

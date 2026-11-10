import { redirect } from "next/navigation";
import { isJiraAuthenticated } from "@/lib/jira/auth-refresh";
import { SprintReport } from "@/components/SprintReport";

export default async function HomePage() {
  if (!(await isJiraAuthenticated())) {
    redirect("/login");
  }
  return <SprintReport />;
}

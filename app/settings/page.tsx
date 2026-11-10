import Link from "next/link";
import { redirect } from "next/navigation";
import { isJiraAuthenticated } from "@/lib/jira/auth-refresh";
import { SettingsForm } from "@/components/SettingsForm";
import { Button } from "@/components/ui/button";

export default async function SettingsPage() {
  if (!(await isJiraAuthenticated())) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-4xl flex-1 px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-sm text-neutral-600">
            Defaults from server env; your edits are saved in this browser only.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/">Back to report</Link>
        </Button>
      </div>
      <SettingsForm />
    </div>
  );
}

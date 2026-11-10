import { redirect } from "next/navigation";
import { isEnvJiraAuthConfigured } from "@/lib/jira/env-config";
import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  if (isEnvJiraAuthConfigured()) {
    redirect("/");
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <LoginForm />
    </div>
  );
}

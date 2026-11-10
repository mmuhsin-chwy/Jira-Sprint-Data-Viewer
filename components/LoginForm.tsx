"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function LoginFormInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get("error");
  const [jiraBaseUrl, setJiraBaseUrl] = useState("");
  const [jiraEmail, setJiraEmail] = useState("");
  const [jiraApiToken, setJiraApiToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function tokenLogin() {
    setLoading(true);
    setFormError(null);
    try {
      const res = await fetch("/api/auth/jira/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jiraBaseUrl, jiraEmail, jiraApiToken }),
      });
      if (!res.ok) {
        setFormError("Invalid credentials. Check URL, email, and API token.");
        return;
      }
      router.push("/settings");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Connect to Jira</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Jira Sprint Task Viewer — authenticate to load your active sprint.
        </p>
      </div>

      {(error || formError) && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {formError ?? `Authentication error: ${error}`}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Atlassian OAuth (recommended)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-neutral-600">
            Sign in with your company Atlassian account when OAuth is configured
            in environment variables.
          </p>
          <Button asChild>
            <a href="/api/auth/jira/login">Connect with Atlassian</a>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">API token (development)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              void tokenLogin();
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="baseUrl">Jira base URL</Label>
              <Input
                id="baseUrl"
                required
                placeholder="https://yourcompany.atlassian.net"
                value={jiraBaseUrl}
                onChange={(e) => setJiraBaseUrl(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Atlassian account email</Label>
              <Input
                id="email"
                type="email"
                required
                value={jiraEmail}
                onChange={(e) => setJiraEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="token">API token</Label>
              <Input
                id="token"
                type="password"
                required
                autoComplete="off"
                value={jiraApiToken}
                onChange={(e) => setJiraApiToken(e.target.value)}
              />
            </div>
            <Button type="submit" variant="outline" disabled={loading}>
              {loading ? "Connecting…" : "Connect with API token"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-neutral-500">
        Or set <code className="text-neutral-700">JIRA_*</code> variables in{" "}
        <code className="text-neutral-700">.env.local</code> for server-side
        auth.{" "}
        <Link href="/" className="underline">
          Home
        </Link>
      </p>
    </div>
  );
}

export function LoginForm() {
  return (
    <Suspense fallback={<p className="text-sm text-neutral-500">Loading…</p>}>
      <LoginFormInner />
    </Suspense>
  );
}

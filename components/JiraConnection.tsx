"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function JiraConnection({
  userDisplayName,
}: {
  userDisplayName?: string;
}) {
  const router = useRouter();

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-600">
      <span>
        Jira:{" "}
        <strong className="text-neutral-900">
          {userDisplayName ?? "Not connected"}
        </strong>
      </span>
      <Link href="/settings">
        <Button variant="ghost" size="sm">
          Settings
        </Button>
      </Link>
      {userDisplayName ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            router.push("/login");
            router.refresh();
          }}
        >
          Log out
        </Button>
      ) : null}
    </div>
  );
}

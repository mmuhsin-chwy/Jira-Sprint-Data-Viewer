"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { JiraBoard } from "@/types/jira";
import {
  useLocalJiraConfig,
  type LocalConfigForm,
} from "@/hooks/use-local-jira-config";
import { hasUserConfigOverrides } from "@/lib/jira/merge-config";

function SettingsFields({
  initial,
  envAuth,
  boards,
  hasOverrides,
  onSave,
  onReset,
}: {
  initial: LocalConfigForm;
  envAuth: boolean;
  boards: JiraBoard[];
  hasOverrides: boolean;
  onSave: (form: LocalConfigForm) => void;
  onReset: () => void;
}) {
  const [form, setForm] = useState(initial);
  const [message, setMessage] = useState<string | null>(null);

  const update = (partial: Partial<LocalConfigForm>) =>
    setForm((f) => ({ ...f, ...partial }));

  async function discoverStoryPoints() {
    const res = await fetch("/api/settings/discover-story-points", {
      method: "POST",
    });
    const data = await res.json();
    if (res.ok) {
      update({ storyPointsFieldId: data.storyPointsFieldId });
      setMessage("Story points field discovered. Save to store in this browser.");
    } else {
      setMessage(data.error ?? "Discovery failed.");
    }
  }

  return (
  <div className="mx-auto max-w-2xl space-y-6">
    <p className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">
      {envAuth ? "Jira API credentials stay on the server (env). " : ""}
      Board and filters default from env; changes you save here are stored in{" "}
      <strong>localStorage</strong> on this browser only.
      {hasOverrides ? " (Local overrides active.)" : ""}
    </p>

    <div className="space-y-4 rounded-lg border border-neutral-200 bg-white p-6">
      <h2 className="text-lg font-semibold">Jira</h2>
      <div className="space-y-1.5">
        <Label htmlFor="jiraBaseUrl">Jira base URL</Label>
        <Input
          id="jiraBaseUrl"
          value={form.jiraBaseUrl}
          onChange={(e) => update({ jiraBaseUrl: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Board</Label>
        <Select
          value={form.boardId || "none"}
          onValueChange={(v) => update({ boardId: v === "none" ? "" : v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select board" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">—</SelectItem>
            {boards.map((b) => (
              <SelectItem key={b.id} value={String(b.id)}>
                {b.name} ({b.id})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="Board ID"
          value={form.boardId}
          onChange={(e) => update({ boardId: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="projectKey">Project keys (optional)</Label>
        <Input
          id="projectKey"
          placeholder="AP4, AP1"
          value={form.projectKey}
          onChange={(e) => update({ projectKey: e.target.value })}
        />
      </div>
      <div className="flex gap-2">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="spField">Story points custom field ID</Label>
          <Input
            id="spField"
            value={form.storyPointsFieldId}
            onChange={(e) => update({ storyPointsFieldId: e.target.value })}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          className="mt-6"
          onClick={() => void discoverStoryPoints()}
        >
          Auto-discover
        </Button>
      </div>
    </div>

    {message && (
      <p className="text-sm text-neutral-700" role="status">
        {message}
      </p>
    )}
    <div className="flex flex-wrap gap-2">
      <Button
        onClick={() => {
          onSave(form);
          setMessage("Settings saved in this browser only.");
        }}
      >
        Save settings (this browser)
      </Button>
      <Button
        variant="outline"
        onClick={() => {
          onReset();
          setMessage("Cleared local overrides; using environment defaults.");
        }}
      >
        Reset to env defaults
      </Button>
    </div>
  </div>
);
}

export function SettingsForm() {
  const {
    ready,
    overrides,
    formFromEffective,
    saveForm,
    clearLocalOverrides,
    storageRevision,
  } = useLocalJiraConfig();

  const [boards, setBoards] = useState<JiraBoard[]>([]);
  const [envAuth, setEnvAuth] = useState(false);

  useEffect(() => {
    void fetch("/api/jira/config-defaults").then((r) =>
      r.json().then((d) => setEnvAuth(Boolean(d.envAuth))),
    );
    void fetch("/api/jira/boards").then((r) => {
      if (r.ok) void r.json().then(setBoards);
    });
  }, []);

  if (!ready) {
    return <p className="text-sm text-neutral-500">Loading settings…</p>;
  }

  const hasOverrides = hasUserConfigOverrides(overrides);

  return (
    <SettingsFields
      key={`${storageRevision}-${formFromEffective.boardId}-${formFromEffective.projectKey}`}
      initial={formFromEffective}
      envAuth={envAuth}
      boards={boards}
      hasOverrides={hasOverrides}
      onSave={saveForm}
      onReset={() => {
        clearLocalOverrides();
      }}
    />
  );
}

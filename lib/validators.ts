import { z } from "zod";

export const settingsSchema = z.object({
  jiraBaseUrl: z.string().url().optional().or(z.literal("")),
  boardId: z.coerce.number().int().positive().optional().nullable(),
  projectKey: z.string().optional(),
  storyPointsFieldId: z.string().optional(),
  jiraEmail: z.string().email().optional(),
  jiraApiToken: z.string().optional(),
});

export const jiraTokenLoginSchema = z.object({
  jiraBaseUrl: z.string().url(),
  jiraEmail: z.string().email(),
  jiraApiToken: z.string().min(1),
});

export const exportBodySchema = z.object({
  tasks: z.array(z.unknown()),
  filters: z.record(z.string(), z.unknown()).optional(),
});

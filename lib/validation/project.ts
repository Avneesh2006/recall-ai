import { z } from "zod";

const STATUS_VALUES = ["active", "completed", "archived"] as const;

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, "Give it a name").max(80),
  description: z.string().trim().max(500).optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().trim().min(1, "Name can't be empty").max(80).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  status: z.enum(STATUS_VALUES).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

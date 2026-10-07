import { z } from "zod";

const PRIORITY_VALUES = ["low", "normal", "high"] as const;

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Give it a title").max(200),
  priority: z.enum(PRIORITY_VALUES).optional(),
  due_date: z.string().trim().min(1).optional(), // YYYY-MM-DD
  project_id: z.string().uuid().nullable().optional(),
  // When set, the task is auto-linked back to this saved item on
  // creation — this is the "Turn into task" flow (Section 5 Flow D).
  saved_item_id: z.string().uuid().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1, "Title can't be empty").max(200).optional(),
  priority: z.enum(PRIORITY_VALUES).optional(),
  due_date: z.string().trim().nullable().optional(),
  project_id: z.string().uuid().nullable().optional(),
  is_complete: z.boolean().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

import { z } from "zod";

export const createCollectionSchema = z.object({
  name: z.string().trim().min(1, "Give it a name").max(80),
  description: z.string().trim().max(300).optional(),
  icon: z.string().trim().max(8).optional(),
  accent_color: z.string().trim().max(20).optional(),
});

export const updateCollectionSchema = z.object({
  name: z.string().trim().min(1, "Name can't be empty").max(80).optional(),
  description: z.string().trim().max(300).nullable().optional(),
  icon: z.string().trim().max(8).nullable().optional(),
  accent_color: z.string().trim().max(20).nullable().optional(),
});

export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;
export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>;

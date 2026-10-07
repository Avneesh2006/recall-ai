import { z } from "zod";

const REASON_TAG_VALUES = [
  "inspiration",
  "learn_later",
  "use_in_project",
  "research",
  "content_idea",
  "buy_later",
  "reference",
  "just_interesting",
] as const;

export const createSavedItemSchema = z.discriminatedUnion("input_type", [
  z.object({
    input_type: z.literal("url"),
    url: z.string().trim().url("Enter a valid URL"),
  }),
  z.object({
    input_type: z.literal("note"),
    title: z.string().trim().min(1, "Give it a short title").max(200),
    description: z.string().trim().max(10_000).optional(),
  }),
  z.object({
    input_type: z.literal("image"),
    storage_path: z.string().trim().min(1),
    title: z.string().trim().max(200).optional(),
    thumbnail_url: z.string().trim().url().optional(),
    url: z.string().trim().url().optional(),
    content_type: z.string().trim().max(50).optional(),
    content_text: z.string().max(20_000).nullable().optional(),
  }),
  z.object({
    input_type: z.literal("file"),
    storage_path: z.string().trim().min(1),
    title: z.string().trim().max(200).optional(),
    thumbnail_url: z.string().trim().url().optional(),
    url: z.string().trim().url().optional(),
    content_type: z.string().trim().max(50).optional(),
    content_text: z.string().max(20_000).nullable().optional(),
  }),
]);

export const updateSavedItemSchema = z.object({
  title: z.string().trim().min(1, "Title can't be empty").max(200).optional(),
  reason_tag: z.enum(REASON_TAG_VALUES).nullable().optional(),
  what_was_i_thinking: z.string().trim().max(2000).nullable().optional(),
  collection_id: z.string().uuid().nullable().optional(),
  project_id: z.string().uuid().nullable().optional(),
  is_favorite: z.boolean().optional(),
  is_archived: z.boolean().optional(),
});

export type CreateSavedItemInput = z.infer<typeof createSavedItemSchema>;
export type UpdateSavedItemInput = z.infer<typeof updateSavedItemSchema>;

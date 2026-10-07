export type InputType = "url" | "note" | "image" | "file";

export type ReasonTag =
  | "inspiration"
  | "learn_later"
  | "use_in_project"
  | "research"
  | "content_idea"
  | "buy_later"
  | "reference"
  | "just_interesting";

export type AiStatus = "pending" | "processing" | "done" | "skipped" | "failed";

export interface SavedItem {
  id: string;
  user_id: string;
  input_type: InputType;
  url: string | null;
  title: string | null;
  description: string | null;
  thumbnail_url: string | null;
  favicon_url: string | null;
  source_domain: string | null;
  content_type: string | null;
  storage_path: string | null;
  source_media_url: string | null;
  content_text: string | null;
  ai_content: string | null;
  reason_tag: ReasonTag | null;
  what_was_i_thinking: string | null;
  ai_category: string | null;
  ai_summary: string | null;
  ai_possible_use: string | null;
  ai_processed_at: string | null;
  ai_status: AiStatus;
  collection_id: string | null;
  project_id: string | null;
  is_favorite: boolean;
  is_archived: boolean;
  saved_at: string;
  updated_at: string;
}

export type ProjectStatus = "active" | "completed" | "archived";

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export type TaskPriority = "low" | "normal" | "high";

export interface Task {
  id: string;
  user_id: string;
  title: string;
  is_complete: boolean;
  priority: TaskPriority;
  due_date: string | null;
  project_id: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  icon: string | null;
  accent_color: string | null;
  created_at: string;
  updated_at: string;
}

export const REASON_TAGS: { value: ReasonTag; label: string }[] = [
  { value: "inspiration", label: "Inspiration" },
  { value: "learn_later", label: "Learn Later" },
  { value: "use_in_project", label: "Use in a Project" },
  { value: "research", label: "Research" },
  { value: "content_idea", label: "Content Idea" },
  { value: "buy_later", label: "Buy Later" },
  { value: "reference", label: "Reference" },
  { value: "just_interesting", label: "Just Interesting" },
];

import { createClient } from "@/lib/supabase/server";
import type { CreateProjectInput, UpdateProjectInput } from "@/lib/validation/project";
import type { Project } from "@/types/database";

export async function listProjects(userId: string): Promise<Project[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as Project[];
}

export async function getProject(id: string): Promise<Project | null> {
  const supabase = createClient();
  const { data } = await supabase.from("projects").select("*").eq("id", id).single();
  return (data as Project) ?? null;
}

export async function createProject(
  userId: string,
  input: CreateProjectInput,
): Promise<{ project: Project | null; error: string | null }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({ user_id: userId, ...input })
    .select()
    .single();

  if (error) return { project: null, error: error.message };
  return { project: data as Project, error: null };
}

export async function updateProject(
  id: string,
  patch: UpdateProjectInput,
): Promise<{ project: Project | null; error: string | null }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("projects")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { project: null, error: error.message };
  return { project: data as Project, error: null };
}

export async function deleteProject(id: string): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  return { error: error?.message ?? null };
}

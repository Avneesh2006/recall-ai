import { createClient } from "@/lib/supabase/server";
import { updateProject, deleteProject } from "@/lib/db/projects";
import { updateProjectSchema } from "@/lib/validation/project";
import { NextResponse } from "next/server";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const parsed = updateProjectSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, {
      status: 400,
    });
  }

  const { project, error } = await updateProject(params.id, parsed.data);
  if (error || !project) {
    return NextResponse.json({ error: error ?? "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ project });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { error } = await deleteProject(params.id);
  if (error) return NextResponse.json({ error }, { status: 404 });

  return NextResponse.json({ ok: true });
}

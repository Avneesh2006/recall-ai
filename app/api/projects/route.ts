import { createClient } from "@/lib/supabase/server";
import { listProjects, createProject } from "@/lib/db/projects";
import { createProjectSchema } from "@/lib/validation/project";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const projects = await listProjects(user.id);
  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const parsed = createProjectSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, {
      status: 400,
    });
  }

  const { project, error } = await createProject(user.id, parsed.data);
  if (error || !project) {
    return NextResponse.json({ error: error ?? "Couldn't create that project." }, { status: 500 });
  }

  return NextResponse.json({ project }, { status: 201 });
}

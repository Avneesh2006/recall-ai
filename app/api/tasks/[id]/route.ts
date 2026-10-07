import { createClient } from "@/lib/supabase/server";
import { updateTask, deleteTask, getTaskReferenceItems } from "@/lib/db/tasks";
import { updateTaskSchema } from "@/lib/validation/task";
import { NextResponse } from "next/server";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const parsed = updateTaskSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, {
      status: 400,
    });
  }

  const { task, error } = await updateTask(params.id, parsed.data);
  if (error || !task) {
    return NextResponse.json({ error: error ?? "Task not found" }, { status: 404 });
  }

  return NextResponse.json({ task });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { error } = await deleteTask(params.id);
  if (error) return NextResponse.json({ error }, { status: 404 });

  return NextResponse.json({ ok: true });
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  // Used to lazily load a task's linked memories when its row expands.
  const items = await getTaskReferenceItems(params.id);
  return NextResponse.json({ items });
}

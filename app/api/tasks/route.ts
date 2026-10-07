import { createClient } from "@/lib/supabase/server";
import { listTasks, createTask } from "@/lib/db/tasks";
import { createTaskSchema } from "@/lib/validation/task";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const tasks = await listTasks(user.id);
  return NextResponse.json({ tasks });
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const parsed = createTaskSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, {
      status: 400,
    });
  }

  const { task, error } = await createTask(user.id, parsed.data);
  if (error || !task) {
    return NextResponse.json({ error: error ?? "Couldn't create that task." }, { status: 500 });
  }

  return NextResponse.json({ task }, { status: 201 });
}

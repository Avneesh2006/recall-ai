import { createClient } from "@/lib/supabase/server";
import { updateSavedItem, deleteSavedItem } from "@/lib/db/saved-items";
import { updateSavedItemSchema } from "@/lib/validation/saved-item";
import { NextResponse } from "next/server";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = updateSavedItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, {
      status: 400,
    });
  }

  // RLS enforces ownership on the update itself; this just gives a clean 404
  // instead of a confusing empty success for an item that isn't the user's.
  const { item, error } = await updateSavedItem(params.id, parsed.data);
  if (error || !item) {
    return NextResponse.json({ error: error ?? "Item not found" }, { status: 404 });
  }

  return NextResponse.json({ item });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { error } = await deleteSavedItem(params.id);
  if (error) return NextResponse.json({ error }, { status: 404 });

  return NextResponse.json({ ok: true });
}

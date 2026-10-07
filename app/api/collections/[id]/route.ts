import { createClient } from "@/lib/supabase/server";
import { updateCollection, deleteCollection } from "@/lib/db/collections";
import { updateCollectionSchema } from "@/lib/validation/collection";
import { NextResponse } from "next/server";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const parsed = updateCollectionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, {
      status: 400,
    });
  }

  const { collection, error } = await updateCollection(params.id, parsed.data);
  if (error || !collection) {
    return NextResponse.json({ error: error ?? "Collection not found" }, { status: 404 });
  }

  return NextResponse.json({ collection });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { error } = await deleteCollection(params.id);
  if (error) return NextResponse.json({ error }, { status: 404 });

  return NextResponse.json({ ok: true });
}

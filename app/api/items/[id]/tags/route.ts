import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const nameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Tag can't be empty")
  .max(40, "Keep tags under 40 characters");

/**
 * Add a user tag to an item. Tags are reusable per user (unique on
 * user_id + name), so this reuses an existing tag row when there is one.
 * If the AI had already added the same tag, the link is upgraded to
 * source = 'user' — the person has claimed it.
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const parsed = z.object({ name: nameSchema }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid tag" }, { status: 400 });
  }

  const { data: owned } = await supabase
    .from("saved_items")
    .select("id")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();
  if (!owned) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  const { data: tag, error: tagError } = await supabase
    .from("tags")
    .upsert({ user_id: user.id, name: parsed.data.name }, { onConflict: "user_id,name" })
    .select()
    .single();
  if (tagError || !tag) return NextResponse.json({ error: "Couldn't add that tag." }, { status: 500 });

  const { error: linkError } = await supabase
    .from("saved_item_tags")
    .upsert(
      { saved_item_id: params.id, tag_id: (tag as { id: string }).id, source: "user" },
      { onConflict: "saved_item_id,tag_id" },
    );
  if (linkError) return NextResponse.json({ error: "Couldn't add that tag." }, { status: 500 });

  return NextResponse.json({ tag: { name: parsed.data.name, source: "user" } }, { status: 201 });
}

/** Remove a tag from an item. The tag row itself stays, reusable elsewhere. */
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const name = nameSchema.safeParse(new URL(request.url).searchParams.get("name") ?? "");
  if (!name.success) return NextResponse.json({ error: "Invalid tag" }, { status: 400 });

  const { data: tag } = await supabase
    .from("tags")
    .select("id")
    .eq("user_id", user.id)
    .eq("name", name.data)
    .single();
  if (!tag) return NextResponse.json({ ok: true }); // already gone — idempotent

  const { error } = await supabase
    .from("saved_item_tags")
    .delete()
    .eq("saved_item_id", params.id)
    .eq("tag_id", (tag as { id: string }).id);
  if (error) return NextResponse.json({ error: "Couldn't remove that tag." }, { status: 500 });

  return NextResponse.json({ ok: true });
}

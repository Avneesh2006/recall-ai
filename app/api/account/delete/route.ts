import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

/**
 * Account deletion (Section 27). Deleting an auth.users row requires
 * the Admin API (service role) — a user's own session can never delete
 * itself. Cascades to profiles/saved_items/collections/projects/tasks/
 * tags via the `on delete cascade` foreign keys already in migration
 * 0001 — nothing extra to clean up at the table level, only Storage
 * objects (not covered by SQL cascades).
 */
export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const service = createServiceClient();

  const { data: files } = await service.storage.from("recall-uploads").list(user.id);
  if (files && files.length > 0) {
    await service.storage.from("recall-uploads").remove(files.map((f) => `${user.id}/${f.name}`));
  }

  const { error } = await service.auth.admin.deleteUser(user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}

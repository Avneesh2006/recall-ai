import { createClient } from "@/lib/supabase/server";
import { listCollections, createCollection } from "@/lib/db/collections";
import { createCollectionSchema } from "@/lib/validation/collection";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const collections = await listCollections(user.id);
  return NextResponse.json({ collections });
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const parsed = createCollectionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, {
      status: 400,
    });
  }

  const { collection, error } = await createCollection(user.id, parsed.data);
  if (error || !collection) {
    return NextResponse.json({ error: error ?? "Couldn't create that collection." }, {
      status: 500,
    });
  }

  return NextResponse.json({ collection }, { status: 201 });
}

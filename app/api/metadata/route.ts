import { createClient } from "@/lib/supabase/server";
import { fetchUrlMetadata } from "@/lib/metadata";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({ url: z.string().trim().url() });

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid URL" }, { status: 400 });

  const metadata = await fetchUrlMetadata(parsed.data.url);
  return NextResponse.json({ metadata });
}
